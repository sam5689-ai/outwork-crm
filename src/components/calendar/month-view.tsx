"use client";

import { eachDayOfInterval, isSameDay, isSameMonth, isToday, format } from "date-fns";
import { clsx } from "clsx";
import { EventChip } from "./event-chip";
import type { CalendarEvent } from "./types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE = 3;

export function MonthView({
  rangeStart,
  rangeEnd,
  anchor,
  events,
  onDayClick,
  onEventClick,
}: {
  rangeStart: Date;
  rangeEnd: Date;
  anchor: Date;
  events: CalendarEvent[];
  onDayClick: (day: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-neutral-200">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = events
            .filter((event) => isSameDay(new Date(event.start), day))
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
          const visible = dayEvents.slice(0, MAX_VISIBLE);
          const overflow = dayEvents.length - visible.length;

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={clsx(
                "min-h-[110px] cursor-pointer border-b border-r border-neutral-100 p-1.5 transition-colors hover:bg-neutral-50",
                !isSameMonth(day, anchor) && "bg-neutral-50/60"
              )}
            >
              <span
                className={clsx(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday(day)
                    ? "bg-neutral-900 text-white"
                    : isSameMonth(day, anchor)
                      ? "text-neutral-700"
                      : "text-neutral-300"
                )}
              >
                {format(day, "d")}
              </span>
              <div
                className="mt-1 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                {visible.map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onEventClick(event)}
                  />
                ))}
                {overflow > 0 && (
                  <p className="px-1.5 text-[11px] font-medium text-neutral-400">
                    +{overflow} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
