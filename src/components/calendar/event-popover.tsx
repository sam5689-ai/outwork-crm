"use client";

import Link from "next/link";
import { format } from "date-fns";
import { X, MapPin, Video, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CalendarEvent } from "./types";

const RESPONSE_LABELS: Record<string, string> = {
  accepted: "Accepted",
  declined: "Declined",
  tentative: "Maybe",
  needsAction: "No reply",
};

export function EventPopover({
  event,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const start = new Date(event.start);
  const end = new Date(event.end);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/20 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-neutral-900">
            {event.title}
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

        <p className="text-sm text-neutral-600">
          {event.allDay
            ? format(start, "EEEE, MMMM d, yyyy")
            : `${format(start, "EEE, MMM d · h:mm a")} – ${format(end, "h:mm a")}`}
        </p>

        {event.location && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-600">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
            {event.location}
          </p>
        )}

        {event.meetLink && (
          <a
            href={event.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <Video className="h-4 w-4" />
            Join Google Meet
          </a>
        )}

        {event.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-600">
            {event.description}
          </p>
        )}

        {event.attendees.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Attendees
            </p>
            <ul className="space-y-1">
              {event.attendees.map((attendee) => (
                <li
                  key={attendee.email}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate text-neutral-700">
                    {attendee.name || attendee.email}
                  </span>
                  {attendee.responseStatus && (
                    <Badge className="shrink-0 bg-neutral-100 text-neutral-500">
                      {RESPONSE_LABELS[attendee.responseStatus] ?? attendee.responseStatus}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {event.crmLink && (
          <Link
            href={event.crmLink.href}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
          >
            View {event.crmLink.type === "client" ? "Client" : event.crmLink.type === "candidate" ? "Candidate" : "Contact"}: {event.crmLink.label}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-3">
          <Button type="button" variant="secondary" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
