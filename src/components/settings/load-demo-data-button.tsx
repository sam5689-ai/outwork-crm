"use client";

import { useActionState } from "react";
import type { DemoDataState } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";

type LoadDemoDataAction = (
  state: DemoDataState,
  formData: FormData
) => Promise<DemoDataState>;

export function LoadDemoDataButton({
  action,
}: {
  action: LoadDemoDataAction;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction}>
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Adding..." : "Load demo data"}
      </Button>
      {state?.message && (
        <p className="mt-2 text-xs text-neutral-500">{state.message}</p>
      )}
    </form>
  );
}
