"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Underline, Link2, List } from "lucide-react";

function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()} // keep selection focused for execCommand
      onClick={onClick}
      className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
    >
      {children}
    </button>
  );
}

/**
 * A small contentEditable rich-text composer with basic formatting
 * (bold/italic/underline/link/list). Mirrors its HTML into the hidden
 * `name` input on every change so it submits as part of the enclosing form.
 */
export function RichTextEditor({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue ?? "");
  const [isEmpty, setIsEmpty] = useState(!defaultValue);

  function sync() {
    const content = editorRef.current?.innerHTML ?? "";
    setHtml(content);
    setIsEmpty(editorRef.current?.textContent?.trim().length === 0);
  }

  function exec(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function insertLink() {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
  }

  return (
    <div className="rounded-lg border border-neutral-200">
      <div className="flex items-center gap-0.5 border-b border-neutral-100 px-2 py-1">
        <ToolbarButton label="Bold" onClick={() => exec("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec("underline")}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Bulleted list" onClick={() => exec("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Insert link" onClick={insertLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-neutral-400">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          className="min-h-[160px] max-h-[320px] overflow-y-auto px-3 py-2.5 text-sm text-neutral-900 outline-none"
          dangerouslySetInnerHTML={
            defaultValue ? { __html: defaultValue } : undefined
          }
        />
      </div>
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}
