"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { applyPlacement } from "@/lib/placement";
import { CANDIDATE_STAGES, MATCH_STATUSES } from "@/lib/stages";
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
  agreedPay: z.string().trim().optional(),
  payUnit: z.string().trim().optional(),
  education: z.string().trim().optional(),
  availableFrom: z.string().trim().optional(),
  availabilityNote: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
});

function toOptionalFloat(value: string | undefined) {
  const str = value?.trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

export type CandidateFormState = { error?: string } | undefined;
export type ResumeFormState = { error?: string } | undefined;

const MAX_RESUME_BYTES = 8 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type ParsedResumeFile = {
  filename: string;
  mimeType: string;
  data: Uint8Array<ArrayBuffer>;
};

async function parseResumeFile(
  formData: FormData
): Promise<
  { ok: true; file: ParsedResumeFile | null } | { ok: false; error: string }
> {
  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: true, file: null };
  }
  if (file.size > MAX_RESUME_BYTES) {
    return { ok: false, error: "Resume file is too large (max 8MB)." };
  }
  if (!ALLOWED_RESUME_TYPES.has(file.type)) {
    return { ok: false, error: "Resume must be a PDF or Word document." };
  }

  const data = new Uint8Array(await file.arrayBuffer());
  return {
    ok: true,
    file: { filename: file.name, mimeType: file.type, data },
  };
}

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
    agreedPay: formData.get("agreedPay")?.toString() ?? "",
    payUnit: formData.get("payUnit")?.toString() ?? "",
    education: formData.get("education")?.toString() ?? "",
    availableFrom: formData.get("availableFrom")?.toString() ?? "",
    availabilityNote: formData.get("availabilityNote")?.toString() ?? "",
    city: formData.get("city")?.toString() ?? "",
    state: formData.get("state")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const resumeResult = await parseResumeFile(formData);
  if (!resumeResult.ok) {
    return { error: resumeResult.error };
  }

  const candidate = await prisma.candidate.create({
    data: {
      skills: parsed.data.skills || null,
      resumeNotes: parsed.data.resumeNotes || null,
      resumeFilename: resumeResult.file?.filename,
      resumeMimeType: resumeResult.file?.mimeType,
      resumeData: resumeResult.file?.data,
      agreedPay: toOptionalFloat(parsed.data.agreedPay),
      payUnit: parsed.data.payUnit || "hourly",
      education: parsed.data.education || null,
      availableFrom: parsed.data.availableFrom
        ? new Date(parsed.data.availableFrom)
        : null,
      availabilityNote: parsed.data.availabilityNote || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
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
  const availableFromRaw = formData.get("availableFrom")?.toString().trim();

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      skills: skills || null,
      resumeNotes: resumeNotes || null,
      agreedPay: toOptionalFloat(formData.get("agreedPay")?.toString()),
      payUnit: formData.get("payUnit")?.toString().trim() || "hourly",
      education: formData.get("education")?.toString().trim() || null,
      availableFrom: availableFromRaw ? new Date(availableFromRaw) : null,
      availabilityNote:
        formData.get("availabilityNote")?.toString().trim() || null,
      availabilityStatus:
        formData.get("availabilityStatus")?.toString().trim() || "Available",
      city: formData.get("city")?.toString().trim() || null,
      state: formData.get("state")?.toString().trim() || null,
    },
  });

  revalidatePath(`/candidates/${candidateId}`);
}

export async function uploadResume(
  candidateId: string,
  _prevState: ResumeFormState,
  formData: FormData
): Promise<ResumeFormState> {
  await requireUser();

  const result = await parseResumeFile(formData);
  if (!result.ok) {
    return { error: result.error };
  }
  if (!result.file) {
    return { error: "Choose a PDF or Word document to upload." };
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      resumeFilename: result.file.filename,
      resumeMimeType: result.file.mimeType,
      resumeData: result.file.data,
    },
  });

  revalidatePath(`/candidates/${candidateId}`);
  return undefined;
}

export async function removeResume(candidateId: string) {
  await requireUser();

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { resumeFilename: null, resumeMimeType: null, resumeData: null },
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
    create: { candidateId, jobId, status: "SUGGESTED" },
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
  if (!status || !MATCH_STATUSES.includes(status as (typeof MATCH_STATUSES)[number])) {
    return;
  }

  await prisma.candidateMatch.update({
    where: { id: matchId },
    data: { status: status as MatchStatus },
  });

  if (status === "PLACED") {
    await applyPlacement(matchId);
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { stage: "ACCEPTED" },
    });
  }

  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/clients");
  revalidatePath("/jobs");
}
