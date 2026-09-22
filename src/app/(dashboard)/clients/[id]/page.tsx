import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { StageSelect } from "@/components/ui/stage-select";
import { UpcomingMeetingsCard } from "@/components/calendar/upcoming-meetings-card";
import {
  CLIENT_STAGES,
  CLIENT_STAGE_LABELS,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  MATCH_STATUS_LABELS,
  MATCH_STATUS_COLORS,
} from "@/lib/stages";
import { updateClientStage, updateJobStatus } from "../actions";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, client] = await Promise.all([
    requireUser(),
    prisma.client.findUnique({
      where: { id },
      include: {
        contact: true,
        jobs: {
          orderBy: { createdAt: "desc" },
          include: {
            matches: {
              include: { candidate: { include: { contact: true } } },
            },
          },
        },
      },
    }),
  ]);

  if (!client) notFound();

  const updateStageWithId = updateClientStage.bind(null, client.id);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            {client.companyName}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Primary contact:{" "}
            <Link
              href={`/contacts/${client.contact.id}`}
              className="font-medium text-blue-600 hover:underline"
            >
              {client.contact.firstName} {client.contact.lastName}
            </Link>
          </p>
        </div>
        <StageSelect
          action={updateStageWithId}
          name="stage"
          defaultValue={client.stage}
          options={CLIENT_STAGES.map((s) => ({
            value: s,
            label: CLIENT_STAGE_LABELS[s],
          }))}
        />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Jobs</h2>
          <LinkButton href={`/clients/${client.id}/jobs/new`} variant="secondary">
            <Plus className="h-4 w-4" />
            New Job
          </LinkButton>
        </div>

        {client.jobs.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            No jobs yet for this deal.
          </p>
        ) : (
          <div className="space-y-4">
            {client.jobs.map((job) => {
              const updateJobStatusWithId = updateJobStatus.bind(
                null,
                client.id,
                job.id
              );
              return (
                <div
                  key={job.id}
                  className="rounded-xl border border-neutral-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {job.title}
                      </p>
                      {job.description && (
                        <p className="mt-1 text-sm text-neutral-500">
                          {job.description}
                        </p>
                      )}
                    </div>
                    <StageSelect
                      action={updateJobStatusWithId}
                      name="status"
                      defaultValue={job.status}
                      options={Object.entries(JOB_STATUS_LABELS).map(
                        ([value, label]) => ({ value, label })
                      )}
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge className={JOB_STATUS_COLORS[job.status]}>
                      {JOB_STATUS_LABELS[job.status]}
                    </Badge>
                  </div>

                  <div className="mt-4 border-t border-neutral-200 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Candidate Matches
                    </p>
                    {job.matches.length === 0 ? (
                      <p className="text-sm text-neutral-400">
                        No candidates matched to this job yet. Match one from
                        the{" "}
                        <Link
                          href="/candidates"
                          className="text-blue-600 hover:underline"
                        >
                          candidates
                        </Link>{" "}
                        page.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {job.matches.map((match) => (
                          <li
                            key={match.id}
                            className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 transition-colors hover:bg-neutral-100"
                          >
                            <Link
                              href={`/candidates/${match.candidate.id}`}
                              className="text-sm font-medium text-neutral-700 hover:text-blue-600"
                            >
                              {match.candidate.contact.firstName}{" "}
                              {match.candidate.contact.lastName}
                            </Link>
                            <Badge className={MATCH_STATUS_COLORS[match.status]}>
                              {MATCH_STATUS_LABELS[match.status]}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-6">
        <UpcomingMeetingsCard
          userId={user.id}
          contactEmail={client.contact.email}
        />
      </div>
    </div>
  );
}
