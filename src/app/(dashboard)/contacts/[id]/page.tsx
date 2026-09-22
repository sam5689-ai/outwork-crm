import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, Building2, Pencil, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getGoogleFeatures } from "@/lib/google-features";
import { syncContactEmails } from "@/lib/gmail";
import { resolveEmailHtml } from "@/lib/email-content";
import { importContactMeetings } from "@/lib/google-calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/contacts/delete-button";
import { ScheduleMeetingForm } from "@/components/contacts/schedule-meeting-form";
import { MeetingActions } from "@/components/contacts/meeting-actions";
import { EmailBody } from "@/components/contacts/email-body";
import {
  CLIENT_STAGE_LABELS,
  CLIENT_STAGE_COLORS,
  CANDIDATE_STAGE_LABELS,
  CANDIDATE_STAGE_COLORS,
} from "@/lib/stages";
import {
  deleteContact,
  convertToClient,
  convertToCandidate,
  addActivityNote,
  scheduleMeeting,
  rescheduleMeeting,
  cancelMeeting,
} from "../actions";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, features] = await Promise.all([
    requireUser(),
    getGoogleFeatures(),
  ]);
  const googleAccount = await prisma.googleAccount.findUnique({
    where: { userId: user.id },
  });
  const hasGoogleAccount = Boolean(googleAccount);

  const contactInclude = {
    client: true,
    candidate: true,
    emails: { orderBy: { sentAt: "desc" as const } },
    meetings: { orderBy: { scheduledStart: "desc" as const } },
    activities: {
      orderBy: { createdAt: "desc" as const },
      include: { author: true },
    },
    owner: true,
  } as const;

  let contact = await prisma.contact.findUnique({
    where: { id },
    include: contactInclude,
  });
  if (!contact) notFound();

  let shouldRefetch = false;

  if (features.emailSync) {
    const newEmails = await syncContactEmails(user.id, contact);
    if (newEmails.length > 0) {
      shouldRefetch = true;
      const inbound = newEmails.filter((e) => e.direction === "INBOUND");
      if (inbound.length > 0 && features.autoLogEmailActivity) {
        await prisma.activity.createMany({
          data: inbound.map((email) => ({
            contactId: contact!.id,
            authorId: user.id,
            body: `New email from ${email.fromAddress || "contact"}: "${email.subject}"`,
          })),
        });
      }
    }
  }

  if (features.importCalendarMeetings) {
    const newMeetings = await importContactMeetings(user.id, contact);
    if (newMeetings.length > 0) shouldRefetch = true;
  }

  if (shouldRefetch) {
    const refreshed = await prisma.contact.findUnique({
      where: { id },
      include: contactInclude,
    });
    if (refreshed) contact = refreshed;
  }

  const deleteContactWithId = deleteContact.bind(null, contact.id);
  const convertToClientWithId = convertToClient.bind(null, contact.id);
  const convertToCandidateWithId = convertToCandidate.bind(null, contact.id);
  const addNoteWithId = addActivityNote.bind(null, contact.id);
  const scheduleMeetingWithId = scheduleMeeting.bind(null, contact.id);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Added by {contact.owner.name} &middot; Owner
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton variant="secondary" href={`/contacts/${contact.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit
          </LinkButton>
          <DeleteButton
            action={deleteContactWithId}
            confirmMessage={`Delete ${contact.firstName} ${contact.lastName}? This cannot be undone.`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">
              Contact Info
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-neutral-600">
                <Mail className="h-4 w-4 text-neutral-400" />
                {contact.email ?? (
                  <span className="text-neutral-400">No email</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <Phone className="h-4 w-4 text-neutral-400" />
                {contact.phone ?? (
                  <span className="text-neutral-400">No phone</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <Building2 className="h-4 w-4 text-neutral-400" />
                {contact.company ?? (
                  <span className="text-neutral-400">No company</span>
                )}
              </div>
            </div>
            {contact.notes && (
              <p className="mt-4 whitespace-pre-wrap border-t border-neutral-200 pt-4 text-sm text-neutral-600">
                {contact.notes}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">
              Pipeline
            </h2>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Client
                </p>
                {contact.client ? (
                  <Link
                    href={`/clients/${contact.client.id}`}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 hover:border-blue-300"
                  >
                    <span className="text-sm font-medium text-neutral-700">
                      {contact.client.name}
                    </span>
                    <Badge className={CLIENT_STAGE_COLORS[contact.client.stage]}>
                      {CLIENT_STAGE_LABELS[contact.client.stage]}
                    </Badge>
                  </Link>
                ) : (
                  <form action={convertToClientWithId} className="flex gap-2">
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Company name"
                      defaultValue={contact.company ?? ""}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <Button type="submit" variant="secondary" className="shrink-0">
                      Convert
                    </Button>
                  </form>
                )}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Candidate
                </p>
                {contact.candidate ? (
                  <Link
                    href={`/candidates/${contact.candidate.id}`}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 hover:border-blue-300"
                  >
                    <span className="text-sm font-medium text-neutral-700">
                      Candidate profile
                    </span>
                    <Badge
                      className={CANDIDATE_STAGE_COLORS[contact.candidate.stage]}
                    >
                      {CANDIDATE_STAGE_LABELS[contact.candidate.stage]}
                    </Badge>
                  </Link>
                ) : (
                  <form action={convertToCandidateWithId}>
                    <Button type="submit" variant="secondary" className="w-full">
                      Convert to candidate
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">
              Activity
            </h2>
            <form action={addNoteWithId} className="mb-4 flex gap-2">
              <input
                type="text"
                name="body"
                placeholder="Add a note..."
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                Add
              </Button>
            </form>
            {contact.activities.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-400">
                No activity yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {contact.activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="border-l-2 border-blue-100 pl-3 text-sm"
                  >
                    <p className="text-neutral-700">{activity.body}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {activity.author.name} &middot;{" "}
                      {activity.createdAt.toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">
                <Mail className="mr-2 inline h-4 w-4 text-neutral-400" />
                Linked Emails
              </h2>
              {!hasGoogleAccount && (
                <Link
                  href="/settings/integrations"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Connect Gmail
                </Link>
              )}
            </div>
            {contact.emails.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-400">
                {!hasGoogleAccount
                  ? "No emails linked yet. Connect your Google account in Settings to automatically sync emails with this contact."
                  : !features.emailSync
                    ? "No emails linked yet. Turn on email sync in Settings to automatically sync emails with this contact."
                    : "No emails found for this contact yet."}
              </p>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {contact.emails.map((email) => {
                  const resolvedHtml = resolveEmailHtml(email);
                  return (
                    <li key={email.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-neutral-700">
                          {email.subject}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            className={
                              email.direction === "INBOUND"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-neutral-100 text-neutral-600"
                            }
                          >
                            {email.direction === "INBOUND"
                              ? "Received"
                              : "Sent"}
                          </Badge>
                          <span className="text-xs text-neutral-400">
                            {email.sentAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {email.body || email.bodyHtml ? (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700">
                            {email.snippet || "View email"}
                          </summary>
                          <EmailBody
                            html={resolvedHtml}
                            text={resolvedHtml ? null : email.body}
                            attachments={email.attachments}
                            messageId={email.gmailMessageId}
                          />
                        </details>
                      ) : (
                        email.snippet && (
                          <p className="mt-1 text-xs text-neutral-500">
                            {email.snippet}
                          </p>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">
                <Video className="mr-2 inline h-4 w-4 text-neutral-400" />
                Meetings
              </h2>
            </div>
            <div className="mb-4">
              <ScheduleMeetingForm action={scheduleMeetingWithId} />
            </div>
            {contact.meetings.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-400">
                {hasGoogleAccount ? (
                  "No meetings scheduled yet."
                ) : (
                  <>
                    No meetings scheduled yet. Connect Google in{" "}
                    <Link
                      href="/settings/integrations"
                      className="text-blue-600 hover:underline"
                    >
                      Settings
                    </Link>{" "}
                    to create Google Meet events.
                  </>
                )}
              </p>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {contact.meetings.map((meeting) => {
                  const rescheduleWithId = rescheduleMeeting.bind(
                    null,
                    contact.id,
                    meeting.id
                  );
                  const cancelWithId = cancelMeeting.bind(
                    null,
                    contact.id,
                    meeting.id
                  );
                  return (
                    <li key={meeting.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-700">
                          {meeting.title}
                        </p>
                        <span className="text-xs text-neutral-400">
                          {meeting.scheduledStart.toLocaleString()}
                        </span>
                      </div>
                      {meeting.meetLink && (
                        <a
                          href={meeting.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline"
                        >
                          Join Google Meet
                        </a>
                      )}
                      {meeting.googleEventId && (
                        <MeetingActions
                          rescheduleAction={rescheduleWithId}
                          cancelAction={cancelWithId}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
