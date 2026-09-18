import { Search, Menu } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

export function Topbar({
  name,
  role,
  onMenuClick,
}: {
  name: string;
  role: "ADMIN" | "USER";
  onMenuClick?: () => void;
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

      <div className="hidden items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-400 sm:flex sm:w-72">
        <Search className="h-4 w-4" />
        <span>Search contacts, clients, candidates...</span>
      </div>

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
