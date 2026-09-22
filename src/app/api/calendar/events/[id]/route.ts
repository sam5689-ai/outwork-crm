import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  updateCalendarEvent,
  deleteCalendarEvent,
  CalendarNotConnectedError,
  CalendarApiError,
  type CrmLink,
  type CalendarEventInput,
} from "@/lib/google-calendar";
import { resolveCrmLink } from "@/lib/calendar-links";

function errorResponse(err: unknown) {
  if (err instanceof CalendarNotConnectedError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  if (err instanceof CalendarApiError) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

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
    const event = await updateCalendarEvent(session.user.id, id, input);
    return NextResponse.json({
      event: { ...event, crmLink: await resolveCrmLink(event.crmLink) },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    await deleteCalendarEvent(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
