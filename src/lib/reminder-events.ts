import { prisma } from "@/lib/prisma";
import { CONTACT_CHANNEL_LABELS } from "@/lib/stages";
import type { CalendarEvent } from "@/components/calendar/types";

/** Local CRM reminders, shaped as CalendarEvent so they render on the Calendar page. */
export async function getReminderCalendarEvents(
  userId: string,
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  const reminders = await prisma.reminder.findMany({
    where: { authorId: userId, dueAt: { gte: start, lte: end } },
    include: { contact: true },
    orderBy: { dueAt: "asc" },
  });

  return reminders.map((reminder) => {
    const contactName = `${reminder.contact.firstName} ${reminder.contact.lastName}`;
    const channelLabel = CONTACT_CHANNEL_LABELS[reminder.channel];
    const title = `${reminder.completedAt ? "✓ " : ""}${channelLabel}: ${contactName}`;

    return {
      id: `reminder:${reminder.id}`,
      title,
      description: reminder.note,
      location: null,
      start: reminder.dueAt.toISOString(),
      end: reminder.dueAt.toISOString(),
      allDay: false,
      meetLink: null,
      htmlLink: null,
      attendees: [],
      crmLink: {
        type: "contact",
        id: reminder.contactId,
        label: contactName,
        href: `/contacts/${reminder.contactId}`,
      },
      source: "reminder",
      reminderId: reminder.id,
      reminderDone: Boolean(reminder.completedAt),
    };
  });
}
