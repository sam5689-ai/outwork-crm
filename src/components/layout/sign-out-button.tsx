"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-red-600"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
