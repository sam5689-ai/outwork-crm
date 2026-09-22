import { google, gmail_v1 } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getUserGoogleClient } from "@/lib/google";
import type { Contact } from "@/generated/prisma/client";

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts?.length) {
    const plain = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);
    const html = payload.parts.find((p) => p.mimeType === "text/html");
    if (html?.body?.data) return decodeBase64Url(html.body.data);
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }
  return "";
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

      const headers = message.payload?.headers;
      const subject = getHeader(headers, "Subject") || "(no subject)";
      const fromAddress = getHeader(headers, "From");
      const toAddress = getHeader(headers, "To");
      const dateHeader = getHeader(headers, "Date");
      const sentAt = dateHeader ? new Date(dateHeader) : new Date();
      const direction = message.labelIds?.includes("SENT")
        ? "OUTBOUND"
        : "INBOUND";

      const row = await prisma.emailMessage.create({
        data: {
          contactId: contact.id,
          gmailMessageId: message.id,
          gmailThreadId: message.threadId,
          subject,
          fromAddress,
          toAddress,
          snippet: message.snippet ?? null,
          body: extractBody(message.payload) || message.snippet || null,
          direction,
          sentAt: Number.isNaN(sentAt.getTime()) ? new Date() : sentAt,
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
