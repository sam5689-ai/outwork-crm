import { cookies } from "next/headers";
import { requireUser } from "@/lib/session";
import { getBranding } from "@/lib/branding";
import { getGoogleFeatures } from "@/lib/google-features";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SIDEBAR_COOKIE } from "@/components/layout/sidebar-cookie";
import { DueTodayBanner } from "@/components/reminders/due-today-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, branding, features, cookieStore] = await Promise.all([
    requireUser(),
    getBranding(),
    getGoogleFeatures(),
    cookies(),
  ]);

  return (
    <DashboardShell
      name={user.name ?? user.email ?? "User"}
      role={user.role}
      companyName={branding.companyName}
      logoUrl={branding.logoUrl}
      inboxEnabled={features.inboxEnabled}
      initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "1"}
    >
      <DueTodayBanner userId={user.id} />
      {children}
    </DashboardShell>
  );
}
