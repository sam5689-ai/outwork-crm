"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Contact2,
  Building2,
  UserSquare2,
  Briefcase,
  CalendarDays,
  Inbox,
  Settings,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Contact2 },
  { href: "/clients", label: "Deals", icon: Building2 },
  { href: "/candidates", label: "Candidates", icon: UserSquare2 },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

const inboxItem = { href: "/inbox", label: "Inbox", icon: Inbox };

const settingsItem = { href: "/settings", label: "Settings", icon: Settings };

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
  collapsed,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "lg:justify-center lg:px-0",
        active
          ? "bg-neutral-100 text-neutral-900"
          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      <span className={clsx(collapsed && "lg:hidden")}>{label}</span>
    </Link>
  );
}

export function Sidebar({
  mobileOpen = false,
  onClose,
  companyName = "Outwork CRM",
  logoUrl,
  inboxEnabled = false,
  collapsed = false,
  onToggleCollapse,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
  companyName?: string;
  logoUrl?: string | null;
  inboxEnabled?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-neutral-900/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-neutral-200 bg-white px-4 py-6 transition-[transform,width] duration-200 lg:z-20 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-20"
        )}
      >
        <div
          className={clsx(
            "mb-8 flex items-center justify-between px-2",
            collapsed && "lg:justify-center"
          )}
        >
          <Link
            href="/dashboard"
            className={clsx(
              "flex items-center gap-2",
              collapsed && "lg:justify-center"
            )}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={companyName}
                className="h-8 w-8 shrink-0 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white">
                {companyName.charAt(0).toUpperCase() || "O"}
              </div>
            )}
            <span
              className={clsx(
                "truncate text-[15px] font-semibold tracking-tight text-neutral-900",
                collapsed && "lg:hidden"
              )}
            >
              {companyName}
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-50 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p
          className={clsx(
            "mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400",
            collapsed && "lg:hidden"
          )}
        >
          Pipeline
        </p>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              onNavigate={onClose}
              active={
                pathname === item.href || pathname.startsWith(item.href + "/")
              }
              collapsed={collapsed}
            />
          ))}
          {inboxEnabled && (
            <NavLink
              {...inboxItem}
              onNavigate={onClose}
              active={pathname.startsWith(inboxItem.href)}
              collapsed={collapsed}
            />
          )}
        </nav>

        <div className="mt-4 border-t border-neutral-200 pt-4">
          <p
            className={clsx(
              "mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400",
              collapsed && "lg:hidden"
            )}
          >
            Account
          </p>
          <NavLink
            {...settingsItem}
            onNavigate={onClose}
            active={pathname.startsWith(settingsItem.href)}
            collapsed={collapsed}
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={clsx(
              "mt-1 hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 lg:flex",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
