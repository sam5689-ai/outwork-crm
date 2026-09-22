import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Textarea, Input, Select } from "@/components/ui/field";
import { StageSelect } from "@/components/ui/stage-select";
import { ResumeUpload } from "@/components/candidates/resume-upload";
import { UpcomingMeetingsCard } from "@/components/calendar/upcoming-meetings-card";
import {
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_LABELS,
  MATCH_STATUSES,
  MATCH_STATUS_LABELS,
  MATCH_STATUS_COLORS,
  AVAILABILITY_STATUSES,
  AVAILABILITY_STATUS_COLORS,
  EDUCATION_LEVELS,
} from "@/lib/stages";
import {
  updateCandidateStage,
  updateCandidateProfile,
  uploadResume,
  removeResume,
  proposeMatch,
  updateMatchStatus,
} from "../actions";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, candidate] = await Promise.all([
    requireUser(),
    prisma.candidate.findUnique({
      where: { id },
      include: {
        contact: true,
        matches: {
          orderBy: { createdAt: "desc" },
          include: { job: { include: { client: true } } },
        },
      },
    }),
  ]);

  if (!candidate) notFound();

  const matchedJobIds = new Set(candidate.matches.map((m) => m.jobId));
  const availableJobs = await prisma.job.findMany({
    where: { stage: "OPEN", id: { notIn: [...matchedJobIds] } },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const updateStageWithId = updateCandidateStage.bind(null, candidate.id);
  const updateProfileWithId = updateCandidateProfile.bind(null, candidate.id);
  const uploadResumeWithId = uploadResume.bind(null, candidate.id);
  const removeResumeWithId = removeResume.bind(null, candidate.id);
  const proposeMatchWithId = proposeMatch.bind(null, candidate.id);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
              {candidate.contact.firstName} {candidate.contact.lastName}
            </h1>
            <Badge
              className={
                AVAILABILITY_STATUS_COLORS[candidate.availabilityStatus] ??
                "bg-neutral-100 text-neutral-500"
              }
            >
              {candidate.availabilityStatus}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            <Link
              href={`/contacts/${candidate.contact.id}`}
              className="font-medium text-blue-600 hover:underline"
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
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">
            Profile
          </h2>
          <form action={updateProfileWithId} className="space-y-5">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Pay &amp; Availability
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Agreed pay rate" htmlFor="agreedPay">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-neutral-400">
                      $
                    </span>
                    <Input
                      id="agreedPay"
                      name="agreedPay"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={candidate.agreedPay ?? ""}
                      className="pl-6"
                    />
                  </div>
                </FormField>
                <FormField label="Pay unit" htmlFor="payUnit">
                  <Select
                    id="payUnit"
                    name="payUnit"
                    defaultValue={candidate.payUnit}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="flat">Flat</option>
                  </Select>
                </FormField>
                <FormField label="Education" htmlFor="education">
                  <Select
                    id="education"
                    name="education"
                    defaultValue={candidate.education ?? ""}
                  >
                    <option value="">Select...</option>
                    {EDUCATION_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Available from" htmlFor="availableFrom">
                  <Input
                    id="availableFrom"
                    name="availableFrom"
                    type="date"
                    defaultValue={
                      candidate.availableFrom
                        ? candidate.availableFrom.toISOString().slice(0, 10)
                        : ""
                    }
                  />
                </FormField>
              </div>
              <div className="mt-3">
                <FormField label="Availability note" htmlFor="availabilityNote">
                  <Input
                    id="availabilityNote"
                    name="availabilityNote"
                    placeholder="e.g. Mornings only, needs 3 days notice"
                    defaultValue={candidate.availabilityNote ?? ""}
                  />
                </FormField>
              </div>
              <div className="mt-3">
                <FormField label="Availability status" htmlFor="availabilityStatus">
                  <Select
                    id="availabilityStatus"
                    name="availabilityStatus"
                    defaultValue={candidate.availabilityStatus}
                  >
                    {AVAILABILITY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Location
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="City" htmlFor="city">
                  <Input id="city" name="city" defaultValue={candidate.city ?? ""} />
                </FormField>
                <FormField label="State" htmlFor="state">
                  <Input id="state" name="state" defaultValue={candidate.state ?? ""} />
                </FormField>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Skills &amp; Resume
              </h3>
              <div className="space-y-3">
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
                    rows={5}
                    defaultValue={candidate.resumeNotes ?? ""}
                  />
                </FormField>
              </div>
            </div>

            <Button type="submit" variant="secondary">
              Save profile
            </Button>
          </form>

          <div className="mt-6 border-t border-neutral-200 pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Resume
            </h3>
            <ResumeUpload
              uploadAction={uploadResumeWithId}
              removeAction={removeResumeWithId}
              resume={
                candidate.resumeFilename
                  ? { filename: candidate.resumeFilename, sizeBytes: 0 }
                  : null
              }
              downloadHref={`/api/candidates/${candidate.id}/resume`}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">
            Job Matches
          </h2>

          {availableJobs.length > 0 && (
            <form
              action={proposeMatchWithId}
              className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 p-3"
            >
              <select
                name="jobId"
                required
                className="min-w-[220px] flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Match to a job...</option>
                {availableJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.client.name} &middot; {job.title}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary">
                Propose Match
              </Button>
            </form>
          )}

          {candidate.matches.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400">
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
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2.5 transition-colors hover:bg-neutral-50"
                  >
                    <div>
                      <Link
                        href={`/jobs/${match.job.id}`}
                        className="text-sm font-medium text-neutral-700 hover:text-blue-600"
                      >
                        {match.job.client.name}
                      </Link>
                      <p className="text-xs text-neutral-400">
                        {match.job.title}
                        {match.agreedPayRate != null &&
                          ` · $${match.agreedPayRate.toFixed(2)}/hr agreed`}
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
                        options={MATCH_STATUSES.map((s) => ({
                          value: s,
                          label: MATCH_STATUS_LABELS[s],
                        }))}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <UpcomingMeetingsCard
          userId={user.id}
          contactEmail={candidate.contact.email}
        />
      </div>
    </div>
  );
}
