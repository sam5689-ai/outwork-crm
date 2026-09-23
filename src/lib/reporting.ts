import { prisma } from "@/lib/prisma";

export const REPORT_PERIODS = [
  "week",
  "month",
  "last-month",
  "quarter",
  "last-quarter",
  "year",
] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const DEFAULT_REPORT_PERIOD: ReportPeriod = "month";

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  week: "This week",
  month: "This month",
  "last-month": "Last month",
  quarter: "This quarter",
  "last-quarter": "Last quarter",
  year: "Year to date",
};

export function parseReportPeriod(value: string | undefined): ReportPeriod {
  return REPORT_PERIODS.includes(value as ReportPeriod)
    ? (value as ReportPeriod)
    : DEFAULT_REPORT_PERIOD;
}

export type DateRange = { start: Date; end: Date };

/** [start, end) for a reporting period, in UTC. "This ..." periods run up to now. */
export function reportRange(period: ReportPeriod, now = new Date()): DateRange {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const quarterStartMonth = Math.floor(m / 3) * 3;
  const utc = (year: number, month: number, day = 1) =>
    new Date(Date.UTC(year, month, day));

  switch (period) {
    case "week": {
      const daysSinceMonday = (now.getUTCDay() + 6) % 7;
      return { start: utc(y, m, now.getUTCDate() - daysSinceMonday), end: now };
    }
    case "month":
      return { start: utc(y, m), end: now };
    case "last-month":
      return { start: utc(y, m - 1), end: utc(y, m) };
    case "quarter":
      return { start: utc(y, quarterStartMonth), end: now };
    case "last-quarter":
      return { start: utc(y, quarterStartMonth - 3), end: utc(y, quarterStartMonth) };
    case "year":
      return { start: utc(y, 0), end: now };
  }
}

/**
 * The placement numbers the business runs on, for a date range. A job is the
 * unit of work, so:
 *
 * - Jobs filled: jobs that reached FILLED_WON in the range (by filledAt).
 * - Clients landed: clients whose *first* filled job was filled in the
 *   range. A client that comes back for another job adds to jobs filled but
 *   not to clients landed.
 * - Repeat jobs filled: jobs filled in the range that weren't a client's
 *   first fill, i.e. jobs filled minus clients landed.
 */
export async function getPlacementReport({ start, end }: DateRange) {
  const inRange = { gte: start, lt: end };

  const [jobsFilled, jobsLost, jobsOpened, firstFills] = await Promise.all([
    prisma.job.count({ where: { stage: "FILLED_WON", filledAt: inRange } }),
    prisma.job.count({ where: { stage: "CANCELLED_LOST", cancelledAt: inRange } }),
    prisma.job.count({ where: { createdAt: inRange } }),
    prisma.job.groupBy({
      by: ["clientId"],
      where: { stage: "FILLED_WON", filledAt: { not: null } },
      _min: { filledAt: true },
    }),
  ]);

  const clientsLanded = firstFills.filter(
    (row) => row._min.filledAt && row._min.filledAt >= start && row._min.filledAt < end
  ).length;

  return {
    jobsFilled,
    clientsLanded,
    repeatJobsFilled: jobsFilled - clientsLanded,
    jobsLost,
    jobsOpened,
    /** Map of clientId -> when their first job was filled (i.e. when they were landed). */
    landedAtByClient: new Map(
      firstFills.flatMap((row) =>
        row._min.filledAt ? [[row.clientId, row._min.filledAt] as const] : []
      )
    ),
  };
}
