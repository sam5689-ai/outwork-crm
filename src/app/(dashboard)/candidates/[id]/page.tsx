import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Textarea, Input } from "@/components/ui/field";
import { StageSelect } from "@/components/ui/stage-select";
import {
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_LABELS,
  MATCH_STATUS_LABELS,
  MATCH_STATUS_COLORS,
} from "@/lib/stages";
import {
  updateCandidateStage,
  updateCandidateProfile,
  proposeMatch,
  updateMatchStatus,
} from "../actions";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      contact: true,
      matches: {
        orderBy: { createdAt: "desc" },
        include: { job: { include: { client: true } } },
      },
    },
  });

  if (!candidate) notFound();

  const matchedJobIds = new Set(candidate.matches.map((m) => m.jobId));
  const availableJobs = await prisma.job.findMany({
    where: { status: "OPEN", id: { notIn: [...matchedJobIds] } },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const updateStageWithId = updateCandidateStage.bind(null, candidate.id);
  const updateProfileWithId = updateCandidateProfile.bind(null, candidate.id);
  const proposeMatchWithId = proposeMatch.bind(null, candidate.id);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {candidate.contact.firstName} {candidate.contact.lastName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            <Link
              href={`/contacts/${candidate.contact.id}`}
              className="font-medium text-indigo-500 hover:underline"
            >
              View contact
            </Link>
          </p>
        </div>
        <StageSelect
          action={updateStageWithId}
          name="stage"
          defaultValue={candidate.stage}
          options={CANDIDATE_STAGES.map((s) => ({
            value: s,
            label: CANDIDATE_STAGE_LABELS[s],
          }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Profile
          </h2>
          <form action={updateProfileWithId} className="space-y-4">
            <FormField label="Skills" htmlFor="skills">
              <Input
                id="skills"
                name="skills"
                placeholder="e.g. React, Node.js, Sales"
                defaultValue={candidate.skills ?? ""}
              />
            </FormField>
            <FormField label="Resume notes" htmlFor="resumeNotes">
              <Textarea
                id="resumeNotes"
                name="resumeNotes"
                rows={6}
                defaultValue={candidate.resumeNotes ?? ""}
              />
            </FormField>
            <Button type="submit" variant="secondary">
              Save profile
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Job Matches
          </h2>

          {availableJobs.length > 0 && (
            <form
              action={proposeMatchWithId}
              className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 p-3"
            >
              <select
                name="jobId"
                required
                className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Match to a job...</option>
                {availableJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.client.companyName} &middot; {job.title}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary">
                Propose Match
              </Button>
            </form>
          )}

          {candidate.matches.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              No job matches yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {candidate.matches.map((match) => {
                const updateMatchStatusWithId = updateMatchStatus.bind(
                  null,
                  candidate.id,
                  match.id
                );
                return (
                  <li
                    key={match.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2.5"
                  >
                    <div>
                      <Link
                        href={`/clients/${match.job.clientId}`}
                        className="text-sm font-medium text-slate-700 hover:text-indigo-500"
                      >
                        {match.job.client.companyName}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {match.job.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={MATCH_STATUS_COLORS[match.status]}>
                        {MATCH_STATUS_LABELS[match.status]}
                      </Badge>
                      <StageSelect
                        action={updateMatchStatusWithId}
                        name="status"
                        defaultValue={match.status}
                        options={Object.entries(MATCH_STATUS_LABELS).map(
                          ([value, label]) => ({ value, label })
                        )}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
