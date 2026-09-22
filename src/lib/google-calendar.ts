import { randomUUID } from "crypto";
import { google, calendar_v3 } from "googleapis";
import { getUserGoogleClient } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import type { Contact, Meeting } from "@/generated/prisma/client";

export class CalendarNotConnectedError extends Error {
  constructor() {
    super("Google account not connected.");
    this.name = "CalendarNotConnectedError";
  }
}

export class CalendarApiError extends Error {
  constructor(action: string, cause: unknown) {
    super(`Google Calendar ${action} failed. Your connection may need to be refreshed.`);
    this.name = "CalendarApiError";
    this.cause = cause;
  }
}

export type CrmLinkType = "contact" | "client" | "candidate";
export type CrmLink = { type: CrmLinkType; id: string } | null;

export type CalendarEventInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  timeZone: string;
  allDay?: boolean;
  attendees?: string[];
  addMeetLink?: boolean;
  crmLink?: CrmLink;
};

export type NormalizedCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  meetLink: string | null;
  htmlLink: string | null;
  attendees: { email: string; name: string | null; responseStatus: string | null }[];
  crmLink: CrmLink;
};

function readCrmLink(event: calendar_v3.Schema$Event): CrmLink {
  const props = event.extendedProperties?.private;
  const type = props?.crmType as CrmLinkType | undefined;
  const id = props?.crmId;
  if (!type || !id) return null;
  if (type !== "contact" && type !== "client" && type !== "candidate") return null;
  return { type, id };
}

function normalizeEvent(event: calendar_v3.Schema$Event): NormalizedCalendarEvent | null {
  if (!event.id) return null;
  const allDay = Boolean(event.start?.date && !event.start?.dateTime);
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date;
  if (!start || !end) return null;

  return {
    id: event.id,
    title: event.summary || "(no title)",
    description: event.description ?? null,
    location: event.location ?? null,
    start,
    end,
    allDay,
    meetLink:
      event.hangoutLink ?? event.conferenceData?.entryPoints?.[0]?.uri ?? null,
    htmlLink: event.htmlLink ?? null,
    attendees: (event.attendees ?? [])
      .filter((a) => a.email)
      .map((a) => ({
        email: a.email!,
        name: a.displayName ?? null,
        responseStatus: a.responseStatus ?? null,
      })),
    crmLink: readCrmLink(event),
  };
}

function buildEventBody(
  input: CalendarEventInput
): calendar_v3.Schema$Event {
  const body: calendar_v3.Schema$Event = {
    summary: input.title,
    description: input.description || undefined,
    location: input.location || undefined,
    attendees: input.attendees?.length
      ? input.attendees.map((email) => ({ email }))
      : undefined,
  };

  if (input.allDay) {
    const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);
    body.start = { date: toDateOnly(input.startTime) };
    body.end = { date: toDateOnly(input.endTime) };
  } else {
    body.start = {
      dateTime: input.startTime.toISOString(),
      timeZone: input.timeZone,
    };
    body.end = { dateTime: input.endTime.toISOString(), timeZone: input.timeZone };
  }

  if (input.addMeetLink) {
    body.conferenceData = {
      createRequest: {
        requestId: randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  if (input.crmLink) {
    body.extendedProperties = {
      private: { crmType: input.crmLink.type, crmId: input.crmLink.id },
    };
  }

  return body;
}

/** Lists events on the user's primary calendar within a date range. */
export async function listCalendarEvents(
  userId: string,
  timeMin: Date,
  timeMax: Date,
  options?: { attendeeEmail?: string; maxResults?: number }
): Promise<NormalizedCalendarEvent[]> {
  const auth = await getUserGoogleClient(userId);
  if (!auth) throw new CalendarNotConnectedError();

  const calendar = google.calendar({ version: "v3", auth });

  let list;
  try {
    list = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      q: options?.attendeeEmail || undefined,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: options?.maxResults ?? 250,
    });
  } catch (err) {
    throw new CalendarApiError("sync", err);
  }

  if (options?.attendeeEmail) {
    const needle = options.attendeeEmail.toLowerCase();
    list.data.items = (list.data.items ?? []).filter((event) =>
      (event.attendees ?? []).some((a) => a.email?.toLowerCase() === needle)
    );
  }

  return (list.data.items ?? [])
    .map(normalizeEvent)
    .filter((e): e is NormalizedCalendarEvent => e !== null);
}

