export const CLIENT_STAGES = [
  "INTERESTED",
  "CANDIDATE_MATCHED",
  "CONTRACT_SIGNED",
  "TRIAL_PASSED",
  "LOST",
] as const;

export type ClientStageValue = (typeof CLIENT_STAGES)[number];

export const CLIENT_STAGE_LABELS: Record<ClientStageValue, string> = {
  INTERESTED: "Interested",
  CANDIDATE_MATCHED: "Candidate Matched",
  CONTRACT_SIGNED: "Contract Signed",
  TRIAL_PASSED: "Trial Passed",
  LOST: "Lost",
};

export const CLIENT_STAGE_COLORS: Record<ClientStageValue, string> = {
  INTERESTED: "bg-blue-50 text-blue-700",
  CANDIDATE_MATCHED: "bg-amber-50 text-amber-700",
  CONTRACT_SIGNED: "bg-violet-50 text-violet-700",
  TRIAL_PASSED: "bg-emerald-50 text-emerald-700",
  LOST: "bg-neutral-100 text-neutral-500",
};

export const CANDIDATE_STAGES = [
  "SOURCED",
  "SUITABLE",
  "MATCHED",
  "ACCEPTED",
  "REJECTED",
] as const;

export type CandidateStageValue = (typeof CANDIDATE_STAGES)[number];

export const CANDIDATE_STAGE_LABELS: Record<CandidateStageValue, string> = {
  SOURCED: "Sourced",
  SUITABLE: "Suitable For Roles",
  MATCHED: "Matched To Deal",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const CANDIDATE_STAGE_COLORS: Record<CandidateStageValue, string> = {
  SOURCED: "bg-neutral-100 text-neutral-500",
  SUITABLE: "bg-blue-50 text-blue-700",
  MATCHED: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  ON_HOLD: "On Hold",
  CLOSED: "Closed",
};

export const JOB_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700",
  ON_HOLD: "bg-amber-50 text-amber-700",
  CLOSED: "bg-neutral-100 text-neutral-500",
};

export const MATCH_STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Proposed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const MATCH_STATUS_COLORS: Record<string, string> = {
  PROPOSED: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};
