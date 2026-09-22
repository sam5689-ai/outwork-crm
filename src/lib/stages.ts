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
  MATCHED: "Matched To Job",
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

export const JOB_STAGES = [
  "OPEN",
  "MATCHING",
  "CLIENT_REVIEW",
  "SCHEDULED",
  "FILLED_WON",
  "CANCELLED_LOST",
] as const;

export type JobStageValue = (typeof JOB_STAGES)[number];

export const JOB_STAGE_LABELS: Record<JobStageValue, string> = {
  OPEN: "Open",
  MATCHING: "Matching",
  CLIENT_REVIEW: "Client Review",
  SCHEDULED: "Scheduled",
  FILLED_WON: "Filled (Won)",
  CANCELLED_LOST: "Cancelled (Lost)",
};

export const JOB_STAGE_COLORS: Record<JobStageValue, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  MATCHING: "bg-amber-50 text-amber-700",
  CLIENT_REVIEW: "bg-violet-50 text-violet-700",
  SCHEDULED: "bg-indigo-50 text-indigo-700",
  FILLED_WON: "bg-emerald-50 text-emerald-700",
  CANCELLED_LOST: "bg-neutral-100 text-neutral-500",
};

export const MATCH_STATUSES = [
  "SUGGESTED",
  "OUTREACHED",
  "CLIENT_REVIEW",
  "SCHEDULED",
  "PLACED",
  "REJECTED",
] as const;

export type MatchStatusValue = (typeof MATCH_STATUSES)[number];

export const MATCH_STATUS_LABELS: Record<MatchStatusValue, string> = {
  SUGGESTED: "Suggested",
  OUTREACHED: "Outreached",
  CLIENT_REVIEW: "Client Review",
  SCHEDULED: "Scheduled",
  PLACED: "Placed",
  REJECTED: "Rejected",
};

export const MATCH_STATUS_COLORS: Record<MatchStatusValue, string> = {
  SUGGESTED: "bg-neutral-100 text-neutral-500",
  OUTREACHED: "bg-blue-50 text-blue-700",
  CLIENT_REVIEW: "bg-violet-50 text-violet-700",
  SCHEDULED: "bg-indigo-50 text-indigo-700",
  PLACED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

export const AVAILABILITY_STATUSES = ["Available", "Placed", "Inactive"] as const;

export const AVAILABILITY_STATUS_COLORS: Record<string, string> = {
  Available: "bg-emerald-50 text-emerald-700",
  Placed: "bg-blue-50 text-blue-700",
  Inactive: "bg-neutral-100 text-neutral-500",
};

export const EDUCATION_LEVELS = [
  "High School / GED",
  "Trade Cert",
  "Associate's",
  "Bachelor's",
  "Master's+",
] as const;
