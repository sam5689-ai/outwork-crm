import Link from "next/link";
import { clsx } from "clsx";
import { Inbox as InboxIcon, Send, Archive, Trash2, FileText, Star, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getGoogleFeatures } from "@/lib/google-features";
import { syncInboxFolder, syncStarred, GmailApiError, GmailNotConnectedError } from "@/lib/gmail";
import { INBOX_FOLDERS, FOLDER_LABELS, type InboxView } from "@/lib/inbox";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { MessageList } from "@/components/inbox/message-list";
import { ComposeButton } from "@/components/inbox/compose-button";

const FOLDER_ICONS: Record<InboxView, typeof InboxIcon> = {
  INBOX: InboxIcon,
  SENT: Send,
  ARCHIVE: Archive,
  TRASH: Trash2,
  DRAFT: FileText,
  STARRED: Star,
};

function parseView(raw: string | undefined): InboxView {
  const upper = (raw ?? "INBOX").toUpperCase();
  if (upper === "STARRED") return "STARRED";
  return INBOX_FOLDERS.includes(upper as (typeof INBOX_FOLDERS)[number])
    ? (upper as InboxView)
    : "INBOX";
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { folder: rawFolder, q } = await searchParams;
  const view = parseView(rawFolder);

  const [features, account] = await Promise.all([
    getGoogleFeatures(),
    prisma.googleAccount.findUnique({ where: { userId: user.id } }),
  ]);

  if (!features.inboxEnabled) {
    return (
      <div>
        <PageHeader title="Inbox" description="A Gmail-style inbox inside the CRM" />
        <Card>
          <p className="text-sm text-neutral-500">
            The inbox isn&apos;t turned on yet.{" "}
            <Link href="/settings/integrations" className="text-blue-600 hover:underline">
              Turn it on in Settings
            </Link>{" "}
            to browse and reply to your connected Gmail account here.
          </p>
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <div>
        <PageHeader title="Inbox" description="A Gmail-style inbox inside the CRM" />
        <Card>
          <p className="text-sm text-neutral-500">
            Connect your Google account in{" "}
            <Link href="/settings/integrations" className="text-blue-600 hover:underline">
              Settings
            </Link>{" "}
            to use the inbox.
          </p>
        </Card>
      </div>
    );
  }

  const hasInboxScope = account.scope?.includes("gmail.modify");
  if (!hasInboxScope) {
    return (
      <div>
        <PageHeader title="Inbox" description="A Gmail-style inbox inside the CRM" />
        <Card>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div className="text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">Reconnect required</p>
              <p className="mt-1">
                Your Google connection needs to be refreshed to grant the inbox
                permission to send and organize mail.
              </p>
              <LinkButton href="/api/google/connect" className="mt-3">
                Reconnect Google Account
              </LinkButton>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  let syncError: string | null = null;
  try {
    if (view === "STARRED") {
      await syncStarred(user.id);
    } else {
      await syncInboxFolder(user.id, view);
    }
  } catch (err) {
    if (err instanceof GmailNotConnectedError) {
      syncError = "Google account not connected.";
    } else if (err instanceof GmailApiError) {
      syncError = err.message;
    } else {
      syncError = "Couldn't sync with Gmail right now.";
    }
  }

  const where = {
    syncedByUserId: user.id,
    ...(view === "STARRED" ? { isStarred: true } : { folder: view }),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" as const } },
            { body: { contains: q, mode: "insensitive" as const } },
            { fromAddress: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [messages, unreadCounts, starredCount] = await Promise.all([
    prisma.emailMessage.findMany({
      where,
      orderBy: { sentAt: "desc" },
      take: 50,
      include: { contact: true },
    }),
    prisma.emailMessage.groupBy({
      by: ["folder"],
      where: { syncedByUserId: user.id, isRead: false },
      _count: { _all: true },
    }),
    prisma.emailMessage.count({
      where: { syncedByUserId: user.id, isStarred: true },
    }),
  ]);

  const unreadByFolder = Object.fromEntries(
    unreadCounts.map((row) => [row.folder, row._count._all])
  );

  // Keep only the latest message per thread for the list view.
  const seenThreads = new Set<string>();
  const threadRows = messages.filter((message) => {
    const key = message.gmailThreadId ?? message.id;
    if (seenThreads.has(key)) return false;
    seenThreads.add(key);
    return true;
  });

  const navItems: { view: InboxView; badge: number }[] = [
    { view: "INBOX", badge: unreadByFolder.INBOX ?? 0 },
    { view: "STARRED", badge: starredCount },
    { view: "SENT", badge: 0 },
    { view: "DRAFT", badge: 0 },
    { view: "ARCHIVE", badge: 0 },
    { view: "TRASH", badge: 0 },
  ];

  return (
    <div>
      <PageHeader
        title="Inbox"
        description={`Connected as ${account.googleEmail}`}
        actions={<ComposeButton />}
      />

      {syncError && (
        <Card className="mb-4">
          <p className="flex items-center gap-2 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {syncError} Showing previously synced messages.
          </p>
        </Card>
      )}

      <Card className="p-0">
        <div className="flex flex-col md:flex-row">
          <nav className="shrink-0 border-b border-neutral-200 p-3 md:w-48 md:border-b-0 md:border-r">
            <ul className="flex gap-1 overflow-x-auto md:block md:space-y-1 md:overflow-visible">
              {navItems.map(({ view: itemView, badge }) => {
                const Icon = FOLDER_ICONS[itemView];
                const label =
                  itemView === "STARRED" ? "Starred" : FOLDER_LABELS[itemView];
                const active = itemView === view;
                return (
                  <li key={itemView} className="shrink-0">
                    <Link
                      href={`/inbox?folder=${itemView}`}
                      className={clsx(
                        "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-neutral-100 text-neutral-900"
                          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </span>
                      {badge > 0 && (
                        <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-xs font-semibold text-white">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0 flex-1">
            <form className="border-b border-neutral-200 p-3">
              <input type="hidden" name="folder" value={view} />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search mail..."
                className="w-full max-w-sm rounded-lg border border-neutral-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </form>

            <MessageList
              view={view}
              messages={threadRows.map((m) => ({
                id: m.id,
                subject: m.subject,
                fromAddress: m.fromAddress,
                snippet: m.snippet,
                isRead: m.isRead,
                isStarred: m.isStarred,
                sentAt: m.sentAt.toISOString(),
                contactName: m.contact
                  ? `${m.contact.firstName} ${m.contact.lastName}`
                  : null,
                contactId: m.contactId,
              }))}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
