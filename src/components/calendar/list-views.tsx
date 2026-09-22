"use client";

import { eachDayOfInterval, isSameDay, isToday, format } from "date-fns";
import { clsx } from "clsx";
import { Plus } from "lucide-react";
import type { CalendarEvent } from "./types";

function EventRow({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex w-full flex-col items-start gap-0.5 rounded-lg px-2 py-1.5 text-left transition-colors",
        event.crmLink
          ? "bg-blue-50 hover:bg-blue-100"
          : "bg-neutral-50 hover:bg-neutral-100"
      )}
    >
      <span className="text-xs font-medium text-neutral-500">
        {event.allDay
          ? "All day"
          : `${format(new Date(event.start), "h:mm a")} – ${format(new Date(event.end), "h:mm a")}`}
      </span>
      <span className="truncate text-sm font-medium text-neutral-900">
        {event.title}
      </span>
      {event.location && (
        <span className="truncate text-xs text-neutral-400">{event.location}</span>
      )}
    </button>
  );
}

function DayColumn({
  day,
  events,
  onEventClick,
  onEmptyClick,
  compact,
}: {
  day: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEmptyClick: (day: Date) => void;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0 flex-1 border-r border-neutral-100 last:border-r-0">
      <div
        className={clsx(
          "sticky top-0 flex items-center justify-between border-b border-neutral-100 bg-white px-2 py-2",
          isToday(day) && "bg-neutral-50"
        )}
      >
        <span
          className={clsx(
            "text-xs font-semibold",
            isToday(day) ? "text-neutral-900" : "text-neutral-500"
          )}
        >
          {format(day, compact ? "EEE d" : "EEEE, MMMM d")}
        </span>
        <button
          type="button"
          onClick={() => onEmptyClick(day)}
          aria-label="New event"
          className="rounded p-0.5 text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1.5 p-2">
        {events.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-300">No events</p>
        ) : (
          events.map((event) => (
            <EventRow key={event.id} event={event} onClick={() => onEventClick(event)} />
          ))
        )}
      </div>
    </div>
  );
}

function sortByStart(events: CalendarEvent[]) {
  return [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}

export function WeekView({
  rangeStart,
  rangeEnd,
  events,
  onEventClick,
  onEmptyClick,
}: {
  rangeStart: Date;
  rangeEnd: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEmptyClick: (day: Date) => void;
}) {
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  return (
    <div className="flex overflow-x-auto">
      {days.map((day) => (
        <DayColumn
          key={day.toISOString()}
          day={day}
          compact
          events={sortByStart(
            events.filter((event) => isSameDay(new Date(event.start), day))
          )}
          onEventClick={onEventClick}
          onEmptyClick={onEmptyClick}
        />
      ))}
    </div>
  );
}

export function DayView({
  day,
  events,
  onEventClick,
  onEmptyClick,
}: {
  day: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEmptyClick: (day: Date) => void;
}) {
  return (
    <div className="max-w-md">
      <DayColumn
        day={day}
        events={sortByStart(
          events.filter((event) => isSameDay(new Date(event.start), day))
        )}
        onEventClick={onEventClick}
        onEmptyClick={onEmptyClick}
      />
    </div>
  );
}

export function AgendaView({
  rangeStart,
  rangeEnd,
  events,
  onEventClick,
}: {
  rangeStart: Date;
  rangeEnd: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}) {
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).filter(
    (day) => events.some((event) => isSameDay(new Date(event.start), day))
  );

  if (days.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-neutral-400">
        No events in the next 30 days.
      </p>
    );
  }

  return (
    <div className="divide-y divide-neutral-100">
      {days.map((day) => (
        <div key={day.toISOString()} className="p-3">
          <p
            className={clsx(
              "mb-2 text-xs font-semibold uppercase tracking-wide",
              isToday(day) ? "text-neutral-900" : "text-neutral-400"
            )}
          >
            {format(day, "EEEE, MMMM d")}
            {isToday(day) && " · Today"}
          </p>
          <div className="space-y-1.5">
            {sortByStart(
              events.filter((event) => isSameDay(new Date(event.start), day))
            ).map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onClick={() => onEventClick(event)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
