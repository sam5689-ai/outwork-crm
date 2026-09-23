"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export function DashboardShell({
  name,
  role,
  companyName,
  logoUrl,
  inboxEnabled,
  children,
}: {
  name: string;
  role: "ADMIN" | "USER";
  companyName?: string;
  logoUrl?: string | null;
  inboxEnabled?: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
      } catch {
        // localStorage unavailable (private browsing, etc.) - keep default
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
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
        onToggleCollapse={toggleCollapsed}
      />
      <div
        className={clsx(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <Topbar name={name} role={role} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
