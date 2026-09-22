"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { applyPlacement } from "@/lib/placement";
import { MATCH_STATUSES } from "@/lib/stages";
import type { MatchStatus } from "@/generated/prisma/enums";

function toOptionalFloat(value: FormDataEntryValue | null) {
  const str = value?.toString().trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

export async function quickMatchCandidate(jobId: string, formData: FormData) {
  await requireUser();
  const candidateId = formData.get("candidateId")?.toString();
  if (!candidateId) return;

  const agreedPayRate = toOptionalFloat(formData.get("agreedPayRate"));

  await prisma.candidateMatch.upsert({
    where: { candidateId_jobId: { candidateId, jobId } },
    update: {},
    create: { candidateId, jobId, status: "SUGGESTED", agreedPayRate },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}

export async function updateJobMatchStatus(
  jobId: string,
  matchId: string,
  formData: FormData
) {
  await requireUser();
  const status = formData.get("status")?.toString();
  if (!status || !MATCH_STATUSES.includes(status as (typeof MATCH_STATUSES)[number])) {
    return;
  }

  await prisma.candidateMatch.update({
    where: { id: matchId },
    data: { status: status as MatchStatus },
  });

  if (status === "PLACED") {
    await applyPlacement(matchId);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/candidates");
}

export async function removeMatch(jobId: string, formData: FormData) {
  await requireUser();
  const matchId = formData.get("matchId")?.toString();
  if (!matchId) return;

  await prisma.candidateMatch.delete({ where: { id: matchId } });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}
