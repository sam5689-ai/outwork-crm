import { prisma } from "@/lib/prisma";

export function calculateMargin(billRate: number, agreedPay: number) {
  const hourlyMargin = billRate - agreedPay;
  const marginPercentage = billRate > 0 ? (hourlyMargin / billRate) * 100 : 0;
  return { hourlyMargin, marginPercentage };
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

  if (placedCount >= match.job.openingsCount) {
    await prisma.job.update({
      where: { id: match.jobId },
      data: { stage: "FILLED_WON" },
    });
  }

  return { placedCount, openingsCount: match.job.openingsCount };
}
