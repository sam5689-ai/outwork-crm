"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Sidebar } from "./sidebar";
import { SIDEBAR_COOKIE } from "./sidebar-cookie";
import { Topbar } from "./topbar";

export function DashboardShell({
  name,
  role,
  companyName,
  logoUrl,
  inboxEnabled,
  initialCollapsed = false,
  children,
}: {
  name: string;
  role: "ADMIN" | "USER";
  companyName?: string;
  logoUrl?: string | null;
  inboxEnabled?: boolean;
  initialCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    // Cookie rather than localStorage so the server renders the right width.
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        companyName={companyName}
        logoUrl={logoUrl}
        inboxEnabled={inboxEnabled}
        collapsed={collapsed}
      />
      <div
        className={clsx(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-[96px]" : "lg:pl-[252px]"
        )}
      >
        <Topbar
          name={name}
          role={role}
          onMenuClick={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
          onToggleSidebar={toggleCollapsed}
        />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
