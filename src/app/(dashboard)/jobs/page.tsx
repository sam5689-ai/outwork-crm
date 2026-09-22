import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/stages";

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, matches: true },
  });

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Every open role across all of your deals"
      />

      <Card className="p-0">
        {jobs.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-400">
            No jobs yet. Open a job from a deal&apos;s page.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
                  <th className="px-4 py-3 font-semibold">Job</th>
                  <th className="px-4 py-3 font-semibold">Deal</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Matches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-neutral-50/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {job.title}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/clients/${job.clientId}`}
                        className="text-neutral-500 hover:text-blue-600"
                      >
                        {job.client.companyName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={JOB_STATUS_COLORS[job.status]}>
                        {JOB_STATUS_LABELS[job.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {job.matches.length}
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
