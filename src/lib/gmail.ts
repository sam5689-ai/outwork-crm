import { google, gmail_v1 } from "googleapis";
import MailComposer from "nodemailer/lib/mail-composer";
import { prisma } from "@/lib/prisma";
import { getUserGoogleClient } from "@/lib/google";
import { resolveInlineImageUrls } from "@/lib/email-content";
import type { Contact } from "@/generated/prisma/client";
import type { EmailFolder } from "@/generated/prisma/enums";

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

export class GmailNotConnectedError extends Error {
  constructor() {
    super("Google account not connected.");
    this.name = "GmailNotConnectedError";
  }
}

export class GmailApiError extends Error {
  constructor(action: string, cause: unknown) {
    super(`Gmail ${action} failed. Your connection may need to be refreshed.`);
    this.name = "GmailApiError";
    this.cause = cause;
  }
}

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

function mapLabelsToFolder(labelIds: string[] | undefined): EmailFolder {
  const labels = labelIds ?? [];
  if (labels.includes("TRASH")) return "TRASH";
  if (labels.includes("DRAFT")) return "DRAFT";
  if (labels.includes("SENT")) return "SENT";
  if (labels.includes("INBOX")) return "INBOX";
  return "ARCHIVE";
}

/** Gmail search queries used to sync each folder tab. */
export const FOLDER_QUERIES: Record<EmailFolder, string> = {
  INBOX: "in:inbox",
  SENT: "in:sent",
  ARCHIVE: "-in:inbox -in:sent -in:trash -in:spam -in:draft",
  TRASH: "in:trash",
  DRAFT: "in:draft",
};

async function findMatchingContactId(addresses: string[]): Promise<string | null> {
  const emails = addresses
    .map((a) => extractEmailAddress(a))
    .filter((a): a is string => Boolean(a));
  if (emails.length === 0) return null;

  const contact = await prisma.contact.findFirst({
    where: { email: { in: emails, mode: "insensitive" } },
  });
  return contact?.id ?? null;
}

