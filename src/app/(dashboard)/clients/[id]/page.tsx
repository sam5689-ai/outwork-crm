import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/field";
import { StageSelect } from "@/components/ui/stage-select";
import { UpcomingMeetingsCard } from "@/components/calendar/upcoming-meetings-card";
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            {client.name}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">
            Company Details
          </h2>
          <form action={updateClientDetailsWithId} className="space-y-5">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Overview
              </h3>
              <div className="space-y-3">
                <FormField label="Company name" htmlFor="name">
                  <Input id="name" name="name" required defaultValue={client.name} />
                </FormField>
                <FormField label="Email" htmlFor="email">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={client.email ?? ""}
                  />
                </FormField>
                <FormField label="Website" htmlFor="website">
                  <Input
                    id="website"
                    name="website"
                    placeholder="https://"
                    defaultValue={client.website ?? ""}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Industry" htmlFor="industry">
                    <Input
                      id="industry"
                      name="industry"
                      defaultValue={client.industry ?? ""}
                    />
                  </FormField>
                  <FormField label="Employees" htmlFor="employeeCount">
                    <Input
                      id="employeeCount"
                      name="employeeCount"
                      type="number"
                      min="0"
                      defaultValue={client.employeeCount ?? ""}
                    />
                  </FormField>
                </div>
                <FormField label="Work hours" htmlFor="workHours">
                  <Input
                    id="workHours"
                    name="workHours"
                    placeholder="Mon-Fri, 8:00 AM - 4:30 PM"
                    defaultValue={client.workHours ?? ""}
                  />
                </FormField>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Bill Rate
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Client bill rate" htmlFor="payRate">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-neutral-400">
                      $
                    </span>
                    <Input
                      id="payRate"
                      name="payRate"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={client.payRate ?? ""}
                      className="pl-6"
                    />
                  </div>
                </FormField>
                <FormField label="Unit" htmlFor="payUnit">
                  <Select id="payUnit" name="payUnit" defaultValue={client.payUnit}>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="flat">Flat</option>
                  </Select>
                </FormField>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Address
              </h3>
              <div className="space-y-3">
                <FormField label="Street" htmlFor="street">
                  <Input id="street" name="street" defaultValue={client.street ?? ""} />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="City" htmlFor="city">
                    <Input id="city" name="city" defaultValue={client.city ?? ""} />
                  </FormField>
                  <FormField label="State" htmlFor="state">
                    <Input id="state" name="state" defaultValue={client.state ?? ""} />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="ZIP code" htmlFor="zipCode">
                    <Input
                      id="zipCode"
                      name="zipCode"
                      defaultValue={client.zipCode ?? ""}
                    />
                  </FormField>
                  <FormField label="Country" htmlFor="country">
                    <Input
                      id="country"
                      name="country"
                      defaultValue={client.country ?? "US"}
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <Button type="submit" variant="secondary">
              Save details
            </Button>
          </form>
        </Card>

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
      </div>

      <div className="mt-6">
        <UpcomingMeetingsCard
          userId={user.id}
          contactEmail={client.contact.email}
        />
      </div>
    </div>
  );
}
