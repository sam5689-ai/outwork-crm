import Link from "next/link";
import {
  Contact2,
  Building2,
  UserSquare2,
  Briefcase,
  Video,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { clsx } from "clsx";
import {
  DEFAULT_REPORT_PERIOD,
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
  getPlacementReport,
  parseReportPeriod,
  reportRange,
} from "@/lib/reporting";
import { getGoogleFeatures } from "@/lib/google-features";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ReportCard } from "@/components/ui/report-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
  CLIENT_STAGES,
  CLIENT_STAGE_LABELS,
  CLIENT_STAGE_COLORS,
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_LABELS,
  CANDIDATE_STAGE_COLORS,
  JOB_STAGES,
  JOB_STAGE_LABELS,
  JOB_STAGE_COLORS,
} from "@/lib/stages";

const FOLLOW_UP_DAYS = 5;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const now = new Date();
  const period = parseReportPeriod((await searchParams).period);
  const range = reportRange(period, now);
  const periodLabel = REPORT_PERIOD_LABELS[period];
  const formatDay = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  // range.end is exclusive, so the last day shown is the day before it
  // (or today, for ranges that run up to now).
  const lastDay =
    range.end.getTime() === now.getTime()
      ? now
      : new Date(range.end.getTime() - 1);
  const rangeText =
    formatDay(range.start) === formatDay(lastDay)
      ? formatDay(range.start)
      : `${formatDay(range.start)} – ${formatDay(lastDay)}`;
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const followUpThreshold = new Date(
    now.getTime() - FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000
  );

  const features = await getGoogleFeatures();

  const [
    contactCount,
    clientCount,
    candidateCount,
    activeJobCount,
    clientsByStage,
    candidatesByStage,
    jobsByStage,
    report,
    jobsFilledInPeriod,
    todaysMeetings,
    contactsWithRecentEmail,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.client.count(),
    prisma.candidate.count(),
    prisma.job.count({
      where: { stage: { notIn: ["FILLED_WON", "CANCELLED_LOST"] } },
    }),
    prisma.client.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.candidate.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.job.groupBy({ by: ["stage"], _count: { _all: true } }),
    getPlacementReport(range),
    prisma.job.findMany({
      where: {
        stage: "FILLED_WON",
        filledAt: { gte: range.start, lt: range.end },
      },
      orderBy: { filledAt: "desc" },
      include: { client: true },
    }),
    features.todaysMeetingsWidget
      ? prisma.meeting.findMany({
          where: { scheduledStart: { gte: startOfDay, lt: endOfDay } },
          orderBy: { scheduledStart: "asc" },
          include: { contact: true },
        })
      : Promise.resolve([]),
    features.followUpReminders
      ? prisma.contact.findMany({
          where: { emails: { some: {} } },
          include: { emails: { orderBy: { sentAt: "desc" }, take: 1 } },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  const clientStageCounts = Object.fromEntries(
    clientsByStage.map((row) => [row.stage, row._count._all])
  );
  const candidateStageCounts = Object.fromEntries(
    candidatesByStage.map((row) => [row.stage, row._count._all])
  );
  const jobStageCounts = Object.fromEntries(
    jobsByStage.map((row) => [row.stage, row._count._all])
  );

  const needsFollowUp = contactsWithRecentEmail
    .filter((contact) => {
      const lastEmail = contact.emails[0];
      return (
        lastEmail &&
        lastEmail.direction === "OUTBOUND" &&
        lastEmail.sentAt < followUpThreshold
      );
    })
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Jobs filled and clients landed, plus everything in the pipeline"
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Reporting period"
          className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-1"
        >
          {REPORT_PERIODS.map((option) => (
            <Link
              key={option}
              href={
                option === DEFAULT_REPORT_PERIOD
                  ? "/dashboard"
                  : `/dashboard?period=${option}`
              }
              aria-current={option === period ? "page" : undefined}
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                option === period
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              {REPORT_PERIOD_LABELS[option]}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-neutral-400">{rangeText}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="sm:col-span-2">
          <ReportCard
            title="Jobs Filled"
            value={report.jobsFilled}
            periodLabel={periodLabel}
            tone="positive"
            featured
            detail={`${report.clientsLanded} new client${
              report.clientsLanded === 1 ? "" : "s"
            } · ${report.repeatJobsFilled} repeat`}
          />
        </div>
        <ReportCard
          title="Clients Landed"
          value={report.clientsLanded}
          periodLabel={periodLabel}
          tone="positive"
          detail="First job filled for a new client"
        />
        <ReportCard
          title="Repeat Jobs Filled"
          value={report.repeatJobsFilled}
          periodLabel={periodLabel}
          detail="Filled for a client we'd already landed"
        />
        <ReportCard
          title="New Jobs"
          value={report.jobsOpened}
          periodLabel={periodLabel}
          detail="Jobs opened"
        />
        <ReportCard
          title="Jobs Lost"
          value={report.jobsLost}
          periodLabel={periodLabel}
          tone="negative"
          detail="Cancelled before being filled"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Jobs"
          value={activeJobCount}
          helpText="Not yet filled or lost"
          icon={Briefcase}
          color="amber"
        />
        <StatCard
          label="Clients"
          value={clientCount}
          icon={Building2}
          color="violet"
        />
        <StatCard
          label="Candidates"
          value={candidateCount}
          icon={UserSquare2}
          color="emerald"
        />
        <StatCard
          label="Contacts"
          value={contactCount}
          icon={Contact2}
          color="blue"
        />
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-neutral-900">
            Filled: {periodLabel}
          </h2>
        </div>
        {jobsFilledInPeriod.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-400">
            No jobs filled in this period.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-50">
            {jobsFilledInPeriod.map((job) => {
              const landedAt = report.landedAtByClient.get(job.clientId);
              const isNewClient =
                landedAt != null &&
                job.filledAt != null &&
                landedAt.getTime() === job.filledAt.getTime();
              return (
                <li
                  key={job.id}
                  className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-sm font-medium text-neutral-800 hover:text-blue-600"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-neutral-400">
                      <Link
                        href={`/clients/${job.clientId}`}
                        className="hover:text-blue-600"
                      >
                        {job.client.name}
                      </Link>
                      {job.filledAt &&
                        ` · ${job.filledAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}`}
                    </p>
                  </div>
                  <Badge
                    className={
                      isNewClient
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-blue-50 text-blue-700"
                    }
                  >
                    {isNewClient ? "New client" : "Repeat client"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {(features.todaysMeetingsWidget || features.followUpReminders) && (
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {features.todaysMeetingsWidget && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Video className="h-4 w-4 text-neutral-400" />
                <h2 className="text-sm font-semibold text-neutral-900">
                  Today&apos;s Meetings
                </h2>
              </div>
              {todaysMeetings.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">
                  No Google Meet calls scheduled for today.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-50">
                  {todaysMeetings.map((meeting) => (
                    <li
                      key={meeting.id}
                      className="-mx-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/contacts/${meeting.contactId}`}
                          className="text-sm font-medium text-neutral-800 hover:text-blue-600"
                        >
                          {meeting.title}
                        </Link>
                        <span className="shrink-0 text-xs text-neutral-400">
                          {meeting.scheduledStart.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">
                        {meeting.contact.firstName} {meeting.contact.lastName}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {features.followUpReminders && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <h2 className="text-sm font-semibold text-neutral-900">
                  Needs Follow-up
                </h2>
              </div>
              {needsFollowUp.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">
                  Nobody&apos;s waiting on a reply from you right now.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-50">
                  {needsFollowUp.map((contact) => (
                    <li
                      key={contact.id}
                      className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-50"
                    >
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-sm font-medium text-neutral-800 hover:text-blue-600"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                      <Badge className="bg-amber-50 text-amber-700">
                        No reply since{" "}
                        {contact.emails[0].sentAt.toLocaleDateString()}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Job Pipeline
            </h2>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {JOB_STAGES.filter((stage) => stage !== "CANCELLED_LOST").map(
              (stage) => (
                <div key={stage} className="flex items-center justify-between">
                  <Badge className={JOB_STAGE_COLORS[stage]}>
                    {JOB_STAGE_LABELS[stage]}
                  </Badge>
                  <span className="text-sm font-semibold text-neutral-700">
                    {jobStageCounts[stage] ?? 0}
                  </span>
                </div>
              )
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Client Pipeline
            </h2>
            <Link
              href="/clients"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {CLIENT_STAGES.filter((stage) => stage !== "LOST").map(
              (stage) => (
                <div key={stage} className="flex items-center justify-between">
                  <Badge className={CLIENT_STAGE_COLORS[stage]}>
                    {CLIENT_STAGE_LABELS[stage]}
                  </Badge>
                  <span className="text-sm font-semibold text-neutral-700">
                    {clientStageCounts[stage] ?? 0}
                  </span>
                </div>
              )
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Candidate Pipeline
            </h2>
            <Link
              href="/candidates"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {CANDIDATE_STAGES.filter((stage) => stage !== "REJECTED").map(
              (stage) => (
                <div key={stage} className="flex items-center justify-between">
                  <Badge className={CANDIDATE_STAGE_COLORS[stage]}>
                    {CANDIDATE_STAGE_LABELS[stage]}
                  </Badge>
                  <span className="text-sm font-semibold text-neutral-700">
                    {candidateStageCounts[stage] ?? 0}
                  </span>
                </div>
              )
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
