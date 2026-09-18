"use client";

import { useActionState } from "react";
import type { SettingsFormState } from "@/app/(dashboard)/settings/actions";
import { createUser } from "@/app/(dashboard)/settings/actions";
import { FormField, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState<
    SettingsFormState,
    FormData
  >(createUser, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="name">
          <Input id="name" name="name" required />
        </FormField>
        <FormField label="Username" htmlFor="username">
          <Input id="username" name="username" required />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" required />
        </FormField>
        <FormField label="Temporary password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
          />
        </FormField>
        <FormField label="Role" htmlFor="role">
          <Select id="role" name="role" defaultValue="USER">
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </FormField>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create user"}
      </Button>
    </form>
  );
}
