"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { applyMessageAction, type BulkActionKind } from "@/app/(dashboard)/inbox/actions";

export function ThreadActions({
  messageIds,
  isStarred,
  inTrash,
}: {
  messageIds: string[];
  isStarred: boolean;
  inTrash: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: BulkActionKind, redirect?: boolean) {
    startTransition(async () => {
      await applyMessageAction(messageIds, action);
      if (redirect) router.push("/inbox");
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(isStarred ? "unstar" : "star")}
        aria-label={isStarred ? "Unstar" : "Star"}
        className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50 hover:text-amber-500"
      >
        <Star className={isStarred ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4"} />
      </button>
      {inTrash ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run("untrash", true)}
          aria-label="Restore"
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
        >
          <ArchiveRestore className="h-4 w-4" />
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run("archive", true)}
            aria-label="Archive"
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run("trash", true)}
            aria-label="Trash"
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
