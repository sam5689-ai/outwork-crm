"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { AttendeesInput } from "./attendees-input";
import { CrmLinkPicker, type PickedCrmLink } from "./crm-link-picker";
import { toDatetimeLocalValue, toDateValue } from "./date-utils";
import type { CalendarEvent } from "./types";

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function EventFormModal({
  event,
  initialStart,
  onClose,
  onSaved,
}: {
  event?: CalendarEvent;
  initialStart?: Date;
  onClose: () => void;
  onSaved: () => void;
}) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const startDefault = event ? new Date(event.start) : initialStart ?? new Date();
  const endDefault = event
    ? new Date(event.end)
    : addMinutes(startDefault, 30);

  const [title, setTitle] = useState(event?.title ?? "");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [start, setStart] = useState(startDefault);
  const [end, setEnd] = useState(endDefault);
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [attendees, setAttendees] = useState(
    event?.attendees.map((a) => a.email).join(", ") ?? ""
  );
  const [addMeetLink, setAddMeetLink] = useState(Boolean(event?.meetLink));
  const [crmLink, setCrmLink] = useState<PickedCrmLink>(
    event?.crmLink
      ? { type: event.crmLink.type, id: event.crmLink.id, label: event.crmLink.label }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Give the event a title.");
      return;
    }
    if (end <= start) {
      setError("End time must be after the start time.");
      return;
    }

    setSaving(true);
    const body = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start: start.toISOString(),
      end: end.toISOString(),
      timeZone,
      allDay,
      attendees: attendees
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      addMeetLink,
      crmLink: crmLink ? { type: crmLink.type, id: crmLink.id } : null,
    };

    try {
      const res = await fetch(
        event ? `/api/calendar/events/${event.id}` : "/api/calendar/events",
        {
          method: event ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't save the event.");
        return;
      }
      onSaved();
    } catch {
      setError("Couldn't save the event.");
    } finally {
      setSaving(false);
    }
  }

  function updateStart(value: string) {
    const next = allDay ? new Date(`${value}T00:00`) : new Date(value);
    if (Number.isNaN(next.getTime())) return;
    const duration = end.getTime() - start.getTime();
    setStart(next);
    setEnd(new Date(next.getTime() + Math.max(duration, 30 * 60_000)));
  }

  function updateEnd(value: string) {
    const next = allDay ? new Date(`${value}T00:00`) : new Date(value);
    if (!Number.isNaN(next.getTime())) setEnd(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/20 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl bg-white p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">
            {event ? "Edit Event" : "New Event"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <FormField label="Title" htmlFor="event-title">
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              autoFocus
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            All day
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Starts" htmlFor="event-start">
              <Input
                id="event-start"
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? toDateValue(start) : toDatetimeLocalValue(start)}
                onChange={(e) => updateStart(e.target.value)}
              />
            </FormField>
            <FormField label="Ends" htmlFor="event-end">
              <Input
                id="event-end"
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? toDateValue(end) : toDatetimeLocalValue(end)}
                onChange={(e) => updateEnd(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Location" htmlFor="event-location">
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Office, address, or video link"
            />
          </FormField>

          <FormField label="Description" htmlFor="event-description">
            <Textarea
              id="event-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <FormField label="Attendees" htmlFor="event-attendees">
            <AttendeesInput value={attendees} onChange={setAttendees} />
          </FormField>

          <FormField label="Link to CRM record" htmlFor="event-crm-link">
            <CrmLinkPicker value={crmLink} onChange={setCrmLink} />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={addMeetLink}
              onChange={(e) => setAddMeetLink(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Add Google Meet video link
          </label>
          {event?.meetLink && (
            <p className="text-xs text-neutral-400">
              This event already has a Meet link - existing links can&apos;t be
              removed from here.
            </p>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : event ? "Save changes" : "Create event"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
