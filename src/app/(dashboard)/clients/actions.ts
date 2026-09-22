"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { jobStageTimestamps } from "@/lib/placement";
import { CLIENT_STAGES, JOB_STAGES } from "@/lib/stages";
import type { ClientStage, JobStage } from "@/generated/prisma/enums";

export async function updateClientStage(clientId: string, formData: FormData) {
  await requireUser();
  const stage = formData.get("stage")?.toString();
  if (!stage || !CLIENT_STAGES.includes(stage as (typeof CLIENT_STAGES)[number])) {
    return;
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { stage: stage as ClientStage },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

function toOptionalFloat(value: FormDataEntryValue | null) {
  const str = value?.toString().trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

function toOptionalInt(value: FormDataEntryValue | null) {
  const str = value?.toString().trim();
  if (!str) return null;
  const num = Number.parseInt(str, 10);
  return Number.isFinite(num) ? num : null;
}

export async function updateClientDetails(clientId: string, formData: FormData) {
  await requireUser();

  const name = formData.get("name")?.toString().trim();
  if (!name) return;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      email: formData.get("email")?.toString().trim() || null,
      website: formData.get("website")?.toString().trim() || null,
      industry: formData.get("industry")?.toString().trim() || null,
      employeeCount: toOptionalInt(formData.get("employeeCount")),
      workHours: formData.get("workHours")?.toString().trim() || null,
      payRate: toOptionalFloat(formData.get("payRate")),
      payUnit: formData.get("payUnit")?.toString().trim() || "hourly",
      street: formData.get("street")?.toString().trim() || null,
      city: formData.get("city")?.toString().trim() || null,
      state: formData.get("state")?.toString().trim() || null,
      zipCode: formData.get("zipCode")?.toString().trim() || null,
      country: formData.get("country")?.toString().trim() || "US",
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function createJob(clientId: string, formData: FormData) {
  await requireUser();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  if (!title) return;

  const startDateRaw = formData.get("startDate")?.toString();
  const skillsRaw = formData.get("requiredSkills")?.toString().trim();

  const job = await prisma.job.create({
    data: {
      clientId,
      title,
      description: description || null,
      openingsCount: toOptionalInt(formData.get("openingsCount")) || 1,
      startDate: startDateRaw ? new Date(startDateRaw) : null,
      workHours: formData.get("workHours")?.toString().trim() || null,
      billRate: toOptionalFloat(formData.get("billRate")),
      targetPayRate: toOptionalFloat(formData.get("targetPayRate")),
      requiredSkills: skillsRaw
        ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

export async function updateJobStage(jobId: string, formData: FormData) {
  await requireUser();
  const stage = formData.get("stage")?.toString();
  if (!stage || !JOB_STAGES.includes(stage as (typeof JOB_STAGES)[number])) {
    return;
  }

  const current = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      stage: stage as JobStage,
      ...jobStageTimestamps(current.stage, stage as JobStage),
    },
  });

  revalidatePath(`/clients/${job.clientId}`);
  revalidatePath("/clients");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function duplicateJob(jobId: string, formData: FormData) {
  await requireUser();
  const original = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });

  const openingsCount =
    toOptionalInt(formData.get("openingsCount")) || original.openingsCount;

  const clone = await prisma.job.create({
    data: {
      clientId: original.clientId,
      title: original.title,
      description: original.description,
      stage: "OPEN",
      openingsCount,
      startDate: original.startDate,
      workHours: original.workHours,
      billRate: original.billRate,
      targetPayRate: original.targetPayRate,
      requiredSkills: original.requiredSkills,
    },
  });

  revalidatePath(`/clients/${original.clientId}`);
  revalidatePath("/jobs");
  redirect(`/jobs/${clone.id}`);
}
