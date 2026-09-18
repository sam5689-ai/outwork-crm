import Link from "next/link";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const tabs = [
    { href: "/settings/general", label: "General", adminOnly: true },
    { href: "/settings/users", label: "Users", adminOnly: true },
    { href: "/settings/integrations", label: "Integrations", adminOnly: false },
  ].filter((tab) => !tab.adminOnly || user.role === "ADMIN");

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your workspace, team and integrations"
      />
      <div className="mb-6 flex gap-1 border-b border-neutral-200">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2.5 text-sm font-medium text-neutral-500 hover:text-blue-600"
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
