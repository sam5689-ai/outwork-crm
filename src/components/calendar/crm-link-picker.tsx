"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SearchResult = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  isClient: boolean;
  isCandidate: boolean;
  clientId: string | null;
  candidateId: string | null;
};

export type PickedCrmLink = {
  type: "contact" | "client" | "candidate";
  id: string;
  label: string;
} | null;

/** Single-select search for linking a calendar event to a Contact, Client or Candidate. */
export function CrmLinkPicker({
  value,
  onChange,
}: {
  value: PickedCrmLink;
  onChange: (link: PickedCrmLink) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .catch(() => undefined);
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-blue-50 text-blue-700">
          {value.type === "client" ? "Client" : value.type === "candidate" ? "Candidate" : "Contact"}
        </Badge>
        <span className="text-sm text-neutral-700">{value.label}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove link"
          className="text-neutral-400 hover:text-neutral-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search contacts, clients, candidates..."
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {open && query.trim() && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {results.map((result) => (
            <div key={result.id}>
              <button
                type="button"
                onClick={() => {
                  onChange({ type: "contact", id: result.id, label: result.name });
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-neutral-50"
              >
                <span className="text-neutral-900">{result.name}</span>
                <span className="text-xs text-neutral-400">Contact</span>
              </button>
              {result.isClient && result.clientId && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      type: "client",
                      id: result.clientId!,
                      label: result.company ?? result.name,
                    });
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-1.5 pl-6 text-left text-sm hover:bg-neutral-50"
                >
                  <span className="text-neutral-700">
                    {result.company ?? result.name}
                  </span>
                  <span className="text-xs text-neutral-400">Client</span>
                </button>
              )}
              {result.isCandidate && result.candidateId && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      type: "candidate",
                      id: result.candidateId!,
                      label: result.name,
                    });
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-1.5 pl-6 text-left text-sm hover:bg-neutral-50"
                >
                  <span className="text-neutral-700">{result.name}</span>
                  <span className="text-xs text-neutral-400">Candidate</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
