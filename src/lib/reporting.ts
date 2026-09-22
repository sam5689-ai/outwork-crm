import { prisma } from "@/lib/prisma";

export type PeriodCount = { thisMonth: number; yearToDate: number };

export function reportingPeriods(now = new Date()) {
  return {
    startOfMonth: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    startOfYear: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
  };
}

/**
 * The placement numbers the business runs on. A job is the unit of work, so:
 *
 * - Jobs filled: jobs that reached FILLED_WON in the period (by filledAt).
 * - Clients landed: clients whose *first* filled job was filled in the
 *   period. A client that comes back for another job adds to jobs filled but
 *   not to clients landed.
 * - Repeat jobs filled: jobs filled in the period that weren't a client's
 *   first fill, i.e. jobs filled minus clients landed.
 */
export async function getPlacementReport(now = new Date()) {
  const { startOfMonth, startOfYear } = reportingPeriods(now);

  const [
    filledMonth,
    filledYear,
    cancelledMonth,
    cancelledYear,
    openedMonth,
    openedYear,
    firstFills,
  ] = await Promise.all([
    prisma.job.count({ where: { stage: "FILLED_WON", filledAt: { gte: startOfMonth } } }),
    prisma.job.count({ where: { stage: "FILLED_WON", filledAt: { gte: startOfYear } } }),
    prisma.job.count({
      where: { stage: "CANCELLED_LOST", cancelledAt: { gte: startOfMonth } },
    }),
    prisma.job.count({
      where: { stage: "CANCELLED_LOST", cancelledAt: { gte: startOfYear } },
    }),
    prisma.job.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.job.count({ where: { createdAt: { gte: startOfYear } } }),
    prisma.job.groupBy({
      by: ["clientId"],
      where: { stage: "FILLED_WON", filledAt: { not: null } },
      _min: { filledAt: true },
    }),
  ]);

  const landedSince = (start: Date) =>
    firstFills.filter((row) => row._min.filledAt && row._min.filledAt >= start).length;

  const landed: PeriodCount = {
    thisMonth: landedSince(startOfMonth),
    yearToDate: landedSince(startOfYear),
  };
  const filled: PeriodCount = { thisMonth: filledMonth, yearToDate: filledYear };

  return {
    jobsFilled: filled,
    clientsLanded: landed,
    repeatJobsFilled: {
      thisMonth: filled.thisMonth - landed.thisMonth,
      yearToDate: filled.yearToDate - landed.yearToDate,
    },
    jobsLost: { thisMonth: cancelledMonth, yearToDate: cancelledYear },
    jobsOpened: { thisMonth: openedMonth, yearToDate: openedYear },
    /** Map of clientId -> when their first job was filled (i.e. when they were landed). */
    landedAtByClient: new Map(
      firstFills.flatMap((row) =>
        row._min.filledAt ? [[row.clientId, row._min.filledAt] as const] : []
      )
    ),
  };
}
