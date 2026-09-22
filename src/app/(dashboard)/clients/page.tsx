import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StageSelect } from "@/components/ui/stage-select";
import { CLIENT_STAGES, CLIENT_STAGE_LABELS } from "@/lib/stages";
import { updateClientStage } from "./actions";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: { contact: true, jobs: true },
    orderBy: { updatedAt: "desc" },
  });

  const columns = CLIENT_STAGES.map((stage) => ({
    stage,
    clients: clients.filter((client) => client.stage === stage),
  }));

  return (
    <div>
      <PageHeader
        title="Deals"
        description="Track each deal from first interest through to a passed trial"
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(({ stage, clients: stageClients }) => (
          <div key={stage} className="w-72 shrink-0">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {CLIENT_STAGE_LABELS[stage]}
              </h2>
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-500">
                {stageClients.length}
              </span>
            </div>
            <div className="space-y-3">
              {stageClients.map((client) => {
                const updateStageWithId = updateClientStage.bind(
                  null,
                  client.id
                );
                return (
                  <div
                    key={client.id}
                    className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300"
                  >
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-semibold text-neutral-900 hover:text-blue-600"
                    >
                      {client.companyName}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-400">
                      {client.contact.firstName} {client.contact.lastName}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {client.jobs.length} job
                      {client.jobs.length === 1 ? "" : "s"}
                    </p>
                    <div className="mt-3">
                      <StageSelect
                        action={updateStageWithId}
                        name="stage"
                        defaultValue={client.stage}
                        options={CLIENT_STAGES.map((s) => ({
                          value: s,
                          label: CLIENT_STAGE_LABELS[s],
                        }))}
                      />
                    </div>
                  </div>
                );
              })}
              {stageClients.length === 0 && (
                <div
                  className={`rounded-xl border border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-400`}
                >
                  No deals {CLIENT_STAGE_LABELS[stage].toLowerCase()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <p className="mt-6 text-sm text-neutral-400">
          No deals yet. Convert a contact into a deal to get started, or{" "}
          <Link href="/contacts/new" className="text-blue-600 hover:underline">
            add a new contact
          </Link>
          .
        </p>
      )}
    </div>
  );
}
