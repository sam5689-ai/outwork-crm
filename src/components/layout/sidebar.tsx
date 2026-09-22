"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Gauge,
  BriefcaseBusiness,
  Building2,
  UserRound,
  Contact,
  CalendarDays,
  Mail,
  SlidersHorizontal,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/candidates", label: "Candidates", icon: UserRound },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

const inboxItem = { href: "/inbox", label: "Inbox", icon: Mail };

const settingsItem = { href: "/settings", label: "Settings", icon: SlidersHorizontal };

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
  icon: typeof Gauge;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex h-12 items-center gap-3 rounded-[18px] px-4 text-sm font-semibold transition-colors",
        collapsed && "lg:w-12 lg:justify-center lg:self-center lg:px-0",
        active
          ? "bg-white text-ink"
          : "text-[#9EA1AB] hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="h-[21px] w-[21px] shrink-0" strokeWidth={2} />
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
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={clsx(
          "fixed inset-y-3 left-3 z-40 flex w-60 flex-col rounded-[28px] bg-ink px-3 py-5 shadow-lg transition-[transform,width] duration-200 lg:z-20 lg:translate-x-0",
          collapsed && "lg:w-[84px]",
          mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+12px)]"
        )}
      >
        <div
          className={clsx(
            "mb-6 flex items-center justify-between px-1",
            collapsed && "lg:justify-center lg:px-0"
          )}
        >
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={companyName}
                className="h-12 w-12 shrink-0 rounded-[16px] bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-accent font-display text-lg font-bold text-white">
                {companyName.charAt(0).toUpperCase() || "O"}
              </div>
            )}
            <span
              className={clsx(
                "truncate font-display text-[15px] font-semibold text-white",
                collapsed && "lg:hidden"
              )}
            >
              {companyName}
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-full p-2 text-[#9EA1AB] hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              collapsed={collapsed}
              onNavigate={onClose}
              active={isActive(item.href)}
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

        <div className="flex flex-col pt-4">
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