function extractEmailAddress(headerValue: string): string | null {
  const match = headerValue.match(/<([^>]+)>/);
  const address = (match ? match[1] : headerValue).trim();
  return address.includes("@") ? address.toLowerCase() : null;
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
          cc: getHeader(headers, "Cc") || null,
          bcc: getHeader(headers, "Bcc") || null,
          snippet: message.snippet ?? null,
          body: text || message.snippet || null,
          bodyHtml,
          attachments: attachments.length > 0 ? attachments : undefined,
          direction,
          folder: mapLabelsToFolder(message.labelIds ?? undefined),
          isRead: !message.labelIds?.includes("UNREAD"),
          isStarred: Boolean(message.labelIds?.includes("STARRED")),
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

/**
 * Syncs a whole folder (Inbox, Sent, Archive, Trash) for the user's own
 * mailbox, not scoped to a single contact - powers the inbox view. Only
 * fetches messages we haven't already stored; existing rows keep whatever
 * read/starred state our own mutations last set.
 */
export async function syncInboxFolder(
  userId: string,
  folder: EmailFolder,
  maxResults = 25
) {
  if (folder === "DRAFT") return []; // drafts are managed locally only
  return syncByQuery(userId, FOLDER_QUERIES[folder], maxResults);
}

/** Syncs every starred message regardless of folder - powers the Starred view. */
export async function syncStarred(userId: string, maxResults = 25) {
  return syncByQuery(userId, "is:starred", maxResults);
}

async function syncByQuery(userId: string, query: string, maxResults: number) {
  const auth = await getUserGoogleClient(userId);
  if (!auth) throw new GmailNotConnectedError();

  const gmail = google.gmail({ version: "v1", auth });

  const existing = await prisma.emailMessage.findMany({
    where: { syncedByUserId: userId, gmailMessageId: { not: null } },
    select: { gmailMessageId: true },
  });
  const existingIds = new Set(existing.map((e) => e.gmailMessageId));

  let list;
  try {
    list = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });
  } catch (err) {
    throw new GmailApiError("sync", err);
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

      const contactId = await findMatchingContactId([fromAddress, toAddress]);

      const row = await prisma.emailMessage.create({
        data: {
          contactId,
          gmailMessageId: message.id,
          gmailThreadId: message.threadId,
          subject,
          fromAddress,
          toAddress,
          cc: getHeader(headers, "Cc") || null,
          bcc: getHeader(headers, "Bcc") || null,
          snippet: message.snippet ?? null,
          body: text || message.snippet || null,
          bodyHtml,
          attachments: attachments.length > 0 ? attachments : undefined,
          direction,
          folder: mapLabelsToFolder(message.labelIds ?? undefined),
          isRead: !message.labelIds?.includes("UNREAD"),
          isStarred: Boolean(message.labelIds?.includes("STARRED")),
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

async function modifyLabels(
  userId: string,
  gmailMessageId: string,
  addLabelIds: string[],
  removeLabelIds: string[]
) {
  const auth = await getUserGoogleClient(userId);
  if (!auth) throw new GmailNotConnectedError();
  const gmail = google.gmail({ version: "v1", auth });

  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: gmailMessageId,
      requestBody: { addLabelIds, removeLabelIds },
    });
  } catch (err) {
    throw new GmailApiError("update", err);
  }
}

export async function setMessageRead(
  userId: string,
  gmailMessageId: string,
  read: boolean
) {
  await modifyLabels(userId, gmailMessageId, read ? [] : ["UNREAD"], read ? ["UNREAD"] : []);
}

export async function setMessageStarred(
  userId: string,
  gmailMessageId: string,
  starred: boolean
) {
  await modifyLabels(userId, gmailMessageId, starred ? ["STARRED"] : [], starred ? [] : ["STARRED"]);
}

export async function archiveMessage(userId: string, gmailMessageId: string) {
  await modifyLabels(userId, gmailMessageId, [], ["INBOX"]);
}

export async function moveToInbox(userId: string, gmailMessageId: string) {
  await modifyLabels(userId, gmailMessageId, ["INBOX"], ["TRASH"]);
}

export async function trashMessage(userId: string, gmailMessageId: string) {
  const auth = await getUserGoogleClient(userId);
  if (!auth) throw new GmailNotConnectedError();
  const gmail = google.gmail({ version: "v1", auth });
  try {
    await gmail.users.messages.trash({ userId: "me", id: gmailMessageId });
  } catch (err) {
    throw new GmailApiError("trash", err);
  }
}

export async function untrashMessage(userId: string, gmailMessageId: string) {
  const auth = await getUserGoogleClient(userId);
  if (!auth) throw new GmailNotConnectedError();
  const gmail = google.gmail({ version: "v1", auth });
  try {
    await gmail.users.messages.untrash({ userId: "me", id: gmailMessageId });
  } catch (err) {
    throw new GmailApiError("untrash", err);
  }
}

export type OutgoingAttachment = {
  filename: string;
  mimeType: string;
  content: Buffer;
};

/**
 * Sends a new email (or a reply, when threadId/inReplyTo are given) via the
 * connected Gmail account, and stores a local copy in the SENT folder.
 */
export async function sendEmail(
  userId: string,
  options: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    html: string;
    text: string;
    attachments?: OutgoingAttachment[];
    threadId?: string;
    inReplyToMessageId?: string;
  }
) {
  const auth = await getUserGoogleClient(userId);
  if (!auth) throw new GmailNotConnectedError();

  const account = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!account) throw new GmailNotConnectedError();

  const gmail = google.gmail({ version: "v1", auth });

  let headers: Record<string, string> | undefined;
  if (options.inReplyToMessageId) {
    try {
      const { data: original } = await gmail.users.messages.get({
        userId: "me",
        id: options.inReplyToMessageId,
        format: "metadata",
        metadataHeaders: ["Message-ID", "References"],
      });
      const originalMessageId = getHeader(original.payload?.headers, "Message-ID");
      const originalReferences = getHeader(original.payload?.headers, "References");
      if (originalMessageId) {
        headers = {
          "In-Reply-To": originalMessageId,
          References: [originalReferences, originalMessageId]
            .filter(Boolean)
            .join(" "),
        };
      }
    } catch {
      // Non-fatal - send without threading headers rather than fail outright
    }
  }

  const composer = new MailComposer({
    from: account.googleEmail,
    to: options.to,
    cc: options.cc || undefined,
    bcc: options.bcc || undefined,
    subject: options.subject,
    html: options.html,
    text: options.text,
    headers,
    attachments: options.attachments?.map((a) => ({
      filename: a.filename,
      contentType: a.mimeType,
      content: a.content,
    })),
  });

  const built = await new Promise<Buffer>((resolve, reject) => {
    composer.compile().build((err, message) => {
      if (err) reject(err);
      else resolve(message);
    });
  });

  const raw = built.toString("base64url");

  let sent;
  try {
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw, threadId: options.threadId },
    });
    sent = response.data;
  } catch (err) {
    throw new GmailApiError("send", err);
  }
  if (!sent.id) throw new GmailApiError("send", new Error("No message id returned"));

  const contactId = await findMatchingContactId([
    options.to,
    options.cc ?? "",
    options.bcc ?? "",
  ]);

  return prisma.emailMessage.create({
    data: {
      contactId,
      gmailMessageId: sent.id,
      gmailThreadId: sent.threadId ?? options.threadId,
      subject: options.subject,
      fromAddress: account.googleEmail,
      toAddress: options.to,
      cc: options.cc || null,
      bcc: options.bcc || null,
      snippet: options.text.slice(0, 200),
      body: options.text,
      bodyHtml: options.html,
      direction: "OUTBOUND",
      folder: "SENT",
      isRead: true,
      isStarred: false,
      sentAt: new Date(),
      syncedByUserId: userId,
    },
  });
}
