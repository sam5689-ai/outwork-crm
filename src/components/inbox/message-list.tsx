"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Star, Mail, MailOpen, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { applyMessageAction, type BulkActionKind } from "@/app/(dashboard)/inbox/actions";
import type { InboxView } from "@/lib/inbox";

type Row = {
  id: string;
  subject: string;
  fromAddress: string;
  snippet: string | null;
  isRead: boolean;
  isStarred: boolean;
  sentAt: string;
  contactName: string | null;
  contactId: string | null;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function senderLabel(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*<[^>]+>$/);
  return (match ? match[1] : from).trim();
}

export function MessageList({
  view,
  messages,
}: {
  view: InboxView;
  messages: Row[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runAction(action: BulkActionKind, ids: string[]) {
    setError(null);
    startTransition(async () => {
      const result = await applyMessageAction(ids, action);
      if (result?.error) setError(result.error);
      setSelected(new Set());
    });
  }

  if (messages.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-neutral-400">
        Nothing here.
      </p>
    );
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5">
          <span className="text-xs font-medium text-neutral-500">
            {selected.size} selected
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction("read", [...selected])}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
          >
            <MailOpen className="h-3.5 w-3.5" /> Read
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction("unread", [...selected])}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
          >
            <Mail className="h-3.5 w-3.5" /> Unread
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction("star", [...selected])}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
          >
            <Star className="h-3.5 w-3.5" /> Star
          </button>
          {view === "TRASH" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction("untrash", [...selected])}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
            >
              <ArchiveRestore className="h-3.5 w-3.5" /> Restore
            </button>
          ) : (
            <>
              {view !== "ARCHIVE" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runAction("archive", [...selected])}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  <Archive className="h-3.5 w-3.5" /> Archive
                </button>
              )}
              <button
                type="button"
                disabled={isPending}
                onClick={() => runAction("trash", [...selected])}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Trash
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="border-b border-neutral-200 bg-red-50 px-4 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <ul className="divide-y divide-neutral-50">
        {messages.map((message) => (
          <li
            key={message.id}
            className={clsx(
              "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-neutral-50",
              !message.isRead && "bg-blue-50/30"
            )}
          >
            <input
              type="checkbox"
              checked={selected.has(message.id)}
              onChange={() => toggle(message.id)}
              className="h-4 w-4 shrink-0 rounded border-neutral-300"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                runAction(message.isStarred ? "unstar" : "star", [message.id])
              }
              className="shrink-0 text-neutral-300 hover:text-amber-400"
              aria-label={message.isStarred ? "Unstar" : "Star"}
            >
              <Star
                className={clsx(
                  "h-4 w-4",
                  message.isStarred && "fill-amber-400 text-amber-400"
                )}
              />
            </button>
            <Link
              href={`/inbox/thread/${message.id}`}
              onClick={() => {
                if (!message.isRead) runAction("read", [message.id]);
              }}
              className="min-w-0 flex-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={clsx(
                    "truncate text-sm",
                    !message.isRead
                      ? "font-semibold text-neutral-900"
                      : "font-medium text-neutral-600"
                  )}
                >
                  {message.contactName ?? senderLabel(message.fromAddress)}
                </span>
                <span className="shrink-0 text-xs text-neutral-400">
                  {formatWhen(message.sentAt)}
                </span>
              </div>
              <p
                className={clsx(
                  "truncate text-sm",
                  !message.isRead ? "text-neutral-800" : "text-neutral-500"
                )}
              >
                {message.subject}
                {message.snippet && (
                  <span className="text-neutral-400"> - {message.snippet}</span>
                )}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
