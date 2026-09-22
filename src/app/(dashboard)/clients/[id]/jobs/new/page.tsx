import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { Button, LinkButton } from "@/components/ui/button";
import { createJob } from "../../../actions";

export default async function NewJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const createJobWithId = createJob.bind(null, client.id);

  return (
    <div>
      <PageHeader
        title={`New Job for ${client.name}`}
        description="Open a role you're recruiting candidates for"
      />
      <Card className="max-w-xl">
        <form action={createJobWithId} className="space-y-5">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Role
            </h3>
            <div className="space-y-4">
              <FormField label="Job title" htmlFor="title">
                <Input id="title" name="title" required />
              </FormField>
              <FormField label="Description" htmlFor="description">
                <Textarea id="description" name="description" rows={4} />
              </FormField>
              <FormField label="Required skills" htmlFor="requiredSkills">
                <Input
                  id="requiredSkills"
                  name="requiredSkills"
                  placeholder="Comma-separated, e.g. Forklift Certified, Inventory Systems"
                />
              </FormField>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Openings &amp; Timing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Workers needed" htmlFor="openingsCount">
                <Input
                  id="openingsCount"
                  name="openingsCount"
                  type="number"
                  min="1"
                  defaultValue={1}
                />
              </FormField>
              <FormField label="Start date" htmlFor="startDate">
                <Input id="startDate" name="startDate" type="date" />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Work hours" htmlFor="workHours">
                <Input
                  id="workHours"
                  name="workHours"
                  placeholder={client.workHours || "Mon-Fri, 8:00 AM - 4:30 PM"}
                  defaultValue={client.workHours ?? ""}
                />
              </FormField>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Pay &amp; Margin
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Bill rate" htmlFor="billRate">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-neutral-400">
                    $
                  </span>
                  <Input
                    id="billRate"
                    name="billRate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={client.payRate?.toString() ?? "0.00"}
                    defaultValue={client.payRate ?? ""}
                    className="pl-6"
                  />
                </div>
              </FormField>
              <FormField label="Target pay rate" htmlFor="targetPayRate">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-neutral-400">
                    $
                  </span>
                  <Input
                    id="targetPayRate"
                    name="targetPayRate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-6"
                  />
                </div>
              </FormField>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit">Create job</Button>
            <LinkButton variant="secondary" href={`/clients/${client.id}`}>
              Cancel
            </LinkButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
