import { randomUUID } from "crypto";
import { google } from "googleapis";
import { getUserGoogleClient } from "@/lib/google";

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
