"use client";

import { useActionState, useEffect, useState } from "react";
import { Paperclip, X } from "lucide-react";
import {
  sendComposedEmail,
  saveDraftEmail,
  deleteDraft,
  type ComposeState,
  type DraftState,
} from "@/app/(dashboard)/inbox/actions";
import { Button } from "@/components/ui/button";
import { RecipientInput } from "./recipient-input";
import { RichTextEditor } from "./rich-text-editor";

export function ComposerForm({
  defaultTo = "",
  defaultCc = "",
  defaultBcc = "",
  defaultSubject = "",
  defaultBodyHtml = "",
  threadId,
  inReplyToMessageId,
  draftId: initialDraftId,
  onSent,
  onDiscard,
}: {
  defaultTo?: string;
  defaultCc?: string;
  defaultBcc?: string;
  defaultSubject?: string;
  defaultBodyHtml?: string;
  threadId?: string;
  inReplyToMessageId?: string;
  draftId?: string;
  onSent?: () => void;
  onDiscard?: () => void;
}) {
  const [showCcBcc, setShowCcBcc] = useState(Boolean(defaultCc || defaultBcc));
  const [attachments, setAttachments] = useState<File[]>([]);

  const [sendState, sendAction, isSending] = useActionState<ComposeState, FormData>(
    sendComposedEmail,
    undefined
  );
  const [draftState, draftAction, isSavingDraft] = useActionState<DraftState, FormData>(
    saveDraftEmail,
    undefined
  );
  const draftId = draftState?.draftId ?? initialDraftId;

  useEffect(() => {
    if (sendState?.success) onSent?.();
  }, [sendState, onSent]);

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDiscard() {
    if (draftId) await deleteDraft(draftId);
    onDiscard?.();
  }

  return (
    <form className="flex h-full flex-col">
      <input type="hidden" name="threadId" value={threadId ?? ""} />
      <input
        type="hidden"
        name="inReplyToMessageId"
        value={inReplyToMessageId ?? ""}
      />
      <input type="hidden" name="draftId" value={draftId ?? ""} />

      <div className="border-b border-neutral-100">
        <RecipientInput name="to" label="To" defaultValue={defaultTo} />
        {showCcBcc ? (
          <>
            <RecipientInput name="cc" label="Cc" defaultValue={defaultCc} />
            <RecipientInput name="bcc" label="Bcc" defaultValue={defaultBcc} />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowCcBcc(true)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:underline"
          >
            Add Cc/Bcc
          </button>
        )}
        <div className="flex items-center gap-2 px-3 py-2">
          <label className="w-10 shrink-0 text-xs font-medium text-neutral-400">
            Subject
          </label>
          <input
            type="text"
            name="subject"
            defaultValue={defaultSubject}
            placeholder="Subject"
            className="w-full text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
      </div>

      <div className="flex-1 py-3">
        <RichTextEditor
          name="bodyHtml"
          defaultValue={defaultBodyHtml}
          placeholder="Write your message..."
        />
      </div>

      <div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900">
          <Paperclip className="h-3.5 w-3.5" />
          Attach files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setAttachments(Array.from(e.target.files ?? []))}
          />
        </label>
        {attachments.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-600"
              >
                {file.name}
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sendState?.error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {sendState.error}
        </p>
      )}
      {draftState?.error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {draftState.error}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            formAction={(formData) => {
              for (const file of attachments) formData.append("attachments", file);
              return sendAction(formData);
            }}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
          <Button
            type="submit"
            variant="secondary"
            formAction={draftAction}
            disabled={isSavingDraft}
          >
            {isSavingDraft ? "Saving..." : "Save draft"}
          </Button>
        </div>
        <button
          type="button"
          onClick={handleDiscard}
          className="text-xs font-medium text-neutral-400 hover:text-red-600"
        >
          Discard
        </button>
      </div>
    </form>
  );
}
