import { requireAdmin } from "@/lib/session";
import { getBranding } from "@/lib/branding";
import { Card } from "@/components/ui/card";
import { BrandingForm } from "@/components/settings/branding-form";
import { LoadDemoDataButton } from "@/components/settings/load-demo-data-button";
import { loadDemoData } from "../actions";

export default async function GeneralSettingsPage() {
  await requireAdmin();

  const branding = await getBranding();

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-neutral-900">
          Branding
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Customize how your workspace name and logo appear across the app.
        </p>
        <BrandingForm
          companyName={branding.companyName}
          primaryColor={branding.primaryColor}
          logoUrl={branding.logoUrl}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-neutral-900">
          Demo data
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Populate the CRM with sample clients, candidates, jobs and activity
          so you can see how everything looks. Safe to click more than
          once - it won&apos;t create duplicates.
        </p>
        <LoadDemoDataButton action={loadDemoData} />
      </Card>
    </div>
  );
}
