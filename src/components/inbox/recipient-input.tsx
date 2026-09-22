"use client";

import { useEffect, useRef, useState } from "react";

type ContactResult = {
  id: string;
  name: string;
  email: string | null;
};

/** A To/Cc/Bcc field with CRM contact autocomplete. Comma-separated addresses. */
export function RecipientInput({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<ContactResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const currentSegment = value.split(",").pop()?.trim() ?? "";

  useEffect(() => {
    if (!currentSegment) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(currentSegment)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setSuggestions((data.results ?? []).filter((r: ContactResult) => r.email)))
        .catch(() => undefined);
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [currentSegment]);

  function pick(contact: ContactResult) {
    const parts = value.split(",");
    parts[parts.length - 1] = ` ${contact.name} <${contact.email}>`;
    setValue(parts.join(",").replace(/^,\s*/, "").trim() + ", ");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
      <label className="w-10 shrink-0 text-xs font-medium text-neutral-400">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full text-sm outline-none placeholder:text-neutral-400"
      />
      {open && currentSegment && suggestions.length > 0 && (
        <div className="absolute left-10 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {suggestions.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => pick(contact)}
              className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-neutral-50"
            >
              <span className="text-sm text-neutral-900">{contact.name}</span>
              <span className="text-xs text-neutral-400">{contact.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
