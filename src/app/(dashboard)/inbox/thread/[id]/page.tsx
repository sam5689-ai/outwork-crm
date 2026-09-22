import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { setMessageRead } from "@/lib/gmail";
import { resolveEmailHtml } from "@/lib/email-content";
import { EmailBody } from "@/components/contacts/email-body";
import { Card } from "@/components/ui/card";
import { ThreadActions } from "@/components/inbox/thread-actions";
import { ReplyBox } from "@/components/inbox/reply-box";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const anchor = await prisma.emailMessage.findFirst({
    where: { id, syncedByUserId: user.id },
  });
  if (!anchor) notFound();

  const messages = anchor.gmailThreadId
    ? await prisma.emailMessage.findMany({
        where: {
          syncedByUserId: user.id,
          gmailThreadId: anchor.gmailThreadId,
        },
        orderBy: { sentAt: "asc" },
      })
    : [anchor];

  const unread = messages.filter((m) => !m.isRead && m.gmailMessageId);
  for (const message of unread) {
    try {
      await setMessageRead(user.id, message.gmailMessageId!, true);
      await prisma.emailMessage.update({
        where: { id: message.id },
        data: { isRead: true },
      });
    } catch {
      // Best-effort - leave it unread locally if Gmail couldn't be updated
    }
  }

  const latest = messages[messages.length - 1];
  const messageIds = messages.map((m) => m.id);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href="/inbox"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inbox
        </Link>
        <ThreadActions
          messageIds={messageIds}
          isStarred={messages.some((m) => m.isStarred)}
          inTrash={latest.folder === "TRASH"}
        />
      </div>

      <Card className="p-0">
        <div className="border-b border-neutral-200 p-4">
          <h1 className="text-lg font-semibold text-neutral-900">
            {latest.subject}
          </h1>
        </div>

        <div className="divide-y divide-neutral-100">
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1;
            const html = resolveEmailHtml(message);
            return (
              <details key={message.id} open={isLast} className="p-4">
                <summary className="flex cursor-pointer items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {message.fromAddress}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      To: {message.toAddress}
                      {message.cc ? ` · Cc: ${message.cc}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {message.sentAt.toLocaleString()}
                  </span>
                </summary>
                <EmailBody
                  html={html}
                  text={html ? null : message.body}
                  attachments={message.attachments}
                  messageId={message.gmailMessageId}
                />
              </details>
            );
          })}
        </div>
      </Card>

      <div className="mt-4">
        <ReplyBox
          defaultTo={
            latest.direction === "INBOUND" ? latest.fromAddress : latest.toAddress
          }
          defaultSubject={
            latest.subject.toLowerCase().startsWith("re:")
              ? latest.subject
              : `Re: ${latest.subject}`
          }
          threadId={latest.gmailThreadId ?? undefined}
          inReplyToMessageId={latest.gmailMessageId ?? ""}
        />
      </div>
    </div>
  );
}
