import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { CandidateForm } from "@/components/candidates/candidate-form";
import { createCandidate } from "../actions";

export default function NewCandidatePage() {
  return (
    <div>
      <PageHeader
        title="New Candidate"
        description="Add a candidate directly, without creating a separate contact first"
      />
      <Card className="max-w-2xl">
        <CandidateForm action={createCandidate} cancelHref="/candidates" />
      </Card>
    </div>
  );
}
