"use client";

import { useActionState, useState } from "react";
import type { SettingsFormState } from "@/app/(dashboard)/settings/actions";
import { updateBranding } from "@/app/(dashboard)/settings/actions";
import { FormField, Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function BrandingForm({
  companyName,
  primaryColor,
  logoUrl,
}: {
  companyName: string;
  primaryColor: string;
  logoUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState<
    SettingsFormState,
    FormData
  >(updateBranding, undefined);

  const [preview, setPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const displayedLogo = removeLogo ? null : preview ?? logoUrl;

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
            {displayedLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayedLogo}
                alt="Logo preview"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xs text-neutral-400">No logo</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              disabled={removeLogo}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setPreview(null);
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setPreview(reader.result as string);
                reader.readAsDataURL(file);
              }}
              className="block w-full text-sm text-neutral-500 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 disabled:opacity-50"
            />
            {logoUrl && (
              <label className="flex items-center gap-2 text-sm text-neutral-500">
                <input
                  type="checkbox"
                  name="removeLogo"
                  checked={removeLogo}
                  onChange={(e) => setRemoveLogo(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                Remove current logo
              </label>
            )}
            <p className="text-xs text-neutral-400">
              PNG, JPEG, WEBP, GIF or SVG. Max 1MB.
            </p>
          </div>
        </div>
      </div>

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
            className="h-10 w-14 cursor-pointer rounded-lg border border-neutral-200"
          />
          <span className="text-sm text-neutral-500">{primaryColor}</span>
        </div>
      </FormField>

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
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
