"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  createGoogleMeetEvent,
  rescheduleGoogleMeetEvent,
  cancelGoogleMeetEvent,
} from "@/lib/google-calendar";

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ContactFormState = { error?: string } | undefined;

function parseContactForm(formData: FormData) {
  const raw = {
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    company: formData.get("company")?.toString() ?? "",
    notes: formData.get("notes")?.toString() ?? "",
  };
  return contactSchema.safeParse(raw);
}

export async function createContact(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const user = await requireUser();
  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const contact = await prisma.contact.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      notes: parsed.data.notes || null,
      ownerId: user.id,
    },
  });

  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(
  id: string,
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  await requireUser();
  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.contact.update({
    where: { id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  redirect(`/contacts/${id}`);
}

export async function deleteContact(id: string) {
  await requireUser();
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function convertToClient(contactId: string, formData: FormData) {
  const user = await requireUser();
  const contact = await prisma.contact.findUniqueOrThrow({
    where: { id: contactId },
  });
  const companyName =
    formData.get("companyName")?.toString().trim() ||
    contact.company ||
    `${contact.firstName} ${contact.lastName}`;

  await prisma.client.create({
    data: { contactId, companyName },
  });

  await prisma.activity.create({
    data: {
      contactId,
      authorId: user.id,
      body: `Converted to deal "${companyName}".`,
    },
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/clients");
  redirect(`/contacts/${contactId}`);
}

export async function convertToCandidate(contactId: string) {
  const user = await requireUser();
  await prisma.candidate.create({
    data: { contactId },
  });

  await prisma.activity.create({
    data: {
      contactId,
      authorId: user.id,
      body: "Converted to candidate.",
    },
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/candidates");
  redirect(`/contacts/${contactId}`);
}

export async function addActivityNote(contactId: string, formData: FormData) {
  const user = await requireUser();
  const body = formData.get("body")?.toString().trim();
  if (!body) return;

  await prisma.activity.create({
    data: { contactId, authorId: user.id, body },
  });

  revalidatePath(`/contacts/${contactId}`);
}

export type MeetingFormState = { error?: string } | undefined;

export async function scheduleMeeting(
  contactId: string,
  _prevState: MeetingFormState,
  formData: FormData
): Promise<MeetingFormState> {
  const user = await requireUser();

  const title = formData.get("title")?.toString().trim();
  const startTimeRaw = formData.get("startTime")?.toString();
  const durationMinutes = Number(formData.get("durationMinutes") ?? 30);

  if (!title || !startTimeRaw) {
    return { error: "Title and start time are required." };
  }

  const startTime = new Date(startTimeRaw);
  if (Number.isNaN(startTime.getTime())) {
    return { error: "Enter a valid date and time." };
  }
  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);

  const contact = await prisma.contact.findUniqueOrThrow({
    where: { id: contactId },
  });

  try {
    const { googleEventId, meetLink } = await createGoogleMeetEvent({
      userId: user.id,
      title,
      description: `Meeting with ${contact.firstName} ${contact.lastName} via Outwork CRM`,
      startTime,
      endTime,
      attendeeEmail: contact.email,
    });

    await prisma.meeting.create({
      data: {
        contactId,
        title,
        googleEventId,
        meetLink,
        scheduledStart: startTime,
        scheduledEnd: endTime,
      },
    });
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Couldn't create the Google Meet event.",
    };
  }

  revalidatePath(`/contacts/${contactId}`);
  return undefined;
}

export async function rescheduleMeeting(
  contactId: string,
  meetingId: string,
  _prevState: MeetingFormState,
  formData: FormData
): Promise<MeetingFormState> {
  const user = await requireUser();

  const startTimeRaw = formData.get("startTime")?.toString();
  const durationMinutes = Number(formData.get("durationMinutes") ?? 30);
  if (!startTimeRaw) {
    return { error: "Enter a new start time." };
  }
  const startTime = new Date(startTimeRaw);
  if (Number.isNaN(startTime.getTime())) {
    return { error: "Enter a valid date and time." };
  }
  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);

  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: meetingId },
  });

  try {
    await rescheduleGoogleMeetEvent(user.id, meeting, startTime, endTime);
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { scheduledStart: startTime, scheduledEnd: endTime },
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Couldn't reschedule the meeting.",
    };
  }

  revalidatePath(`/contacts/${contactId}`);
  return undefined;
}

export async function cancelMeeting(contactId: string, meetingId: string) {
  const user = await requireUser();
  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: meetingId },
  });

  await cancelGoogleMeetEvent(user.id, meeting);
  await prisma.meeting.delete({ where: { id: meetingId } });

  revalidatePath(`/contacts/${contactId}`);
}
