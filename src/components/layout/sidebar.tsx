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
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-neutral-100 text-neutral-900"
          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      {label}
    </Link>
  );
}

export function Sidebar({
  mobileOpen = false,
  onClose,
  companyName = "Outwork CRM",
  logoUrl,
  inboxEnabled = false,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
  companyName?: string;
  logoUrl?: string | null;
  inboxEnabled?: boolean;
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
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-neutral-200 bg-white px-4 py-6 transition-transform duration-200 lg:z-20 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 flex items-center justify-between px-2">
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
            <span className="truncate text-[15px] font-semibold tracking-tight text-neutral-900">
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

        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
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
            />
          ))}
          {inboxEnabled && (
            <NavLink
              {...inboxItem}
              onNavigate={onClose}
              active={pathname.startsWith(inboxItem.href)}
            />
          )}
        </nav>

        <div className="mt-4 border-t border-neutral-200 pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Account
          </p>
          <NavLink
            {...settingsItem}
            onNavigate={onClose}
            active={pathname.startsWith(settingsItem.href)}
          />
        </div>
      </aside>
    </>
  );
}
