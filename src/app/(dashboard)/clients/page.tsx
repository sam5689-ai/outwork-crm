import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StageSelect } from "@/components/ui/stage-select";
import { Badge } from "@/components/ui/badge";
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
        title="Clients"
        description="Every company we place with. A client is landed when their first job is filled"
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
                const filledCount = client.jobs.filter(
                  (job) => job.stage === "FILLED_WON"
                ).length;
                const activeCount = client.jobs.filter(
                  (job) =>
                    job.stage !== "FILLED_WON" && job.stage !== "CANCELLED_LOST"
                ).length;
                return (
                  <div
                    key={client.id}
                    className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300"
                  >
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-semibold text-neutral-900 hover:text-blue-600"
                    >
                      {client.name}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-400">
                      {client.contact.firstName} {client.contact.lastName}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {filledCount > 0 && (
                        <Badge className="bg-emerald-50 text-emerald-700">
                          Landed
                        </Badge>
                      )}
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-600">
                        {filledCount} filled
                      </span>
                      <span className="text-neutral-400">
                        {activeCount} active job{activeCount === 1 ? "" : "s"}
                      </span>
                    </div>
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
                  No clients {CLIENT_STAGE_LABELS[stage].toLowerCase()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <p className="mt-6 text-sm text-neutral-400">
          No clients yet. Convert a contact into a client to get started, or{" "}
          <Link href="/contacts/new" className="text-blue-600 hover:underline">
            add a new contact
          </Link>
          .
        </p>
      )}
    </div>
  );
}
