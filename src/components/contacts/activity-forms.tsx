"use client";

import { useActionState, useState } from "react";
import { Phone, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { CONTACT_CHANNELS, CONTACT_CHANNEL_LABELS } from "@/lib/stages";
import type {
  ActivityFormState,
  ReminderFormState,
} from "@/app/(dashboard)/contacts/actions";

type ActivityAction = (
  state: ActivityFormState,
  formData: FormData
) => Promise<ActivityFormState>;
type ReminderAction = (
  state: ReminderFormState,
  formData: FormData
) => Promise<ReminderFormState>;

function LogActivityForm({
  action,
  onDone,
}: {
  action: ActivityAction;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="space-y-3 rounded-lg border border-neutral-200 p-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
        <FormField label="Type" htmlFor="log-channel">
          <Select id="log-channel" name="channel" defaultValue="PHONE_CALL">
            {CONTACT_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {CONTACT_CHANNEL_LABELS[c]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="What happened" htmlFor="log-body">
          <Input
            id="log-body"
            name="body"
            required
            placeholder="e.g. Called, they're coming up in 3 weeks"
          />
        </FormField>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Logging..." : "Log it"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function SetReminderForm({
  action,
  onDone,
}: {
  action: ReminderAction;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="space-y-3 rounded-lg border border-neutral-200 p-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Type" htmlFor="reminder-channel">
          <Select id="reminder-channel" name="channel" defaultValue="PHONE_CALL">
            {CONTACT_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {CONTACT_CHANNEL_LABELS[c]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="When" htmlFor="reminder-dueAt">
          <Input id="reminder-dueAt" name="dueAt" type="datetime-local" required />
        </FormField>
      </div>
      <FormField label="Note (optional)" htmlFor="reminder-note">
        <Textarea
          id="reminder-note"
          name="note"
          rows={2}
          placeholder="e.g. They said coming up in 3 weeks, check back in"
        />
      </FormField>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Set reminder"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function ActivityForms({
  logAction,
  reminderAction,
}: {
  logAction: ActivityAction;
  reminderAction: ReminderAction;
}) {
  const [open, setOpen] = useState<"log" | "reminder" | null>(null);

  if (open === "log") {
    return <LogActivityForm action={logAction} onDone={() => setOpen(null)} />;
  }
  if (open === "reminder") {
    return (
      <SetReminderForm action={reminderAction} onDone={() => setOpen(null)} />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => setOpen("log")}>
        <Phone className="h-4 w-4" />
        Log information
      </Button>
      <Button variant="secondary" onClick={() => setOpen("reminder")}>
        <Bell className="h-4 w-4" />
        Set reminder
      </Button>
    </div>
  );
}
