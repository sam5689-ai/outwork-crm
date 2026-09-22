"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  GmailApiError,
  GmailNotConnectedError,
  setMessageRead,
  setMessageStarred,
  archiveMessage,
  moveToInbox,
  trashMessage,
  untrashMessage,
  sendEmail,
  type OutgoingAttachment,
} from "@/lib/gmail";

function revalidateInbox() {
  revalidatePath("/inbox", "layout");
}

export type BulkActionKind =
  | "read"
  | "unread"
  | "star"
  | "unstar"
  | "archive"
  | "trash"
  | "untrash";

export type ActionResult = { error?: string } | undefined;

/**
 * Applies a bulk (or single) action to a set of messages: calls the Gmail
 * API for each first and only updates local state for the ones that
 * succeed, so the CRM never drifts out of sync with the real mailbox.
 */
export async function applyMessageAction(
  messageIds: string[],
  action: BulkActionKind
): Promise<ActionResult> {
  const user = await requireUser();

  const messages = await prisma.emailMessage.findMany({
    where: { id: { in: messageIds }, syncedByUserId: user.id },
  });
  if (messages.length === 0) return { error: "No messages found." };

  let failures = 0;
  for (const message of messages) {
    if (!message.gmailMessageId) continue;
    try {
      switch (action) {
        case "read":
          await setMessageRead(user.id, message.gmailMessageId, true);
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: { isRead: true },
          });
          break;
        case "unread":
          await setMessageRead(user.id, message.gmailMessageId, false);
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: { isRead: false },
          });
          break;
        case "star":
          await setMessageStarred(user.id, message.gmailMessageId, true);
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: { isStarred: true },
          });
          break;
        case "unstar":
          await setMessageStarred(user.id, message.gmailMessageId, false);
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: { isStarred: false },
          });
          break;
        case "archive":
          await archiveMessage(user.id, message.gmailMessageId);
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: { folder: "ARCHIVE" },
          });
          break;
        case "trash":
          await trashMessage(user.id, message.gmailMessageId);
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: { folder: "TRASH" },
          });
          break;
        case "untrash":
          await untrashMessage(user.id, message.gmailMessageId);
          await moveToInbox(user.id, message.gmailMessageId);
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: { folder: "INBOX" },
          });
          break;
      }
    } catch (err) {
      failures += 1;
      if (err instanceof GmailNotConnectedError) {
        revalidateInbox();
        return { error: "Your Google account isn't connected anymore." };
      }
    }
  }

  revalidateInbox();
  if (failures > 0) {
    return {
      error: `${failures} of ${messages.length} message(s) couldn't be updated. Your connection may need to be refreshed in Settings.`,
    };
  }
  return undefined;
}

const MAX_ATTACHMENTS_BYTES = 20 * 1024 * 1024; // Gmail's own cap is ~25MB

async function parseAttachments(formData: FormData): Promise<OutgoingAttachment[]> {
  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  let total = 0;
  const attachments: OutgoingAttachment[] = [];
  for (const file of files) {
    total += file.size;
    if (total > MAX_ATTACHMENTS_BYTES) {
      throw new Error("Attachments are too large (max 20MB total).");
    }
    attachments.push({
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      content: Buffer.from(await file.arrayBuffer()),
    });
  }
  return attachments;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export type ComposeState = { error?: string; success?: boolean } | undefined;

export async function sendComposedEmail(
  _prevState: ComposeState,
  formData: FormData
): Promise<ComposeState> {
  const user = await requireUser();

  const to = formData.get("to")?.toString().trim();
  const cc = formData.get("cc")?.toString().trim();
  const bcc = formData.get("bcc")?.toString().trim();
  const subject = formData.get("subject")?.toString().trim() || "(no subject)";
  const bodyHtml = formData.get("bodyHtml")?.toString() || "";
  const threadId = formData.get("threadId")?.toString() || undefined;
  const inReplyToMessageId =
    formData.get("inReplyToMessageId")?.toString() || undefined;
  const draftId = formData.get("draftId")?.toString() || undefined;

  if (!to) return { error: "Add at least one recipient." };
  if (!bodyHtml.trim()) return { error: "Write a message before sending." };

  let attachments: OutgoingAttachment[];
  try {
    attachments = await parseAttachments(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Attachment error." };
  }

  try {
    await sendEmail(user.id, {
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      html: bodyHtml,
      text: htmlToPlainText(bodyHtml),
      attachments,
      threadId,
      inReplyToMessageId,
    });
  } catch (err) {
    if (err instanceof GmailNotConnectedError) {
      return { error: "Connect your Google account in Settings to send email." };
    }
    if (err instanceof GmailApiError) {
      return { error: err.message };
    }
    return { error: "Something went wrong sending that email." };
  }

  if (draftId) {
    await prisma.emailMessage
      .delete({ where: { id: draftId, syncedByUserId: user.id } })
      .catch(() => undefined);
  }

  revalidateInbox();
  return { success: true };
}

export type DraftState = { error?: string; draftId?: string } | undefined;

export async function saveDraftEmail(
  _prevState: DraftState,
  formData: FormData
): Promise<DraftState> {
  const user = await requireUser();

  const to = formData.get("to")?.toString().trim() || "";
  const cc = formData.get("cc")?.toString().trim() || "";
  const bcc = formData.get("bcc")?.toString().trim() || "";
  const subject = formData.get("subject")?.toString().trim() || "(no subject)";
  const bodyHtml = formData.get("bodyHtml")?.toString() || "";
  const draftId = formData.get("draftId")?.toString() || undefined;

  const account = await prisma.googleAccount.findUnique({
    where: { userId: user.id },
  });

  const data = {
    subject,
    fromAddress: account?.googleEmail ?? "",
    toAddress: to,
    cc: cc || null,
    bcc: bcc || null,
    snippet: htmlToPlainText(bodyHtml).slice(0, 200),
    body: htmlToPlainText(bodyHtml),
    bodyHtml,
    direction: "OUTBOUND" as const,
    folder: "DRAFT" as const,
    isRead: true,
    isStarred: false,
    sentAt: new Date(),
    syncedByUserId: user.id,
  };

  const draft = draftId
    ? await prisma.emailMessage
        .update({ where: { id: draftId, syncedByUserId: user.id }, data })
        .catch(() => null)
    : null;

  const saved =
    draft ?? (await prisma.emailMessage.create({ data }));

  revalidateInbox();
  return { draftId: saved.id };
}

export async function deleteDraft(draftId: string) {
  const user = await requireUser();
  await prisma.emailMessage.deleteMany({
    where: { id: draftId, syncedByUserId: user.id, folder: "DRAFT" },
  });
  revalidateInbox();
}
