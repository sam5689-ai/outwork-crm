import { requireUser } from "@/lib/session";
import { getBranding } from "@/lib/branding";
import { getGoogleFeatures } from "@/lib/google-features";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, branding, features] = await Promise.all([
    requireUser(),
    getBranding(),
    getGoogleFeatures(),
  ]);

  return (
    <DashboardShell
      name={user.name ?? user.email ?? "User"}
      role={user.role}
      companyName={branding.companyName}
      logoUrl={branding.logoUrl}
      inboxEnabled={features.inboxEnabled}
    >
      {children}
    </DashboardShell>
  );
}
