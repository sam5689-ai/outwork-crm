"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { seedDemoData } from "@/lib/demo-data";

export type SettingsFormState = { error?: string; success?: string } | undefined;

const MAX_LOGO_BYTES = 1_000_000; // 1MB
const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];

export async function updateBranding(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();

  const companyName = formData.get("companyName")?.toString().trim();
  const primaryColor = formData.get("primaryColor")?.toString().trim();
  const removeLogo = formData.get("removeLogo") === "on";
  const logoFile = formData.get("logo");

  if (!companyName) {
    return { error: "Company name is required." };
  }

  const existing = await prisma.setting.findUnique({
    where: { key: "branding" },
  });
  const existingValue = (existing?.value as { logoUrl?: string | null }) ?? {};
  let logoUrl: string | null = existingValue.logoUrl ?? null;

  if (removeLogo) {
    logoUrl = null;
  } else if (logoFile instanceof File && logoFile.size > 0) {
    if (!ALLOWED_LOGO_TYPES.includes(logoFile.type)) {
      return { error: "Logo must be a PNG, JPEG, WEBP, GIF or SVG image." };
    }
    if (logoFile.size > MAX_LOGO_BYTES) {
      return { error: "Logo must be smaller than 1MB." };
    }
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    logoUrl = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
  }

  await prisma.setting.upsert({
    where: { key: "branding" },
    update: {
      value: { companyName, primaryColor: primaryColor || "#5e72e4", logoUrl },
    },
    create: {
      key: "branding",
      value: { companyName, primaryColor: primaryColor || "#5e72e4", logoUrl },
    },
  });

  revalidatePath("/settings/general");
  revalidatePath("/", "layout");
  return { success: "Branding updated." };
}

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Only letters, numbers, dots, dashes and underscores"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "USER"]),
});

export async function createUser(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    username: formData.get("username")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    role: formData.get("role")?.toString() ?? "USER",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: parsed.data.username },
        { email: parsed.data.email },
      ],
    },
  });
  if (existing) {
    return { error: "A user with that username or email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  revalidatePath("/settings/users");
  return { success: `User "${parsed.data.username}" created.` };
}

export async function updateUserRole(userId: string, formData: FormData) {
  const admin = await requireAdmin();
  const role = formData.get("role")?.toString();
  if (role !== "ADMIN" && role !== "USER") return;
  if (userId === admin.id && role === "USER") {
    revalidatePath("/settings/users");
    return;
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/settings/users");
}

export async function toggleUserActive(userId: string, formData: FormData) {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    revalidatePath("/settings/users");
    return;
  }
  const active = formData.get("active") === "true";

  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/settings/users");
}

export async function disconnectGoogleAccount() {
  const user = await requireUser();
  await prisma.googleAccount.deleteMany({ where: { userId: user.id } });
  revalidatePath("/settings/integrations");
}

const GOOGLE_FEATURE_KEYS = [
  "emailSync",
  "autoLogEmailActivity",
  "importCalendarMeetings",
  "todaysMeetingsWidget",
  "followUpReminders",
  "inboxEnabled",
] as const;

export async function updateGoogleFeatures(formData: FormData) {
  await requireAdmin();

  const value = Object.fromEntries(
    GOOGLE_FEATURE_KEYS.map((key) => [key, formData.get(key) === "on"])
  );

  await prisma.setting.upsert({
    where: { key: "googleFeatures" },
    update: { value },
    create: { key: "googleFeatures", value },
  });

  revalidatePath("/settings/integrations");
  revalidatePath("/dashboard");
  revalidatePath("/contacts", "layout");
  revalidatePath("/inbox", "layout");
}

export type DemoDataState = { message: string } | undefined;

export async function loadDemoData(): Promise<DemoDataState> {
  const admin = await requireAdmin();

  const result = await seedDemoData(prisma, admin.id);

  revalidatePath("/dashboard");
  revalidatePath("/contacts");
  revalidatePath("/clients");
  revalidatePath("/candidates");
  revalidatePath("/jobs");

  return {
    message: result.skipped
      ? "Demo data was already loaded - nothing new added."
      : "Demo data added: 5 clients, 5 candidates, jobs, matches, notes, meetings and emails.",
  };
}
