"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/field";

type ClientDetails = {
  name: string;
  email: string | null;
  website: string | null;
  industry: string | null;
  employeeCount: number | null;
  workHours: string | null;
  payRate: number | null;
  payUnit: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
};

/**
 * Company details/billing form, collapsed by default. The client page's
 * main job on open is showing recent activity, not this form - so it's
 * tucked behind a toggle instead of being the first thing rendered.
 */
export function CompanyDetailsSection({
  client,
  action,
}: {
  client: ClientDetails;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className={open ? undefined : "py-4"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-display text-sm font-semibold text-ink">
          Company details &amp; billing
        </span>
        <span className="flex items-center gap-2 text-xs text-neutral-400">
          {!open &&
            [client.email, client.website, client.industry, client.city]
              .filter(Boolean)
              .join(" · ")}
          <ChevronRight
            className={clsx(
              "h-4 w-4 shrink-0 transition-transform",
              open && "rotate-90"
            )}
          />
        </span>
      </button>

      {open && (
        <form action={action} className="mt-5 space-y-5">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Overview
            </h3>
            <div className="space-y-3">
              <FormField label="Company name" htmlFor="name">
                <Input id="name" name="name" required defaultValue={client.name} />
              </FormField>
              <FormField label="Email" htmlFor="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={client.email ?? ""}
                />
              </FormField>
              <FormField label="Website" htmlFor="website">
                <Input
                  id="website"
                  name="website"
                  placeholder="https://"
                  defaultValue={client.website ?? ""}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Industry" htmlFor="industry">
                  <Input
                    id="industry"
                    name="industry"
                    defaultValue={client.industry ?? ""}
                  />
                </FormField>
                <FormField label="Employees" htmlFor="employeeCount">
                  <Input
                    id="employeeCount"
                    name="employeeCount"
                    type="number"
                    min="0"
                    defaultValue={client.employeeCount ?? ""}
                  />
                </FormField>
              </div>
              <FormField label="Work hours" htmlFor="workHours">
                <Input
                  id="workHours"
                  name="workHours"
                  placeholder="Mon-Fri, 8:00 AM - 4:30 PM"
                  defaultValue={client.workHours ?? ""}
                />
              </FormField>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Bill Rate
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Client bill rate" htmlFor="payRate">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-neutral-400">
                    $
                  </span>
                  <Input
                    id="payRate"
                    name="payRate"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={client.payRate ?? ""}
                    className="pl-6"
                  />
                </div>
              </FormField>
              <FormField label="Unit" htmlFor="payUnit">
                <Select id="payUnit" name="payUnit" defaultValue={client.payUnit}>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="flat">Flat</option>
                </Select>
              </FormField>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Address
            </h3>
            <div className="space-y-3">
              <FormField label="Street" htmlFor="street">
                <Input id="street" name="street" defaultValue={client.street ?? ""} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="City" htmlFor="city">
                  <Input id="city" name="city" defaultValue={client.city ?? ""} />
                </FormField>
                <FormField label="State" htmlFor="state">
                  <Input id="state" name="state" defaultValue={client.state ?? ""} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="ZIP code" htmlFor="zipCode">
                  <Input
                    id="zipCode"
                    name="zipCode"
                    defaultValue={client.zipCode ?? ""}
                  />
                </FormField>
                <FormField label="Country" htmlFor="country">
                  <Input
                    id="country"
                    name="country"
                    defaultValue={client.country ?? "US"}
                  />
                </FormField>
              </div>
            </div>
          </div>

          <Button type="submit" variant="secondary">
            Save details
          </Button>
        </form>
      )}
    </Card>
  );
}
