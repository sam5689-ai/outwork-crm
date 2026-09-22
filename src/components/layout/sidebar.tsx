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
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/candidates", label: "Candidates", icon: UserSquare2 },
  { href: "/contacts", label: "Contacts", icon: Contact2 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

const inboxItem = { href: "/inbox", label: "Inbox", icon: Inbox };

const settingsItem = { href: "/settings", label: "Settings", icon: Settings };

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
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
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
  companyName?: string;
  logoUrl?: string | null;
  inboxEnabled?: boolean;
  collapsed?: boolean;
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
          collapsed && "lg:w-16 lg:px-2",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className={clsx(
            "mb-8 flex items-center justify-between px-2",
            collapsed && "lg:justify-center lg:px-0"
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
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
              collapsed={collapsed}
              onNavigate={onClose}
              active={
                pathname === item.href || pathname.startsWith(item.href + "/")
              }
            />
          ))}
          {inboxEnabled && (
            <NavLink
              {...inboxItem}
              collapsed={collapsed}
              onNavigate={onClose}
              active={pathname.startsWith(inboxItem.href)}
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
            collapsed={collapsed}
            onNavigate={onClose}
            active={pathname.startsWith(settingsItem.href)}
          />
        </div>
      </aside>
    </>
  );
}
