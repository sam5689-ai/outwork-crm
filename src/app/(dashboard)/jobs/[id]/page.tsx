import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StageSelect } from "@/components/ui/stage-select";
import { JobDetailActions } from "@/components/jobs/job-detail-actions";
import { calculateMargin } from "@/lib/placement";
import {
  JOB_STAGE_LABELS,
  JOB_STAGE_COLORS,
  MATCH_STATUSES,
  MATCH_STATUS_LABELS,
  MATCH_STATUS_COLORS,
} from "@/lib/stages";
import { updateJobStage } from "../../clients/actions";
import { updateJobMatchStatus, removeMatch } from "../actions";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: true,
      matches: {
        orderBy: { createdAt: "desc" },
        include: { candidate: { include: { contact: true } } },
      },
    },
  });

  if (!job) notFound();

  const placedCount = job.matches.filter((m) => m.status === "PLACED").length;
  const margin =
    job.billRate != null && job.targetPayRate != null
      ? calculateMargin(job.billRate, job.targetPayRate)
      : null;

  const updateJobStageWithId = updateJobStage.bind(null, job.id);
  const removeMatchWithId = removeMatch.bind(null, job.id);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            <Link
              href={`/clients/${job.client.id}`}
              className="font-medium text-blue-600 hover:underline"
            >
              {job.client.name}
            </Link>
            {job.filledAt && (
              <span className="text-emerald-600">
                {" "}
                · Filled{" "}
                {job.filledAt.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={JOB_STAGE_COLORS[job.stage]}>
            {JOB_STAGE_LABELS[job.stage]}
          </Badge>
          <StageSelect
            action={updateJobStageWithId}
            name="stage"
            defaultValue={job.stage}
            options={Object.entries(JOB_STAGE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Openings
          </p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {placedCount}/{job.openingsCount}
            <span className="ml-1.5 text-sm font-normal text-neutral-400">
              Placed
            </span>
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Bill Rate vs Target Pay
          </p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {job.billRate != null ? `$${job.billRate.toFixed(2)}` : "—"}
            <span className="text-sm font-normal text-neutral-400"> vs </span>
            {job.targetPayRate != null ? `$${job.targetPayRate.toFixed(2)}` : "—"}
          </p>
          {margin && (
            <p className="mt-1 text-sm font-semibold text-emerald-600">
              ${margin.hourlyMargin.toFixed(2)}/hr profit (
              {margin.marginPercentage.toFixed(0)}%)
            </p>
          )}
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Start Date
          </p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {job.startDate
              ? job.startDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Not set"}
          </p>
          {job.workHours && (
            <p className="mt-1 text-sm text-neutral-500">{job.workHours}</p>
          )}
        </Card>
      </div>

      <div className="mb-6">
        <JobDetailActions jobId={job.id} defaultOpeningsCount={job.openingsCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">
            Role Details
          </h2>
          <div className="space-y-4 text-sm">
            {job.description && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Description
                </p>
                <p className="mt-1 text-neutral-600">{job.description}</p>
              </div>
            )}
            {job.requiredSkills.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Required Skills
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill) => (
                    <Badge key={skill} className="bg-neutral-100 text-neutral-600">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">
            Candidate Matches
          </h2>
          {job.matches.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">
              No candidates matched yet. Use Quick-Match Candidate above to add
              one.
            </p>
          ) : (
            <ul className="space-y-2">
              {job.matches.map((match) => (
                <li
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2.5"
                >
                  <div>
                    <Link
                      href={`/candidates/${match.candidate.id}`}
                      className="text-sm font-medium text-neutral-700 hover:text-blue-600"
                    >
                      {match.candidate.contact.firstName}{" "}
                      {match.candidate.contact.lastName}
                    </Link>
                    <p className="text-xs text-neutral-400">
                      {match.agreedPayRate != null
                        ? `$${match.agreedPayRate.toFixed(2)}/hr agreed`
                        : "No agreed rate set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={MATCH_STATUS_COLORS[match.status]}>
                      {MATCH_STATUS_LABELS[match.status]}
                    </Badge>
                    <StageSelect
                      action={updateJobMatchStatus.bind(null, job.id, match.id)}
                      name="status"
                      defaultValue={match.status}
                      options={MATCH_STATUSES.map((s) => ({
                        value: s,
                        label: MATCH_STATUS_LABELS[s],
                      }))}
                    />
                    <form action={removeMatchWithId}>
                      <input type="hidden" name="matchId" value={match.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-neutral-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
