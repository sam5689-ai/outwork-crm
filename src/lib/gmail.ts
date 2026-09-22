import { google, gmail_v1 } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getUserGoogleClient } from "@/lib/google";
import { resolveInlineImageUrls } from "@/lib/email-content";
import type { Contact } from "@/generated/prisma/client";

export type EmailAttachment = {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
  contentId: string | null;
  inline: boolean;
};

type ExtractedContent = {
  text: string;
  html: string;
  attachments: EmailAttachment[];
};

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())
      ?.value ?? ""
  );
}

function walkParts(
  part: gmail_v1.Schema$MessagePart | undefined,
  result: ExtractedContent
): void {
  if (!part) return;

  const mimeType = part.mimeType ?? "";
  const attachmentId = part.body?.attachmentId;

  if (attachmentId) {
    const contentId =
      getHeader(part.headers, "Content-ID").replace(/^<|>$/g, "") || null;
    const disposition = getHeader(part.headers, "Content-Disposition");
    result.attachments.push({
      attachmentId,
      filename: part.filename || "attachment",
      mimeType: mimeType || "application/octet-stream",
      size: part.body?.size ?? 0,
      contentId,
      inline: Boolean(contentId) || disposition.toLowerCase().includes("inline"),
    });
    return;
  }

  if (part.body?.data) {
    if (mimeType === "text/plain" && !result.text) {
      result.text = decodeBase64Url(part.body.data);
    } else if (mimeType === "text/html" && !result.html) {
      result.html = decodeBase64Url(part.body.data);
    }
  }

  if (part.parts?.length) {
    for (const child of part.parts) walkParts(child, result);
  }
}

function extractContent(
  payload: gmail_v1.Schema$MessagePart | undefined
): ExtractedContent {
  const result: ExtractedContent = { text: "", html: "", attachments: [] };
  walkParts(payload, result);
  return result;
}

/**
 * Pulls Gmail messages to/from the contact's email address for the given
 * user's connected Google account, and saves any not already synced.
 * Returns the newly-created EmailMessage rows (empty if nothing new, or
 * nothing was synced e.g. no Google account / no contact email).
 */
export async function syncContactEmails(userId: string, contact: Contact) {
  if (!contact.email) return [];

  const auth = await getUserGoogleClient(userId);
  if (!auth) return [];

  const gmail = google.gmail({ version: "v1", auth });

  const existing = await prisma.emailMessage.findMany({
    where: { contactId: contact.id, gmailMessageId: { not: null } },
    select: { gmailMessageId: true },
  });
  const existingIds = new Set(existing.map((e) => e.gmailMessageId));

  let list;
  try {
    list = await gmail.users.messages.list({
      userId: "me",
      q: `(from:${contact.email} OR to:${contact.email})`,
      maxResults: 15,
    });
  } catch {
    // Gmail API unreachable / token invalid - fail quietly, keep cached emails
    return [];
  }

  const messageRefs = list.data.messages ?? [];
  const newOnes = messageRefs.filter((m) => m.id && !existingIds.has(m.id));

  const created = [];
  for (const ref of newOnes) {
    if (!ref.id) continue;
    try {
      const { data: message } = await gmail.users.messages.get({
        userId: "me",
        id: ref.id,
        format: "full",
      });
      if (!message.id) continue;

      const headers = message.payload?.headers;
      const subject = getHeader(headers, "Subject") || "(no subject)";
      const fromAddress = getHeader(headers, "From");
      const toAddress = getHeader(headers, "To");
      const dateHeader = getHeader(headers, "Date");
      const sentAt = dateHeader ? new Date(dateHeader) : new Date();
      const direction = message.labelIds?.includes("SENT")
        ? "OUTBOUND"
        : "INBOUND";

      const { text, html, attachments } = extractContent(message.payload);
      const bodyHtml = html
        ? resolveInlineImageUrls(html, message.id, attachments)
        : null;

      const row = await prisma.emailMessage.create({
        data: {
          contactId: contact.id,
          gmailMessageId: message.id,
          gmailThreadId: message.threadId,
          subject,
          fromAddress,
          toAddress,
          snippet: message.snippet ?? null,
          body: text || message.snippet || null,
          bodyHtml,
          attachments: attachments.length > 0 ? attachments : undefined,
          direction,
          sentAt: Number.isNaN(sentAt.getTime()) ? new Date() : sentAt,
          syncedByUserId: userId,
        },
      });
      created.push(row);
    } catch {
      // Skip messages that fail to fetch/parse; keep syncing the rest
      continue;
    }
  }

  return created;
}
