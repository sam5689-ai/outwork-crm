"use client";

import { useState } from "react";
import { Users, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { QuickMatchDrawer } from "./quick-match-drawer";
import { duplicateJob } from "@/app/(dashboard)/clients/actions";

export function JobDetailActions({
  jobId,
  defaultOpeningsCount,
}: {
  jobId: string;
  defaultOpeningsCount: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const duplicateJobWithId = duplicateJob.bind(null, jobId);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={() => setDrawerOpen(true)}>
          <Users className="h-4 w-4" />
          Quick-Match Candidate
        </Button>
        {duplicating ? (
          <form
            action={duplicateJobWithId}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2 py-1"
          >
            <span className="text-xs text-neutral-500">Openings:</span>
            <Input
              name="openingsCount"
              type="number"
              min="1"
              defaultValue={defaultOpeningsCount}
              className="w-16 py-1"
            />
            <Button type="submit" className="px-2.5 py-1 text-xs">
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="px-2.5 py-1 text-xs"
              onClick={() => setDuplicating(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setDuplicating(true)}>
            <Copy className="h-4 w-4" />
            Duplicate / Re-Open Job
          </Button>
        )}
      </div>

      {drawerOpen && (
        <QuickMatchDrawer jobId={jobId} onClose={() => setDrawerOpen(false)} />
      )}
    </>
  );
}
