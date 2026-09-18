"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { CLIENT_STAGES } from "@/lib/stages";
import type { ClientStage, JobStatus } from "@/generated/prisma/enums";

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

export async function createJob(clientId: string, formData: FormData) {
  await requireUser();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  if (!title) return;

  await prisma.job.create({
    data: { clientId, title, description: description || null },
  });

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function updateJobStatus(
  clientId: string,
  jobId: string,
  formData: FormData
) {
  await requireUser();
  const status = formData.get("status")?.toString();
  if (!status) return;

  await prisma.job.update({
    where: { id: jobId },
    data: { status: status as JobStatus },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/jobs");
}
