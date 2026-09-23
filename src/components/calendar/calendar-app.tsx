"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MonthView } from "./month-view";
import { WeekView, DayView, AgendaView } from "./list-views";
import { EventPopover } from "./event-popover";
import { EventFormModal } from "./event-form-modal";
import { getRangeForView, navigateAnchor, rangeLabel } from "./date-utils";
import type { CalendarEvent, CalendarView } from "./types";

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "agenda", label: "Agenda" },
];

export function CalendarApp() {
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [formState, setFormState] = useState<
    { mode: "new"; initialStart: Date } | { mode: "edit"; event: CalendarEvent } | null
  >(null);

  const range = useMemo(() => getRangeForView(view, anchor), [view, anchor]);
  const rangeStartMs = range.start.getTime();
  const rangeEndMs = range.end.getTime();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/calendar/events?start=${new Date(rangeStartMs).toISOString()}&end=${new Date(rangeEndMs).toISOString()}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't load your calendar.");
        setEvents([]);
        return;
      }
      setEvents(data.events ?? []);
    } catch {
      setError("Couldn't load your calendar.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [rangeStartMs, rangeEndMs]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEvents();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchEvents]);

  function handleEventSaved() {
    setFormState(null);
    setSelectedEvent(null);
    fetchEvents();
  }

  async function handleDelete() {
    if (!selectedEvent) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/calendar/events/${selectedEvent.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't delete the event.");
        return;
      }
      setSelectedEvent(null);
      fetchEvents();
    } finally {
      setDeleting(false);
    }
  }

  async function handleCompleteReminder() {
    if (!selectedEvent?.reminderId) return;
    setCompleting(true);
    try {
      const res = await fetch(
        `/api/reminders/${selectedEvent.reminderId}/complete`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't mark the reminder done.");
        return;
      }
      setSelectedEvent(null);
      fetchEvents();
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAnchor(new Date())}
          >
            Today
          </Button>
          <button
            type="button"
            onClick={() => setAnchor((prev) => navigateAnchor(view, prev, -1))}
            aria-label="Previous"
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAnchor((prev) => navigateAnchor(view, prev, 1))}
            aria-label="Next"
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="font-display text-base font-semibold text-ink">
            {rangeLabel(view, anchor)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setView(v.value)}
                className={clsx(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  view === v.value
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-50"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            onClick={() =>
              setFormState({ mode: "new", initialStart: new Date() })
            }
          >
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-4">
          <p className="flex items-center gap-2 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        </Card>
      )}

      <Card className="p-0">
        {loading ? (
          <p className="py-16 text-center text-sm text-neutral-400">
            Loading...
          </p>
        ) : (
          <>
            {view === "month" && (
              <MonthView
                rangeStart={range.start}
                rangeEnd={range.end}
                anchor={anchor}
                events={events}
                onDayClick={(day) => setFormState({ mode: "new", initialStart: day })}
                onEventClick={setSelectedEvent}
              />
            )}
            {view === "week" && (
              <WeekView
                rangeStart={range.start}
                rangeEnd={range.end}
                events={events}
                onEventClick={setSelectedEvent}
                onEmptyClick={(day) => setFormState({ mode: "new", initialStart: day })}
              />
            )}
            {view === "day" && (
              <DayView
                day={anchor}
                events={events}
                onEventClick={setSelectedEvent}
                onEmptyClick={(day) => setFormState({ mode: "new", initialStart: day })}
              />
            )}
            {view === "agenda" && (
              <AgendaView
                rangeStart={range.start}
                rangeEnd={range.end}
                events={events}
                onEventClick={setSelectedEvent}
              />
            )}
          </>
        )}
      </Card>

      {selectedEvent && (
        <EventPopover
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => {
            setFormState({ mode: "edit", event: selectedEvent });
            setSelectedEvent(null);
          }}
          onDelete={handleDelete}
          isDeleting={deleting}
          onCompleteReminder={handleCompleteReminder}
          isCompleting={completing}
        />
      )}

      {formState && (
        <EventFormModal
          event={formState.mode === "edit" ? formState.event : undefined}
          initialStart={formState.mode === "new" ? formState.initialStart : undefined}
          onClose={() => setFormState(null)}
          onSaved={handleEventSaved}
        />
      )}
    </div>
  );
}