export async function createCalendarEvent(
  userId: string,
  input: CalendarEventInput
): Promise<NormalizedCalendarEvent> {
  const auth = await getUserGoogleClient(userId);
  if (!auth) throw new CalendarNotConnectedError();

  const calendar = google.calendar({ version: "v3", auth });

  let event;
  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: input.addMeetLink ? 1 : undefined,
      requestBody: buildEventBody(input),
    });
    event = response.data;
  } catch (err) {
    throw new CalendarApiError("create", err);
  }

  const normalized = normalizeEvent(event);
  if (!normalized) throw new CalendarApiError("create", new Error("Malformed event returned"));
  return normalized;
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  input: CalendarEventInput
): Promise<NormalizedCalendarEvent> {
  const auth = await getUserGoogleClient(userId);
  if (!auth) throw new CalendarNotConnectedError();

  const calendar = google.calendar({ version: "v3", auth });

  let event;
  try {
    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId,
      conferenceDataVersion: input.addMeetLink ? 1 : undefined,
      requestBody: buildEventBody(input),
    });
    event = response.data;
  } catch (err) {
    throw new CalendarApiError("update", err);
  }

  const normalized = normalizeEvent(event);
  if (!normalized) throw new CalendarApiError("update", new Error("Malformed event returned"));
  return normalized;
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
  const auth = await getUserGoogleClient(userId);
  if (!auth) throw new CalendarNotConnectedError();

  const calendar = google.calendar({ version: "v3", auth });
  try {
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (err) {
    throw new CalendarApiError("delete", err);
  }
}

export async function createGoogleMeetEvent({
  userId,
  title,
  description,
  startTime,
  endTime,
  attendeeEmail,
}: {
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail?: string | null;
}) {
  const auth = await getUserGoogleClient(userId);
  if (!auth) {
    throw new Error(
      "No Google account connected. Connect one in Settings > Integrations first."
    );
  }

  const calendar = google.calendar({ version: "v3", auth });

  const { data: event } = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: title,
      description,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : undefined,
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const meetLink = event.hangoutLink ?? event.conferenceData?.entryPoints?.[0]?.uri;

  return { googleEventId: event.id ?? null, meetLink: meetLink ?? null };
}

/**
 * Pulls calendar events with the contact's email as an attendee, that
 * weren't already created through the CRM, and saves them as Meeting rows.
 * Returns the newly-created rows (empty if nothing new to import).
 */
export async function importContactMeetings(userId: string, contact: Contact) {
  if (!contact.email) return [];

  const auth = await getUserGoogleClient(userId);
  if (!auth) return [];

  const calendar = google.calendar({ version: "v3", auth });

  const existing = await prisma.meeting.findMany({
    where: { contactId: contact.id, googleEventId: { not: null } },
    select: { googleEventId: true },
  });
  const existingIds = new Set(existing.map((m) => m.googleEventId));

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 30);
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 180);

  let list;
  try {
    list = await calendar.events.list({
      calendarId: "primary",
      q: contact.email,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      maxResults: 25,
    });
  } catch {
    return [];
  }

  const events = (list.data.items ?? []).filter((event) => {
    if (!event.id || existingIds.has(event.id)) return false;
    const attendeeEmails = (event.attendees ?? []).map((a) =>
      a.email?.toLowerCase()
    );
    return attendeeEmails.includes(contact.email!.toLowerCase());
  });

  const created = [];
  for (const event of events) {
    if (!event.start?.dateTime && !event.start?.date) continue;
    const start = new Date(event.start.dateTime ?? event.start.date!);
    const end = event.end?.dateTime ?? event.end?.date;

    const row = await prisma.meeting.create({
      data: {
        contactId: contact.id,
        title: event.summary || "(no title)",
        googleEventId: event.id!,
        meetLink:
          event.hangoutLink ??
          event.conferenceData?.entryPoints?.[0]?.uri ??
          null,
        scheduledStart: start,
        scheduledEnd: end ? new Date(end) : null,
      },
    });
    created.push(row);
  }

  return created;
}

export async function rescheduleGoogleMeetEvent(
  userId: string,
  meeting: Meeting,
  startTime: Date,
  endTime: Date
) {
  if (!meeting.googleEventId) {
    throw new Error("This meeting wasn't created through Google Calendar.");
  }
  const auth = await getUserGoogleClient(userId);
  if (!auth) {
    throw new Error("No Google account connected.");
  }

  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.patch({
    calendarId: "primary",
    eventId: meeting.googleEventId,
    requestBody: {
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
    },
  });
}

export async function cancelGoogleMeetEvent(userId: string, meeting: Meeting) {
  if (!meeting.googleEventId) return;
  const auth = await getUserGoogleClient(userId);
  if (!auth) {
    throw new Error("No Google account connected.");
  }

  const calendar = google.calendar({ version: "v3", auth });
  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId: meeting.googleEventId,
    });
  } catch {
    // Event may already be deleted on Google's side - still remove locally
  }
}
