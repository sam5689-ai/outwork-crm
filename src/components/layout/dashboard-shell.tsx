"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardShell({
  name,
  role,
  companyName,
  logoUrl,
  children,
}: {
  name: string;
  role: "ADMIN" | "USER";
  companyName?: string;
  logoUrl?: string | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        companyName={companyName}
        logoUrl={logoUrl}
      />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar name={name} role={role} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
