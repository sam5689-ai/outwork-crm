"use client";

import { useActionState } from "react";
import type { CandidateFormState } from "@/app/(dashboard)/candidates/actions";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { Button, LinkButton } from "@/components/ui/button";

type CandidateAction = (
  state: CandidateFormState,
  formData: FormData
) => Promise<CandidateFormState>;

export function CandidateForm({
  action,
  cancelHref,
}: {
  action: CandidateAction;
  cancelHref: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="First name" htmlFor="firstName">
          <Input id="firstName" name="firstName" required />
        </FormField>
        <FormField label="Last name" htmlFor="lastName">
          <Input id="lastName" name="lastName" required />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" />
        </FormField>
        <FormField label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" />
        </FormField>
        <FormField label="Company" htmlFor="company">
          <Input id="company" name="company" />
        </FormField>
        <FormField label="Skills" htmlFor="skills">
          <Input
            id="skills"
            name="skills"
            placeholder="e.g. React, Node.js, Sales"
          />
        </FormField>
      </div>
      <FormField label="Resume / experience notes" htmlFor="resumeNotes">
        <Textarea id="resumeNotes" name="resumeNotes" rows={4} />
      </FormField>
      <FormField label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} />
      </FormField>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Add candidate"}
        </Button>
        <LinkButton variant="secondary" href={cancelHref}>
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
