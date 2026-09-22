import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const jobId = request.nextUrl.searchParams.get("jobId") ?? undefined;

  const alreadyMatchedIds = jobId
    ? (
        await prisma.candidateMatch.findMany({
          where: { jobId },
          select: { candidateId: true },
        })
      ).map((m) => m.candidateId)
    : [];

  const candidates = await prisma.candidate.findMany({
    where: {
      id: { notIn: alreadyMatchedIds },
      ...(q
        ? {
            OR: [
              { contact: { firstName: { contains: q, mode: "insensitive" } } },
              { contact: { lastName: { contains: q, mode: "insensitive" } } },
              { skills: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { contact: true },
    orderBy: { updatedAt: "desc" },
    take: 15,
  });

  const results = candidates.map((c) => ({
    id: c.id,
    name: `${c.contact.firstName} ${c.contact.lastName}`,
    skills: c.skills,
    agreedPay: c.agreedPay,
    payUnit: c.payUnit,
    availabilityStatus: c.availabilityStatus,
    availableFrom: c.availableFrom,
  }));

  return NextResponse.json({ results });
}
