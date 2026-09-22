import { randomUUID } from "crypto";
import { google } from "googleapis";
import { getUserGoogleClient } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import type { Contact, Meeting } from "@/generated/prisma/client";

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
