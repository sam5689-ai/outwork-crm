"use client";

import { useActionState } from "react";
import type { CandidateFormState } from "@/app/(dashboard)/candidates/actions";
import { FormField, Input, Textarea, Select } from "@/components/ui/field";
import { Button, LinkButton } from "@/components/ui/button";
import { EDUCATION_LEVELS } from "@/lib/stages";

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
    <form action={formAction} className="space-y-6">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Contact
        </h3>
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
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Pay &amp; Availability
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Agreed pay rate" htmlFor="agreedPay">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-neutral-400">
                $
              </span>
              <Input
                id="agreedPay"
                name="agreedPay"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-6"
              />
            </div>
          </FormField>
          <FormField label="Pay unit" htmlFor="payUnit">
            <Select id="payUnit" name="payUnit" defaultValue="hourly">
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="flat">Flat</option>
            </Select>
          </FormField>
          <FormField label="Education" htmlFor="education">
            <Select id="education" name="education" defaultValue="">
              <option value="">Select...</option>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Available from" htmlFor="availableFrom">
            <Input id="availableFrom" name="availableFrom" type="date" />
          </FormField>
        </div>
        <div className="mt-4">
          <FormField label="Availability note" htmlFor="availabilityNote">
            <Input
              id="availabilityNote"
              name="availabilityNote"
              placeholder="e.g. Mornings only, needs 3 days notice"
            />
          </FormField>
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Location
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="City" htmlFor="city">
            <Input id="city" name="city" />
          </FormField>
          <FormField label="State" htmlFor="state">
            <Input id="state" name="state" />
          </FormField>
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Skills &amp; Resume
        </h3>
        <div className="space-y-4">
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
          <FormField label="Resume / experience notes" htmlFor="resumeNotes">
            <Textarea id="resumeNotes" name="resumeNotes" rows={4} />
          </FormField>
          <FormField label="Resume file" htmlFor="resume">
            <input
              type="file"
              id="resume"
              name="resume"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="w-full text-sm text-neutral-500 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Optional. PDF or Word document, up to 8MB.
            </p>
          </FormField>
          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} />
          </FormField>
        </div>
      </div>

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
