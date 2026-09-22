"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { quickMatchCandidate } from "@/app/(dashboard)/jobs/actions";

type CandidateResult = {
  id: string;
  name: string;
  skills: string | null;
  agreedPay: number | null;
  payUnit: string;
  availabilityStatus: string;
  availableFrom: string | null;
};

export function QuickMatchDrawer({
  jobId,
  onClose,
}: {
  jobId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoading(true);
      fetch(
        `/api/candidates/search?jobId=${encodeURIComponent(jobId)}&q=${encodeURIComponent(query.trim())}`,
        { signal: controller.signal }
      )
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .catch((err) => {
          if (err.name !== "AbortError") setResults([]);
        })
        .finally(() => setLoading(false));
    }, 200);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [jobId, query]);

  async function handleAdd(candidateId: string) {
    setAddingId(candidateId);
    const formData = new FormData();
    formData.set("candidateId", candidateId);
    try {
      await quickMatchCandidate(jobId, formData);
      setResults((prev) => prev.filter((c) => c.id !== candidateId));
      router.refresh();
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-900/20">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink">
            Quick-Match Candidate
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, skills, or start date..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              Searching...
            </p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              No matching candidates.
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((candidate) => (
                <li
                  key={candidate.id}
                  className="rounded-lg border border-neutral-200 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {candidate.name}
                    </p>
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                      {candidate.availabilityStatus}
                    </span>
                  </div>
                  {candidate.skills && (
                    <p className="mt-0.5 truncate text-xs text-neutral-400">
                      {candidate.skills}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-neutral-500">
                      {candidate.agreedPay != null
                        ? `$${candidate.agreedPay.toFixed(2)}/${candidate.payUnit}`
                        : "No pay rate set"}
                      {candidate.availableFrom &&
                        ` · Available ${new Date(candidate.availableFrom).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                      disabled={addingId === candidate.id}
                      onClick={() => handleAdd(candidate.id)}
                    >
                      {addingId === candidate.id ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
