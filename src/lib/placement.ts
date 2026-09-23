import { prisma } from "@/lib/prisma";
import type { JobStage } from "@/generated/prisma/enums";

export function calculateMargin(billRate: number, agreedPay: number) {
  const hourlyMargin = billRate - agreedPay;
  const marginPercentage = billRate > 0 ? (hourlyMargin / billRate) * 100 : 0;
  return { hourlyMargin, marginPercentage };
}

/**
 * The filledAt/cancelledAt writes for moving a job from one stage to
 * another. Entering FILLED_WON / CANCELLED_LOST stamps the time (once -
 * re-saving the same stage keeps the original date); leaving it clears the
 * stamp so a re-opened job isn't still counted as filled.
 */
export function jobStageTimestamps(from: JobStage, to: JobStage, now = new Date()) {
  return {
    filledAt: to === "FILLED_WON" ? (from === "FILLED_WON" ? undefined : now) : null,
    cancelledAt:
      to === "CANCELLED_LOST" ? (from === "CANCELLED_LOST" ? undefined : now) : null,
  };
}

/**
 * Runs after a CandidateMatch is set to PLACED: marks the candidate
 * unavailable, and if the job's openings are now all filled, moves the
 * job to FILLED_WON.
 */
export async function applyPlacement(matchId: string) {
  const match = await prisma.candidateMatch.findUniqueOrThrow({
    where: { id: matchId },
    include: { job: true },
  });

  await prisma.candidate.update({
    where: { id: match.candidateId },
    data: { availabilityStatus: "Placed" },
  });

  const placedCount = await prisma.candidateMatch.count({
    where: { jobId: match.jobId, status: "PLACED" },
  });

  if (placedCount >= match.job.openingsCount && match.job.stage !== "FILLED_WON") {
    await prisma.job.update({
      where: { id: match.jobId },
      data: {
        stage: "FILLED_WON",
        ...jobStageTimestamps(match.job.stage, "FILLED_WON"),
      },
    });
  }

  return { placedCount, openingsCount: match.job.openingsCount };
}
