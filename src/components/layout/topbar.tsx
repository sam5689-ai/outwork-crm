import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SignOutButton } from "./sign-out-button";
import { GlobalSearch } from "./global-search";

export function Topbar({
  name,
  role,
  onMenuClick,
  sidebarCollapsed = false,
  onToggleSidebar,
}: {
  name: string;
  role: "ADMIN" | "USER";
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-50 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden rounded-lg p-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 lg:inline-flex"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      )}

      <GlobalSearch />

      <div className="flex items-center gap-3 sm:ml-auto">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
            {initials || "U"}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-neutral-900">
              {name}
            </p>
            <p className="text-xs leading-tight text-neutral-400 capitalize">
              {role.toLowerCase()}
            </p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
