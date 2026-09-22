"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { CANDIDATE_STAGES } from "@/lib/stages";
import type { CandidateStage, MatchStatus } from "@/generated/prisma/enums";

const candidateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  skills: z.string().trim().optional(),
  resumeNotes: z.string().trim().optional(),
});

export type CandidateFormState = { error?: string } | undefined;

export async function createCandidate(
  _prevState: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  const user = await requireUser();

  const parsed = candidateSchema.safeParse({
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    company: formData.get("company")?.toString() ?? "",
    notes: formData.get("notes")?.toString() ?? "",
    skills: formData.get("skills")?.toString() ?? "",
    resumeNotes: formData.get("resumeNotes")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const candidate = await prisma.candidate.create({
    data: {
      skills: parsed.data.skills || null,
      resumeNotes: parsed.data.resumeNotes || null,
      contact: {
        create: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email || null,
          phone: parsed.data.phone || null,
          company: parsed.data.company || null,
          notes: parsed.data.notes || null,
          ownerId: user.id,
        },
      },
    },
  });

  await prisma.activity.create({
    data: {
      contactId: candidate.contactId,
      authorId: user.id,
      body: "Added as candidate.",
    },
  });

  revalidatePath("/candidates");
  revalidatePath("/contacts");
  redirect(`/candidates/${candidate.id}`);
}

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
