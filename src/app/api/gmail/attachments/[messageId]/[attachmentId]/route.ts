import { google } from "googleapis";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserGoogleClient } from "@/lib/google";
import type { EmailAttachment } from "@/lib/gmail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ messageId: string; attachmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messageId, attachmentId } = await params;

  const email = await prisma.emailMessage.findUnique({
    where: { gmailMessageId: messageId },
    select: { syncedByUserId: true, attachments: true },
  });
  if (!email?.syncedByUserId) {
    return new Response("Not found", { status: 404 });
  }

  const attachments = Array.isArray(email.attachments)
    ? (email.attachments as unknown as EmailAttachment[])
    : [];
  const meta = attachments.find((a) => a.attachmentId === attachmentId);
  if (!meta) {
    return new Response("Not found", { status: 404 });
  }

  const googleAuth = await getUserGoogleClient(email.syncedByUserId);
  if (!googleAuth) {
    return new Response("Not found", { status: 404 });
  }

  const gmail = google.gmail({ version: "v1", auth: googleAuth });
  let base64Data: string | null | undefined;
  try {
    const { data } = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });
    base64Data = data.data;
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!base64Data) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = Buffer.from(base64Data, "base64url");
  const safeFilename = meta.filename.replace(/["\r\n]/g, "");
  const disposition = meta.inline
    ? "inline"
    : `attachment; filename="${safeFilename}"`;

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": meta.mimeType || "application/octet-stream",
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
