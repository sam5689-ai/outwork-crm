"use client";

import { useActionState } from "react";
import { FileText, Download } from "lucide-react";
import type { ResumeFormState } from "@/app/(dashboard)/candidates/actions";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/contacts/delete-button";

type UploadAction = (
  state: ResumeFormState,
  formData: FormData
) => Promise<ResumeFormState>;

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

export function ResumeUpload({
  uploadAction,
  removeAction,
  resume,
  downloadHref,
}: {
  uploadAction: UploadAction;
  removeAction: () => Promise<void>;
  resume: { filename: string; sizeBytes: number } | null;
  downloadHref: string;
}) {
  const [state, formAction, isPending] = useActionState(
    uploadAction,
    undefined
  );

  return (
    <div>
      {resume && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <a
            href={downloadHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-2 text-sm font-medium text-neutral-700 hover:text-blue-600"
          >
            <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
            <span className="truncate">{resume.filename}</span>
            {resume.sizeBytes > 0 && (
              <span className="shrink-0 text-xs text-neutral-400">
                ({formatBytes(resume.sizeBytes)})
              </span>
            )}
            <Download className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
          </a>
          <DeleteButton
            action={removeAction}
            confirmMessage="Remove this resume?"
            label="Remove"
          />
        </div>
      )}

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          name="resume"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          required
          className="max-w-full flex-1 text-xs text-neutral-500 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
        />
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Uploading..." : resume ? "Replace" : "Upload resume"}
        </Button>
      </form>

      {state?.error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {state.error}
        </p>
      )}
      <p className="mt-2 text-xs text-neutral-400">
        PDF or Word document, up to 8MB.
      </p>
    </div>
  );
}
