import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, Building2, Pencil, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/contacts/delete-button";
import { ScheduleMeetingForm } from "@/components/contacts/schedule-meeting-form";
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
} from "../actions";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      client: true,
      candidate: true,
      emails: { orderBy: { sentAt: "desc" } },
      meetings: { orderBy: { scheduledStart: "desc" } },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { author: true },
      },
      owner: true,
    },
  });

  if (!contact) notFound();

  const deleteContactWithId = deleteContact.bind(null, contact.id);
  const convertToClientWithId = convertToClient.bind(null, contact.id);
  const convertToCandidateWithId = convertToCandidate.bind(null, contact.id);
  const addNoteWithId = addActivityNote.bind(null, contact.id);
  const scheduleMeetingWithId = scheduleMeeting.bind(null, contact.id);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
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
            <h2 className="mb-4 text-sm font-semibold text-slate-800">
              Contact Info
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                {contact.email ?? (
                  <span className="text-slate-400">No email</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                {contact.phone ?? (
                  <span className="text-slate-400">No phone</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="h-4 w-4 text-slate-400" />
                {contact.company ?? (
                  <span className="text-slate-400">No company</span>
                )}
              </div>
            </div>
            {contact.notes && (
              <p className="mt-4 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm text-slate-600">
                {contact.notes}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-800">
              Pipeline
            </h2>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Client
                </p>
                {contact.client ? (
                  <Link
                    href={`/clients/${contact.client.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:border-indigo-200"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {contact.client.companyName}
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
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    <Button type="submit" variant="secondary" className="shrink-0">
                      Convert
                    </Button>
                  </form>
                )}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Candidate
                </p>
                {contact.candidate ? (
                  <Link
                    href={`/candidates/${contact.candidate.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:border-indigo-200"
                  >
                    <span className="text-sm font-medium text-slate-700">
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
            <h2 className="mb-4 text-sm font-semibold text-slate-800">
              Activity
            </h2>
            <form action={addNoteWithId} className="mb-4 flex gap-2">
              <input
                type="text"
                name="body"
                placeholder="Add a note..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                Add
              </Button>
            </form>
            {contact.activities.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No activity yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {contact.activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="border-l-2 border-indigo-100 pl-3 text-sm"
                  >
                    <p className="text-slate-700">{activity.body}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
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
              <h2 className="text-sm font-semibold text-slate-800">
                <Mail className="mr-2 inline h-4 w-4 text-slate-400" />
                Linked Emails
              </h2>
              <Link
                href="/settings/integrations"
                className="text-xs font-semibold text-indigo-500 hover:underline"
              >
                Connect Gmail
              </Link>
            </div>
            {contact.emails.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No emails linked yet. Connect your Google account in Settings
                to automatically sync emails with this contact.
              </p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {contact.emails.map((email) => (
                  <li key={email.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">
                        {email.subject}
                      </p>
                      <span className="text-xs text-slate-400">
                        {email.sentAt.toLocaleDateString()}
                      </span>
                    </div>
                    {email.snippet && (
                      <p className="mt-1 text-xs text-slate-500">
                        {email.snippet}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                <Video className="mr-2 inline h-4 w-4 text-slate-400" />
                Meetings
              </h2>
            </div>
            <div className="mb-4">
              <ScheduleMeetingForm action={scheduleMeetingWithId} />
            </div>
            {contact.meetings.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No meetings scheduled yet. Connect Google in{" "}
                <Link
                  href="/settings/integrations"
                  className="text-indigo-500 hover:underline"
                >
                  Settings
                </Link>{" "}
                to create Google Meet events.
              </p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {contact.meetings.map((meeting) => (
                  <li key={meeting.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">
                        {meeting.title}
                      </p>
                      <span className="text-xs text-slate-400">
                        {meeting.scheduledStart.toLocaleString()}
                      </span>
                    </div>
                    {meeting.meetLink && (
                      <a
                        href={meeting.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-indigo-500 hover:underline"
                      >
                        Join Google Meet
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
