import Link from "next/link";
import { Contact2, Building2, UserSquare2, Briefcase, Video, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getGoogleFeatures } from "@/lib/google-features";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ReportCard } from "@/components/ui/report-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
  CLIENT_STAGES,
  CLIENT_STAGE_LABELS,
  CLIENT_STAGE_COLORS,
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_LABELS,
  CANDIDATE_STAGE_COLORS,
  JOB_STAGES,
  JOB_STAGE_LABELS,
  JOB_STAGE_COLORS,
} from "@/lib/stages";

const FOLLOW_UP_DAYS = 5;

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const followUpThreshold = new Date(
    now.getTime() - FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000
  );

  const features = await getGoogleFeatures();

  const [
    contactCount,
    clientCount,
    candidateCount,
    openJobCount,
    clientsByStage,
    candidatesByStage,
    jobsByStage,
    dealsWonMonth,
    dealsWonYear,
    dealsLostMonth,
    dealsLostYear,
    newClientsMonth,
    newClientsYear,
    todaysMeetings,
    contactsWithRecentEmail,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.client.count(),
    prisma.candidate.count(),
    prisma.job.count({ where: { stage: "OPEN" } }),
    prisma.client.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.candidate.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.job.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.client.count({
      where: { stage: "TRIAL_PASSED", updatedAt: { gte: startOfMonth } },
    }),
    prisma.client.count({
      where: { stage: "TRIAL_PASSED", updatedAt: { gte: startOfYear } },
    }),
    prisma.client.count({
      where: { stage: "LOST", updatedAt: { gte: startOfMonth } },
    }),
    prisma.client.count({
      where: { stage: "LOST", updatedAt: { gte: startOfYear } },
    }),
    prisma.client.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.client.count({ where: { createdAt: { gte: startOfYear } } }),
    features.todaysMeetingsWidget
      ? prisma.meeting.findMany({
          where: { scheduledStart: { gte: startOfDay, lt: endOfDay } },
          orderBy: { scheduledStart: "asc" },
          include: { contact: true },
        })
      : Promise.resolve([]),
    features.followUpReminders
      ? prisma.contact.findMany({
          where: { emails: { some: {} } },
          include: { emails: { orderBy: { sentAt: "desc" }, take: 1 } },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  const clientStageCounts = Object.fromEntries(
    clientsByStage.map((row) => [row.stage, row._count._all])
  );
  const candidateStageCounts = Object.fromEntries(
    candidatesByStage.map((row) => [row.stage, row._count._all])
  );
  const jobStageCounts = Object.fromEntries(
    jobsByStage.map((row) => [row.stage, row._count._all])
  );

  const needsFollowUp = contactsWithRecentEmail
    .filter((contact) => {
      const lastEmail = contact.emails[0];
      return (
        lastEmail &&
        lastEmail.direction === "OUTBOUND" &&
        lastEmail.sentAt < followUpThreshold
      );
    })
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your contacts, deals and candidates"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Contacts"
          value={contactCount}
          icon={Contact2}
          color="blue"
        />
        <StatCard
          label="Deals"
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

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          Reporting
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ReportCard
            title="Deals Won"
            thisMonth={dealsWonMonth}
            yearToDate={dealsWonYear}
            tone="positive"
          />
          <ReportCard
            title="Deals Lost"
            thisMonth={dealsLostMonth}
            yearToDate={dealsLostYear}
            tone="negative"
          />
          <ReportCard
            title="New Deals"
            thisMonth={newClientsMonth}
            yearToDate={newClientsYear}
          />
        </div>
      </div>

      {(features.todaysMeetingsWidget || features.followUpReminders) && (
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {features.todaysMeetingsWidget && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Video className="h-4 w-4 text-neutral-400" />
                <h2 className="text-sm font-semibold text-neutral-900">
                  Today&apos;s Meetings
                </h2>
              </div>
              {todaysMeetings.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">
                  No Google Meet calls scheduled for today.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-50">
                  {todaysMeetings.map((meeting) => (
                    <li
                      key={meeting.id}
                      className="-mx-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/contacts/${meeting.contactId}`}
                          className="text-sm font-medium text-neutral-800 hover:text-blue-600"
                        >
                          {meeting.title}
                        </Link>
                        <span className="shrink-0 text-xs text-neutral-400">
                          {meeting.scheduledStart.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">
                        {meeting.contact.firstName} {meeting.contact.lastName}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {features.followUpReminders && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <h2 className="text-sm font-semibold text-neutral-900">
                  Needs Follow-up
                </h2>
              </div>
              {needsFollowUp.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">
                  Nobody&apos;s waiting on a reply from you right now.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-50">
                  {needsFollowUp.map((contact) => (
                    <li
                      key={contact.id}
                      className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-50"
                    >
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-sm font-medium text-neutral-800 hover:text-blue-600"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                      <Badge className="bg-amber-50 text-amber-700">
                        No reply since{" "}
                        {contact.emails[0].sentAt.toLocaleDateString()}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Job Pipeline
            </h2>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {JOB_STAGES.filter((stage) => stage !== "CANCELLED_LOST").map(
              (stage) => (
                <div key={stage} className="flex items-center justify-between">
                  <Badge className={JOB_STAGE_COLORS[stage]}>
                    {JOB_STAGE_LABELS[stage]}
                  </Badge>
                  <span className="text-sm font-semibold text-neutral-700">
                    {jobStageCounts[stage] ?? 0}
                  </span>
                </div>
              )
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Deal Pipeline
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
    </div>
  );
}
