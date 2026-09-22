"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComposerForm } from "./composer-form";

export function ReplyBox({
  defaultTo,
  defaultSubject,
  threadId,
  inReplyToMessageId,
}: {
  defaultTo: string;
  defaultSubject: string;
  threadId?: string;
  inReplyToMessageId: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleDone() {
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Reply className="h-4 w-4" />
        Reply
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-3">
      <ComposerForm
        defaultTo={defaultTo}
        defaultSubject={defaultSubject}
        threadId={threadId}
        inReplyToMessageId={inReplyToMessageId}
        onSent={handleDone}
        onDiscard={() => setOpen(false)}
      />
    </div>
  );
}
