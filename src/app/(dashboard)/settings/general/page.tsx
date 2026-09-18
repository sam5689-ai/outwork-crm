import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { BrandingForm } from "@/components/settings/branding-form";

type Branding = { companyName: string; primaryColor: string };

export default async function GeneralSettingsPage() {
  await requireAdmin();

  const setting = await prisma.setting.findUnique({
    where: { key: "branding" },
  });
  const branding = (setting?.value as Branding | undefined) ?? {
    companyName: "Outwork CRM",
    primaryColor: "#5e72e4",
  };

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-1 text-sm font-semibold text-neutral-900">Branding</h2>
      <p className="mb-4 text-sm text-neutral-500">
        Customize how your workspace name appears across the app.
      </p>
      <BrandingForm
        companyName={branding.companyName}
        primaryColor={branding.primaryColor}
      />
    </Card>
  );
}
