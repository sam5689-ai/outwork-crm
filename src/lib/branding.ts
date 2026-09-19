import { prisma } from "@/lib/prisma";

export type Branding = {
  companyName: string;
  primaryColor: string;
  logoUrl: string | null;
};

const DEFAULT_BRANDING: Branding = {
  companyName: "Outwork CRM",
  primaryColor: "#5e72e4",
  logoUrl: null,
};

export async function getBranding(): Promise<Branding> {
  const setting = await prisma.setting.findUnique({
    where: { key: "branding" },
  });
  if (!setting) return DEFAULT_BRANDING;

  const value = setting.value as Partial<Branding>;
  return {
    companyName: value.companyName || DEFAULT_BRANDING.companyName,
    primaryColor: value.primaryColor || DEFAULT_BRANDING.primaryColor,
    logoUrl: value.logoUrl || null,
  };
}
