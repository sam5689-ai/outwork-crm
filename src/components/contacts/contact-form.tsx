"use client";

import { useActionState } from "react";
import type { Contact } from "@/generated/prisma/client";
import type { ContactFormState } from "@/app/(dashboard)/contacts/actions";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { Button, LinkButton } from "@/components/ui/button";

type ContactAction = (
  state: ContactFormState,
  formData: FormData
) => Promise<ContactFormState>;

export function ContactForm({
  action,
  contact,
  cancelHref,
}: {
  action: ContactAction;
  contact?: Contact;
  cancelHref: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="First name" htmlFor="firstName">
          <Input
            id="firstName"
            name="firstName"
            required
            defaultValue={contact?.firstName}
          />
        </FormField>
        <FormField label="Last name" htmlFor="lastName">
          <Input
            id="lastName"
            name="lastName"
            required
            defaultValue={contact?.lastName}
          />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={contact?.email ?? ""}
          />
        </FormField>
        <FormField label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
        </FormField>
        <FormField label="Company" htmlFor="company">
          <Input
            id="company"
            name="company"
            defaultValue={contact?.company ?? ""}
          />
        </FormField>
      </div>
      <FormField label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={contact?.notes ?? ""}
        />
      </FormField>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save contact"}
        </Button>
        <LinkButton variant="secondary" href={cancelHref}>
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
