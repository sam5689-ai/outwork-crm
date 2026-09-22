"use client";

import { useTransition } from "react";
import type { GoogleFeatures } from "@/lib/google-features";
import { updateGoogleFeatures } from "@/app/(dashboard)/settings/actions";

const FEATURES: {
  key: keyof GoogleFeatures;
  label: string;
  description: string;
}[] = [
  {
    key: "emailSync",
    label: "Sync emails to contacts",
    description:
      "Pull emails to/from a contact's address into their timeline whenever you open their page.",
  },
  {
    key: "autoLogEmailActivity",
    label: "Auto-log new emails as activity",
    description:
      "Add a note to a contact's activity feed whenever a new email is synced. Requires email sync.",
  },
  {
    key: "importCalendarMeetings",
    label: "Import existing calendar meetings",
    description:
      "Also show meetings with a contact that were created outside the CRM, not just ones scheduled here.",
  },
  {
    key: "todaysMeetingsWidget",
    label: "Show today's meetings on the dashboard",
    description: "A widget listing every Google Meet call scheduled for today.",
  },
  {
    key: "followUpReminders",
    label: "Follow-up reminders",
    description:
      "Flag contacts on the dashboard whose last email was outbound with no reply in 5+ days.",
  },
];

export function GoogleFeaturesForm({
  features,
}: {
  features: GoogleFeatures;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => updateGoogleFeatures(formData))}
      className="space-y-4"
    >
      <div className="space-y-3">
        {FEATURES.map((feature) => (
          <label
            key={feature.key}
            className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3 transition hover:border-neutral-300"
          >
            <input
              type="checkbox"
              name={feature.key}
              defaultChecked={features[feature.key]}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-900">
                {feature.label}
              </span>
              <span className="block text-xs text-neutral-500">
                {feature.description}
              </span>
            </span>
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save feature settings"}
      </button>
    </form>
  );
}
