import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StageSelect } from "@/components/ui/stage-select";
import { CANDIDATE_STAGES, CANDIDATE_STAGE_LABELS } from "@/lib/stages";
import { updateCandidateStage } from "./actions";

export default async function CandidatesPage() {
  const candidates = await prisma.candidate.findMany({
    include: { contact: true, matches: true },
    orderBy: { updatedAt: "desc" },
  });

  const columns = CANDIDATE_STAGES.map((stage) => ({
    stage,
    candidates: candidates.filter((candidate) => candidate.stage === stage),
  }));

  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Track candidates from sourcing through to acceptance"
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(({ stage, candidates: stageCandidates }) => (
          <div key={stage} className="w-72 shrink-0">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {CANDIDATE_STAGE_LABELS[stage]}
              </h2>
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-500">
                {stageCandidates.length}
              </span>
            </div>
            <div className="space-y-3">
              {stageCandidates.map((candidate) => {
                const updateStageWithId = updateCandidateStage.bind(
                  null,
                  candidate.id
                );
                return (
                  <div
                    key={candidate.id}
                    className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300"
                  >
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="font-semibold text-neutral-900 hover:text-blue-600"
                    >
                      {candidate.contact.firstName} {candidate.contact.lastName}
                    </Link>
                    {candidate.skills && (
                      <p className="mt-1 truncate text-xs text-neutral-400">
                        {candidate.skills}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-400">
                      {candidate.matches.length} match
                      {candidate.matches.length === 1 ? "" : "es"}
                    </p>
                    <div className="mt-3">
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
                  </div>
                );
              })}
              {stageCandidates.length === 0 && (
                <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-400">
                  No candidates {CANDIDATE_STAGE_LABELS[stage].toLowerCase()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {candidates.length === 0 && (
        <p className="mt-6 text-sm text-neutral-400">
          No candidates yet. Convert a contact into a candidate to get
          started, or{" "}
          <Link href="/contacts/new" className="text-blue-600 hover:underline">
            add a new contact
          </Link>
          .
        </p>
      )}
    </div>
  );
}
