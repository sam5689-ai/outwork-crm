"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        {label}
      </button>
    </form>
  );
}
