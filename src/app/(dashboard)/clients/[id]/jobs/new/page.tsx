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
        title={`New Job for ${client.companyName}`}
        description="Open a role you're recruiting candidates for"
      />
      <Card className="max-w-xl">
        <form action={createJobWithId} className="space-y-4">
          <FormField label="Job title" htmlFor="title">
            <Input id="title" name="title" required />
          </FormField>
          <FormField label="Description" htmlFor="description">
            <Textarea id="description" name="description" rows={4} />
          </FormField>
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
