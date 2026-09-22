import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StageSelect } from "@/components/ui/stage-select";
import { calculateMargin } from "@/lib/placement";
import { JOB_STAGES, JOB_STAGE_LABELS } from "@/lib/stages";
import { updateJobStage } from "../clients/actions";

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, matches: true },
  });

  const columns = JOB_STAGES.map((stage) => ({
    stage,
    jobs: jobs.filter((job) => job.stage === stage),
  }));

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Every job across all of your clients, tracked to a fill"
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(({ stage, jobs: stageJobs }) => (
          <div key={stage} className="w-80 shrink-0">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {JOB_STAGE_LABELS[stage]}
              </h2>
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-500">
                {stageJobs.length}
              </span>
            </div>
            <div className="space-y-3">
              {stageJobs.map((job) => {
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
                    className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300"
                  >
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-semibold text-neutral-900 hover:text-blue-600"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {job.client.name}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-600">
                        {placedCount}/{job.openingsCount} Placed
                      </span>
                      {margin && (
                        <Badge className="bg-emerald-50 text-emerald-700">
                          ${margin.hourlyMargin.toFixed(2)}/hr profit
                        </Badge>
                      )}
                    </div>

                    {job.startDate && (
                      <p className="mt-2 text-xs text-neutral-400">
                        Starts{" "}
                        {job.startDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}

                    <div className="mt-3">
                      <StageSelect
                        action={updateJobStageWithId}
                        name="stage"
                        defaultValue={job.stage}
                        options={JOB_STAGES.map((s) => ({
                          value: s,
                          label: JOB_STAGE_LABELS[s],
                        }))}
                      />
                    </div>
                  </div>
                );
              })}
              {stageJobs.length === 0 && (
                <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-400">
                  No jobs {JOB_STAGE_LABELS[stage].toLowerCase()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <p className="mt-6 text-sm text-neutral-400">
          No jobs yet. Open one from a client&apos;s page.
        </p>
      )}
    </div>
  );
}
