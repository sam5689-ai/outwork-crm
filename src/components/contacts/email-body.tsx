"use client";

import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import type { EmailAttachment } from "@/lib/gmail";

const IFRAME_STYLES = `
  body {
    margin: 0;
    padding: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    color: #374151;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  img { max-width: 100%; height: auto; }
  a { color: #2563eb; }
  table { max-width: 100%; }
`;

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

export function EmailBody({
  html,
  text,
  attachments,
  messageId,
}: {
  html: string | null;
  text: string | null;
  attachments: unknown;
  messageId: string | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(60);

  const attachmentList = Array.isArray(attachments)
    ? (attachments as EmailAttachment[])
    : [];
  const downloadable = attachmentList.filter((a) => !a.inline);

  return (
    <div className="mt-2">
      {html ? (
        <iframe
          ref={iframeRef}
          title="Email content"
          srcDoc={`<!doctype html><html><head><base target="_blank"><meta name="color-scheme" content="light"><style>${IFRAME_STYLES}</style></head><body>${html}</body></html>`}
          sandbox="allow-same-origin allow-popups"
          onLoad={() => {
            const body = iframeRef.current?.contentWindow?.document?.body;
            if (!body) return;
            const update = () => setHeight(body.scrollHeight + 24);
            update();
            // Re-measure as images/fonts finish loading and shift layout,
            // since the initial load event can fire before that settles.
            new ResizeObserver(update).observe(body);
          }}
          className="w-full rounded-lg border border-neutral-100 bg-white"
          style={{ height }}
        />
      ) : text ? (
        <p className="whitespace-pre-wrap rounded-lg border border-neutral-100 bg-white p-3 text-sm text-neutral-600">
          {text}
        </p>
      ) : (
        <p className="text-xs text-neutral-400">No content available.</p>
      )}

      {downloadable.length > 0 && messageId && (
        <div className="mt-2 flex flex-wrap gap-2">
          {downloadable.map((att) => (
            <a
              key={att.attachmentId}
              href={`/api/gmail/attachments/${messageId}/${att.attachmentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              <Paperclip className="h-3.5 w-3.5 text-neutral-400" />
              {att.filename}
              {att.size > 0 && (
                <span className="text-neutral-400">
                  ({formatBytes(att.size)})
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
