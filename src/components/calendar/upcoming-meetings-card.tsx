import Link from "next/link";
import { format } from "date-fns";
import { Video, CalendarDays } from "lucide-react";
import { listCalendarEvents } from "@/lib/google-calendar";
import { Card } from "@/components/ui/card";

/**
 * Read-only "next 5 upcoming meetings" widget for a Client/Candidate detail
 * page - looks up events on the current user's Google Calendar where the
 * linked contact's email is an attendee. Fails quietly (no Google
 * connected, API error) rather than breaking the page it's embedded in.
 */
export async function UpcomingMeetingsCard({
  userId,
  contactEmail,
}: {
  userId: string;
  contactEmail: string | null;
}) {
  let events: Awaited<ReturnType<typeof listCalendarEvents>> = [];
  if (contactEmail) {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    events = await listCalendarEvents(userId, now, in30Days, {
      attendeeEmail: contactEmail,
      maxResults: 5,
    }).catch(() => []);
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">
          <CalendarDays className="mr-2 inline h-4 w-4 text-neutral-400" />
          Upcoming Meetings
        </h2>
        <Link
          href="/calendar"
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          Open Calendar
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-400">
          Nothing scheduled in the next 30 days.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-50">
          {events.slice(0, 5).map((event) => (
            <li key={event.id} className="py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-neutral-800">
                  {event.title}
                </p>
                {event.meetLink && (
                  <a
                    href={event.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Join
                  </a>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                {event.allDay
                  ? format(new Date(event.start), "EEE, MMM d")
                  : format(new Date(event.start), "EEE, MMM d · h:mm a")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
