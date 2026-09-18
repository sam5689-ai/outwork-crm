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
  INTERESTED: "bg-sky-50 text-sky-600 ring-sky-100",
  CANDIDATE_MATCHED: "bg-amber-50 text-amber-600 ring-amber-100",
  CONTRACT_SIGNED: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  TRIAL_PASSED: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  LOST: "bg-slate-100 text-slate-500 ring-slate-200",
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
  MATCHED: "Matched To Client",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const CANDIDATE_STAGE_COLORS: Record<CandidateStageValue, string> = {
  SOURCED: "bg-slate-100 text-slate-500 ring-slate-200",
  SUITABLE: "bg-sky-50 text-sky-600 ring-sky-100",
  MATCHED: "bg-amber-50 text-amber-600 ring-amber-100",
  ACCEPTED: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  REJECTED: "bg-rose-50 text-rose-600 ring-rose-100",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  ON_HOLD: "On Hold",
  CLOSED: "Closed",
};

export const JOB_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  ON_HOLD: "bg-amber-50 text-amber-600 ring-amber-100",
  CLOSED: "bg-slate-100 text-slate-500 ring-slate-200",
};

export const MATCH_STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Proposed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const MATCH_STATUS_COLORS: Record<string, string> = {
  PROPOSED: "bg-sky-50 text-sky-600 ring-sky-100",
  ACCEPTED: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  REJECTED: "bg-rose-50 text-rose-600 ring-rose-100",
};
