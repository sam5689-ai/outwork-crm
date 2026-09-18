"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { CANDIDATE_STAGES } from "@/lib/stages";
import type { CandidateStage, MatchStatus } from "@/generated/prisma/enums";

export async function updateCandidateStage(
  candidateId: string,
  formData: FormData
) {
  await requireUser();
  const stage = formData.get("stage")?.toString();
  if (
    !stage ||
    !CANDIDATE_STAGES.includes(stage as (typeof CANDIDATE_STAGES)[number])
  ) {
    return;
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { stage: stage as CandidateStage },
  });

  revalidatePath("/candidates");
  revalidatePath(`/candidates/${candidateId}`);
}

export async function updateCandidateProfile(
  candidateId: string,
  formData: FormData
) {
  await requireUser();
  const skills = formData.get("skills")?.toString().trim();
  const resumeNotes = formData.get("resumeNotes")?.toString().trim();

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      skills: skills || null,
      resumeNotes: resumeNotes || null,
    },
  });

  revalidatePath(`/candidates/${candidateId}`);
}

export async function proposeMatch(candidateId: string, formData: FormData) {
  await requireUser();
  const jobId = formData.get("jobId")?.toString();
  if (!jobId) return;

  await prisma.candidateMatch.upsert({
    where: { candidateId_jobId: { candidateId, jobId } },
    update: {},
    create: { candidateId, jobId, status: "PROPOSED" },
  });

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { stage: "MATCHED" },
  });

  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/clients");
  revalidatePath("/jobs");
}

export async function updateMatchStatus(
  candidateId: string,
  matchId: string,
  formData: FormData
) {
  await requireUser();
  const status = formData.get("status")?.toString();
  if (!status) return;

  await prisma.candidateMatch.update({
    where: { id: matchId },
    data: { status: status as MatchStatus },
  });

  if (status === "ACCEPTED") {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { stage: "ACCEPTED" },
    });
  }

  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/clients");
  revalidatePath("/jobs");
}
