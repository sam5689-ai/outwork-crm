"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SearchResult = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  isClient: boolean;
  isCandidate: boolean;
};

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  function openSearch() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closeSearch() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  useEffect(() => {
    if (!open) return;

    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeSearch();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSearch();
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .catch((err) => {
          if (err.name !== "AbortError") setResults([]);
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function goToContact(id: string) {
    router.push(`/contacts/${id}`);
    closeSearch();
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (results.length > 0) {
      goToContact(results[0].id);
    } else if (query.trim()) {
      router.push(`/contacts?q=${encodeURIComponent(query.trim())}`);
      closeSearch();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openSearch}
        aria-label="Search contacts, clients and candidates"
        className="flex h-12 items-center gap-2.5 rounded-full bg-white px-4 text-sm font-medium text-neutral-500 shadow-sm transition hover:text-ink sm:w-72"
      >
        <Search className="h-[18px] w-[18px]" />
        <span className="hidden sm:inline">Search anything</span>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:w-72">
      <form onSubmit={onSubmit}>
        <div className="flex h-12 items-center gap-2.5 rounded-full bg-white px-4 text-sm shadow-sm ring-2 ring-transparent focus-within:ring-blue-200">
          <Search className="h-[18px] w-[18px] shrink-0 text-neutral-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search contacts, clients, candidates..."
            className="w-full text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Close search"
            className="shrink-0 text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </form>

      {query.trim() && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1.5 shadow-lg">
          {loading ? (
            <p className="px-3 py-2.5 text-sm text-neutral-400">
              Searching...
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-neutral-400">
              No matches for &quot;{query}&quot;.
            </p>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => goToContact(result.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-neutral-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-neutral-900">
                    {result.name}
                  </span>
                  <span className="block truncate text-xs text-neutral-400">
                    {result.company || result.email || "No details"}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1">
                  {result.isClient && (
                    <Badge className="bg-violet-50 text-violet-700">
                      Client
                    </Badge>
                  )}
                  {result.isCandidate && (
                    <Badge className="bg-emerald-50 text-emerald-700">
                      Candidate
                    </Badge>
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
