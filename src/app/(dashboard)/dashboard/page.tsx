import Link from "next/link";
import {
  Contact,
  Building2,
  UserRound,
  BriefcaseBusiness,
  Video,
  Clock,
  ArrowUpRight,
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
import { Badge } from "@/components/ui/badge";
import {
  CLIENT_STAGES,
  CLIENT_STAGE_LABELS,
  CLIENT_STAGE_COLORS,
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_LABELS,
  CANDIDATE_STAGE_COLORS,
  JOB_STAGES,
  JOB_STAGE_LABELS,
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
    jobsInProgress,
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
    prisma.job.findMany({
      where: { stage: { notIn: ["FILLED_WON", "CANCELLED_LOST"] } },
      orderBy: [{ startDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
      take: 3,
      include: { client: true, matches: { where: { status: "PLACED" } } },
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

  const maxJobStageCount = Math.max(
    1,
    ...JOB_STAGES.map((stage) => jobStageCounts[stage] ?? 0)
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
      <div className="mb-6 flex flex-col gap-5">
        <div>
          <p className="text-sm font-medium text-neutral-500">
            {now.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            })}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">
            Placement report
          </h1>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <nav
            aria-label="Reporting period"
            className="-mx-1 flex gap-1 overflow-x-auto rounded-[26px] bg-white p-1 shadow-sm md:mx-0 md:self-start"
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
                  "flex h-10 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-colors",
                  option === period
                    ? "bg-ink text-white"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-ink"
                )}
              >
                {REPORT_PERIOD_LABELS[option]}
              </Link>
            ))}
          </nav>
          <p className="text-xs font-semibold text-neutral-500">{rangeText}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section className="relative flex min-h-[300px] flex-col overflow-hidden rounded-[32px] bg-ink p-8 text-white xl:col-span-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 -top-36 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,var(--color-accent)_0%,transparent_70%)] opacity-60"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-10 top-9 h-56 w-56 rounded-full border border-white/15"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-20 top-[76px] h-36 w-36 rounded-full border border-white/10"
          />
          <p className="relative flex items-center gap-2.5 text-sm font-medium text-[#C9CBD3]">
            <span className="h-2 w-2 rounded-full bg-[#7CF2B0]" />
            Jobs filled · {rangeText}
          </p>
          <div className="relative mt-2 flex items-end gap-5">
            <span className="font-display text-[132px] font-bold leading-[0.9] tracking-[-0.06em] sm:text-[148px]">
              {report.jobsFilled}
            </span>
            <span className="pb-5 text-[15px] leading-relaxed text-[#C9CBD3]">
              job{report.jobsFilled === 1 ? "" : "s"} filled
              <br />
              {periodLabel.toLowerCase()}
            </span>
          </div>
          <div className="flex-1" />
          <div className="relative mt-6 flex flex-wrap gap-2.5">
            <span className="flex h-9 items-center rounded-full bg-[#7CF2B0]/15 px-4 text-[13px] font-semibold text-[#9FF7C6]">
              {report.clientsLanded} new client{report.clientsLanded === 1 ? "" : "s"} landed
            </span>
            <span className="flex h-9 items-center rounded-full bg-white/10 px-4 text-[13px] font-semibold text-[#E4E5EA]">
              {report.repeatJobsFilled} repeat job{report.repeatJobsFilled === 1 ? "" : "s"}
            </span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-5 xl:col-span-5">
          <MetricTile
            label="Clients landed"
            value={report.clientsLanded}
            caption="First job filled"
            tone="accent"
          />
          <MetricTile
            label="Repeat jobs"
            value={report.repeatJobsFilled}
            caption="From landed clients"
          />
          <MetricTile
            label="New jobs"
            value={report.jobsOpened}
            caption="Jobs opened"
            tone="lime"
          />
          <MetricTile
            label="Jobs lost"
            value={report.jobsLost}
            caption="Cancelled before filling"
            tone="warn"
          />
        </div>

        <Card className="flex flex-col gap-4 xl:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Job pipeline</h2>
            <Link
              href="/jobs"
              aria-label="Open jobs board"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-ink hover:text-white"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          {JOB_STAGES.filter((stage) => stage !== "CANCELLED_LOST").map((stage) => {
            const count = jobStageCounts[stage] ?? 0;
            const filled = stage === "FILLED_WON";
            return (
              <div key={stage} className="flex items-center gap-3.5">
                <span
                  className={clsx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                    count === 0
                      ? "bg-neutral-100 text-neutral-400"
                      : filled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-900"
                  )}
                >
                  {count}
                </span>
                <span className="flex-1 text-sm font-semibold">
                  {JOB_STAGE_LABELS[stage]}
                </span>
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
                  <span
                    className={clsx(
                      "block h-full rounded-full",
                      filled ? "bg-emerald-600" : "bg-accent"
                    )}
                    style={{ width: `${(count / maxJobStageCount) * 100}%` }}
                  />
                </span>
              </div>
            );
          })}
        </Card>

        <Card className="flex flex-col xl:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">
              Filled {periodLabel.toLowerCase()}
            </h2>
            <Link
              href="/jobs"
              className="text-[13px] font-semibold text-accent hover:underline"
            >
              All jobs →
            </Link>
          </div>
          {jobsFilledInPeriod.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              No jobs filled in this period.
            </p>
          ) : (
            <ul>
              {jobsFilledInPeriod.map((job) => {
                const landedAt = report.landedAtByClient.get(job.clientId);
                const isNewClient =
                  landedAt != null &&
                  job.filledAt != null &&
                  landedAt.getTime() === job.filledAt.getTime();
                return (
                  <li
                    key={job.id}
                    className="flex items-center gap-4 border-b border-neutral-100 py-4"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-canvas font-display text-sm font-semibold">
                      {initialsOf(job.client.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="block truncate text-[15px] font-bold hover:text-accent"
                      >
                        {job.title}
                      </Link>
                      <p className="truncate text-[13px] text-neutral-500">
                        <Link
                          href={`/clients/${job.clientId}`}
                          className="hover:text-accent"
                        >
                          {job.client.name}
                        </Link>
                        {job.filledAt &&
                          ` · ${job.filledAt.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}`}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        "flex h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-bold",
                        isNewClient
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-900"
                      )}
                    >
                      {isNewClient ? "New client" : "Repeat client"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {jobsInProgress.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-[13px] font-bold text-neutral-500">In progress</p>
              {jobsInProgress.map((job) => {
                const placed = job.matches.length;
                const seats = Math.max(job.openingsCount, placed);
                return (
                  <div key={job.id} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="min-w-0 flex-1 truncate text-[15px] font-bold hover:text-accent"
                    >
                      {job.title}
                      <span className="font-medium text-neutral-500"> · {job.client.name}</span>
                    </Link>
                    <span className="flex gap-1.5" aria-hidden="true">
                      {Array.from({ length: Math.min(seats, 8) }, (_, i) => (
                        <span
                          key={i}
                          className={clsx(
                            "h-6 w-6 rounded-full",
                            i < placed
                              ? "bg-accent"
                              : "border-2 border-dashed border-neutral-300"
                          )}
                        />
                      ))}
                    </span>
                    <span className="text-[13px] font-bold">
                      {placed} of {job.openingsCount} placed
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active jobs"
          value={activeJobCount}
          helpText="Not yet filled or lost"
          icon={BriefcaseBusiness}
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
          icon={UserRound}
          color="emerald"
        />
        <StatCard
          label="Contacts"
          value={contactCount}
          icon={Contact}
          color="blue"
        />
      </div>

      {(features.todaysMeetingsWidget || features.followUpReminders) && (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          {features.todaysMeetingsWidget && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Video className="h-4 w-4 text-neutral-400" />
                <h2 className="font-display text-base font-semibold text-ink">
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
                <h2 className="font-display text-base font-semibold text-ink">
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

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">
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
            <h2 className="font-display text-base font-semibold text-ink">
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

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const TILE_TONES = {
  accent: { card: "bg-accent text-white", muted: "text-white/85", value: "" },
  lime: { card: "bg-lime text-lime-950", muted: "text-lime-900", value: "" },
  warn: { card: "bg-white", muted: "text-neutral-500", value: "text-orange-700" },
  plain: { card: "bg-white", muted: "text-neutral-500", value: "" },
};

function MetricTile({
  label,
  value,
  caption,
  tone = "plain",
}: {
  label: string;
  value: number;
  caption: string;
  tone?: keyof typeof TILE_TONES;
}) {
  const t = TILE_TONES[tone];
  return (
    <section
      className={clsx(
        "flex min-h-[140px] flex-col rounded-[28px] p-5 shadow-sm",
        t.card
      )}
    >
      <h2 className={clsx("text-[13px] font-semibold", t.muted)}>{label}</h2>
      <div className="flex-1" />
      <p
        className={clsx(
          "font-display text-[48px] font-semibold leading-none tracking-[-0.04em]",
          t.value
        )}
      >
        {value}
      </p>
      <p className={clsx("mt-1.5 text-xs", t.muted)}>{caption}</p>
    </section>
  );
}
