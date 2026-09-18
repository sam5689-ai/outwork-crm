"use client";

import { useRef, useTransition } from "react";

export function StageSelect({
  action,
  name,
  defaultValue,
  options,
}: {
  action: (formData: FormData) => Promise<void>;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(() => action(formData))}
    >
      <select
        key={defaultValue}
        name={name}
        defaultValue={defaultValue}
        disabled={isPending}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}
