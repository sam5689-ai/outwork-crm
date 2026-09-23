import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { StageSelect } from "@/components/ui/stage-select";
import { UpcomingMeetingsCard } from "@/components/calendar/upcoming-meetings-card";
import { ActivityPanel } from "@/components/contacts/activity-panel";
import { CompanyDetailsSection } from "@/components/clients/company-details-section";
import { calculateMargin } from "@/lib/placement";
import {
  CLIENT_STAGES,
  CLIENT_STAGE_LABELS,
  JOB_STAGE_LABELS,
  JOB_STAGE_COLORS,
} from "@/lib/stages";
import { updateClientStage, updateClientDetails, updateJobStage } from "../actions";

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
          include: { matches: true },
        },
      },
    }),
  ]);

  if (!client) notFound();

  const updateStageWithId = updateClientStage.bind(null, client.id);
  const filledJobs = client.jobs.filter(
    (job) => job.stage === "FILLED_WON" && job.filledAt
  );
  const landedAt = filledJobs.reduce<Date | null>(
    (first, job) => (!first || job.filledAt! < first ? job.filledAt : first),
    null
  );
  const activeJobCount = client.jobs.filter(
    (job) => job.stage !== "FILLED_WON" && job.stage !== "CANCELLED_LOST"
  ).length;
  const updateClientDetailsWithId = updateClientDetails.bind(null, client.id);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            {client.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {client.contact.phone ? (
              <a
                href={`tel:${client.contact.phone}`}
                className="flex items-center gap-1.5 font-semibold text-blue-600 hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                {client.contact.phone}
              </a>
            ) : (
              <span className="flex items-center gap-1.5 text-neutral-400">
                <Phone className="h-3.5 w-3.5" />
                No phone on file
              </span>
            )}
            <span className="text-neutral-300">·</span>
            <Link
              href={`/contacts/${client.contact.id}`}
              className="text-neutral-500 hover:text-blue-600 hover:underline"
            >
              {client.contact.firstName} {client.contact.lastName}
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {landedAt ? (
              <Badge className="bg-emerald-50 text-emerald-700">
                Landed{" "}
                {landedAt.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Badge>
            ) : (
              <Badge className="bg-neutral-100 text-neutral-500">
                Not landed yet
              </Badge>
            )}
            <span className="font-semibold text-neutral-600">
              {filledJobs.length} job{filledJobs.length === 1 ? "" : "s"} filled
            </span>
            <span className="text-neutral-400">
              · {activeJobCount} active
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#company-details"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-800 shadow-sm ring-1 ring-inset ring-neutral-200 hover:ring-neutral-300"
          >
            Edit details
          </a>
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
      </div>

      <div className="mb-6">
        <ActivityPanel contactId={client.contact.id} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Jobs</h2>
            <LinkButton href={`/clients/${client.id}/jobs/new`} variant="secondary">
              <Plus className="h-4 w-4" />
              New Job
            </LinkButton>
          </div>

          {client.jobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">
              No jobs yet for this client.
            </p>
          ) : (
            <div className="space-y-3">
              {client.jobs.map((job) => {
                const placedCount = job.matches.filter(
                  (m) => m.status === "PLACED"
                ).length;
                const margin =
                  job.billRate != null && job.targetPayRate != null
                    ? calculateMargin(job.billRate, job.targetPayRate)
                    : null;
                const updateJobStageWithId = updateJobStage.bind(null, job.id);
                return (
                  <div
                    key={job.id}
                    className="rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-semibold text-neutral-900 hover:text-blue-600"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-2">
                        <Badge className={JOB_STAGE_COLORS[job.stage]}>
                          {JOB_STAGE_LABELS[job.stage]}
                        </Badge>
                        <StageSelect
                          action={updateJobStageWithId}
                          name="stage"
                          defaultValue={job.stage}
                          options={Object.entries(JOB_STAGE_LABELS).map(
                            ([value, label]) => ({ value, label })
                          )}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-600">
                        {placedCount}/{job.openingsCount} Placed
                      </span>
                      {margin && (
                        <span className="font-semibold text-emerald-600">
                          ${margin.hourlyMargin.toFixed(2)}/hr profit
                        </span>
                      )}
                      {job.startDate && (
                        <span>
                          Starts{" "}
                          {job.startDate.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <UpcomingMeetingsCard
          userId={user.id}
          contactEmail={client.contact.email}
        />
      </div>

      <div id="company-details" className="mt-6 scroll-mt-6">
        <CompanyDetailsSection client={client} action={updateClientDetailsWithId} />
      </div>
    </div>
  );
}
