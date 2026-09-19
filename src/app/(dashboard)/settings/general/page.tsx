import { requireAdmin } from "@/lib/session";
import { getBranding } from "@/lib/branding";
import { Card } from "@/components/ui/card";
import { BrandingForm } from "@/components/settings/branding-form";

export default async function GeneralSettingsPage() {
  await requireAdmin();

  const branding = await getBranding();

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-1 text-sm font-semibold text-neutral-900">Branding</h2>
      <p className="mb-4 text-sm text-neutral-500">
        Customize how your workspace name and logo appear across the app.
      </p>
      <BrandingForm
        companyName={branding.companyName}
        primaryColor={branding.primaryColor}
        logoUrl={branding.logoUrl}
      />
    </Card>
  );
}
