import { requireUser } from "@/lib/session";
import { getBranding } from "@/lib/branding";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, branding] = await Promise.all([requireUser(), getBranding()]);

  return (
    <DashboardShell
      name={user.name ?? user.email ?? "User"}
      role={user.role}
      companyName={branding.companyName}
      logoUrl={branding.logoUrl}
    >
      {children}
    </DashboardShell>
  );
}
