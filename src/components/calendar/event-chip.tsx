"use client";

import { format } from "date-fns";
import { clsx } from "clsx";
import type { CalendarEvent } from "./types";

export function EventChip({
  event,
  onClick,
  compact = false,
}: {
  event: CalendarEvent;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-left text-xs font-medium transition-colors",
        event.crmLink
          ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
      )}
      title={event.title}
    >
      {!event.allDay && !compact && (
        <span className="shrink-0 text-[10px] text-neutral-500">
          {format(new Date(event.start), "h:mma").toLowerCase()}
        </span>
      )}
      <span className="truncate">{event.title}</span>
    </button>
  );
}
