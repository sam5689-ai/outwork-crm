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
  Settings,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Contact2 },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/candidates", label: "Candidates", icon: UserSquare2 },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
];

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
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
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
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-100 bg-white px-4 py-6 transition-transform duration-200 lg:z-20 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
              O
            </div>
            <span className="text-base font-semibold text-slate-800">
              Outwork CRM
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
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
        </nav>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
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
