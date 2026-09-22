"use client";

import { useActionState, useState } from "react";
import type { MeetingFormState } from "@/app/(dashboard)/contacts/actions";
import { Button } from "@/components/ui/button";

type RescheduleAction = (
  state: MeetingFormState,
  formData: FormData
) => Promise<MeetingFormState>;

export function MeetingActions({
  rescheduleAction,
  cancelAction,
}: {
  rescheduleAction: RescheduleAction;
  cancelAction: () => Promise<void>;
}) {
  const [state, formAction, isPending] = useActionState(
    rescheduleAction,
    undefined
  );
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Reschedule
        </button>
        <form
          action={cancelAction}
          onSubmit={(event) => {
            if (!window.confirm("Cancel this meeting?")) {
              event.preventDefault();
            }
          }}
        >
          <button
            type="submit"
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-2 space-y-2 rounded-lg border border-neutral-200 p-3"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="datetime-local"
          name="startTime"
          required
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <select
          name="durationMinutes"
          defaultValue="30"
          className="cursor-pointer rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none transition hover:border-neutral-300"
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">60 minutes</option>
        </select>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Saving..." : "Save new time"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
