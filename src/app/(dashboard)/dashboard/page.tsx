import Link from "next/link";
import { Contact2, Building2, UserSquare2, Briefcase } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
  CLIENT_STAGES,
  CLIENT_STAGE_LABELS,
  CLIENT_STAGE_COLORS,
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_LABELS,
  CANDIDATE_STAGE_COLORS,
} from "@/lib/stages";

export default async function DashboardPage() {
  const [
    contactCount,
    clientCount,
    candidateCount,
    openJobCount,
    clientsByStage,
    candidatesByStage,
    recentContacts,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.client.count(),
    prisma.candidate.count(),
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.client.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.candidate.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: true, candidate: true },
    }),
  ]);

  const clientStageCounts = Object.fromEntries(
    clientsByStage.map((row) => [row.stage, row._count._all])
  );
  const candidateStageCounts = Object.fromEntries(
    candidatesByStage.map((row) => [row.stage, row._count._all])
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your contacts, clients and candidates"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Contacts"
          value={contactCount}
          icon={Contact2}
          color="blue"
        />
        <StatCard
          label="Clients"
          value={clientCount}
          icon={Building2}
          color="violet"
        />
        <StatCard
          label="Candidates"
          value={candidateCount}
          icon={UserSquare2}
          color="emerald"
        />
        <StatCard
          label="Open Jobs"
          value={openJobCount}
          icon={Briefcase}
          color="amber"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Client Pipeline
            </h2>
            <Link
              href="/clients"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {CLIENT_STAGES.filter((stage) => stage !== "LOST").map(
              (stage) => (
                <div key={stage} className="flex items-center justify-between">
                  <Badge className={CLIENT_STAGE_COLORS[stage]}>
                    {CLIENT_STAGE_LABELS[stage]}
                  </Badge>
                  <span className="text-sm font-semibold text-neutral-700">
                    {clientStageCounts[stage] ?? 0}
                  </span>
                </div>
              )
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Candidate Pipeline
            </h2>
            <Link
              href="/candidates"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {CANDIDATE_STAGES.filter((stage) => stage !== "REJECTED").map(
              (stage) => (
                <div key={stage} className="flex items-center justify-between">
                  <Badge className={CANDIDATE_STAGE_COLORS[stage]}>
                    {CANDIDATE_STAGE_LABELS[stage]}
                  </Badge>
                  <span className="text-sm font-semibold text-neutral-700">
                    {candidateStageCounts[stage] ?? 0}
                  </span>
                </div>
              )
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">
            Recent Contacts
          </h2>
          <Link
            href="/contacts"
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {recentContacts.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            No contacts yet. Add your first contact to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-neutral-400">
                  <th className="pb-2 font-semibold">Name</th>
                  <th className="pb-2 font-semibold">Company</th>
                  <th className="pb-2 font-semibold">Email</th>
                  <th className="pb-2 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {recentContacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="py-2.5">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-neutral-900 hover:text-blue-600"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                    </td>
                    <td className="py-2.5 text-neutral-500">
                      {contact.company ?? "-"}
                    </td>
                    <td className="py-2.5 text-neutral-500">
                      {contact.email ?? "-"}
                    </td>
                    <td className="py-2.5">
                      {contact.client && (
                        <Badge className="bg-violet-50 text-violet-700">
                          Client
                        </Badge>
                      )}
                      {contact.candidate && (
                        <Badge className="ml-1 bg-emerald-50 text-emerald-700">
                          Candidate
                        </Badge>
                      )}
                      {!contact.client && !contact.candidate && (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
