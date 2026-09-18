"use client";

import { useActionState } from "react";
import type { SettingsFormState } from "@/app/(dashboard)/settings/actions";
import { updateBranding } from "@/app/(dashboard)/settings/actions";
import { FormField, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function BrandingForm({
  companyName,
  primaryColor,
}: {
  companyName: string;
  primaryColor: string;
}) {
  const [state, formAction, isPending] = useActionState<
    SettingsFormState,
    FormData
  >(updateBranding, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <FormField label="Company name" htmlFor="companyName">
        <Input id="companyName" name="companyName" defaultValue={companyName} />
      </FormField>
      <FormField label="Primary color" htmlFor="primaryColor">
        <div className="flex items-center gap-3">
          <input
            id="primaryColor"
            name="primaryColor"
            type="color"
            defaultValue={primaryColor}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200"
          />
          <span className="text-sm text-slate-500">{primaryColor}</span>
        </div>
      </FormField>

      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
