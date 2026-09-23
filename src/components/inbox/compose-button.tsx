"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComposerForm } from "./composer-form";

export function ComposeButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function close() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Compose
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-neutral-900/20 p-4 sm:items-center sm:justify-center">
          <div className="flex h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white p-4 shadow-2xl sm:h-[600px]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">
                New Message
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <ComposerForm onSent={close} onDiscard={close} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
