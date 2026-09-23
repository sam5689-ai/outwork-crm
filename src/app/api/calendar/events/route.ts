import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listCalendarEvents,
  createCalendarEvent,
  CalendarNotConnectedError,
  CalendarApiError,
  type CrmLink,
  type CalendarEventInput,
} from "@/lib/google-calendar";
import { resolveCrmLink } from "@/lib/calendar-links";
import { getReminderCalendarEvents } from "@/lib/reminder-events";

function errorResponse(err: unknown) {
  if (err instanceof CalendarNotConnectedError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  if (err instanceof CalendarApiError) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end query params (ISO strings) are required." },
      { status: 400 }
    );
  }

  const timeMin = new Date(start);
  const timeMax = new Date(end);
  if (Number.isNaN(timeMin.getTime()) || Number.isNaN(timeMax.getTime())) {
    return NextResponse.json({ error: "Invalid start/end date." }, { status: 400 });
  }

  let googleEvents: Awaited<ReturnType<typeof listCalendarEvents>> = [];
  try {
    googleEvents = await listCalendarEvents(session.user.id, timeMin, timeMax);
  } catch (err) {
    // No Google account connected just means no Google events to merge in -
    // local reminders still render on the calendar. Any other failure
    // (a real API error) is still worth surfacing.
    if (!(err instanceof CalendarNotConnectedError)) {
      return errorResponse(err);
    }
  }

  const [resolvedGoogleEvents, reminderEvents] = await Promise.all([
    Promise.all(
      googleEvents.map(async (event) => ({
        ...event,
        crmLink: await resolveCrmLink(event.crmLink),
        source: "google" as const,
      }))
    ),
    getReminderCalendarEvents(session.user.id, timeMin, timeMax),
  ]);

  return NextResponse.json({
    events: [...resolvedGoogleEvents, ...reminderEvents],
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.start || !body?.end || !body?.timeZone) {
    return NextResponse.json(
      { error: "title, start, end and timeZone are required." },
      { status: 400 }
    );
  }

  const startTime = new Date(body.start);
  const endTime = new Date(body.end);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return NextResponse.json({ error: "Invalid start/end date." }, { status: 400 });
  }

  const crmLink: CrmLink =
    body.crmLink?.type && body.crmLink?.id
      ? { type: body.crmLink.type, id: body.crmLink.id }
      : null;

  const input: CalendarEventInput = {
    title: String(body.title),
    description: body.description || null,
    location: body.location || null,
    startTime,
    endTime,
    timeZone: String(body.timeZone),
    allDay: Boolean(body.allDay),
    attendees: Array.isArray(body.attendees) ? body.attendees : [],
    addMeetLink: Boolean(body.addMeetLink),
    crmLink,
  };

  try {
    const event = await createCalendarEvent(session.user.id, input);
    return NextResponse.json({
      event: { ...event, crmLink: await resolveCrmLink(event.crmLink) },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
