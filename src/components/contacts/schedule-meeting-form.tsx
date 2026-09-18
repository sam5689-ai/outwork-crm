"use client";

import { useActionState, useState } from "react";
import type { MeetingFormState } from "@/app/(dashboard)/contacts/actions";
import { Button } from "@/components/ui/button";

type MeetingAction = (
  state: MeetingFormState,
  formData: FormData
) => Promise<MeetingFormState>;

export function ScheduleMeetingForm({ action }: { action: MeetingAction }) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Schedule Google Meet
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          name="title"
          placeholder="Meeting title"
          required
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <input
          type="datetime-local"
          name="startTime"
          required
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <select
        name="durationMinutes"
        defaultValue="30"
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none"
      >
        <option value="15">15 minutes</option>
        <option value="30">30 minutes</option>
        <option value="60">60 minutes</option>
      </select>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Scheduling..." : "Create Meet event"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
