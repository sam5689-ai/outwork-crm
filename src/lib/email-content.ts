import type { EmailAttachment } from "@/lib/gmail";
import { sanitizeEmailHtml } from "@/lib/sanitize-email";

const HTML_TAG_PATTERN =
  /<\s*(div|p|br|img|table|tr|td|a|span|b|i|u|font|center|ul|ol|li|style|blockquote|hr)[\s/>]/i;

/**
 * Some senders (or their signature tools) send a plain-text-only message
 * whose body is actually raw HTML markup, with no proper text/html MIME
 * part at all. Detects that case so we can render it as HTML instead of
 * dumping escaped tags on screen.
 */
export function looksLikeHtml(text: string): boolean {
  return HTML_TAG_PATTERN.test(text);
}

/**
 * Rewrites cid: references in an email's HTML (used for inline images like
 * logos and signature photos) to point at our attachment-proxy route, so
 * the browser can load them without direct Gmail API access. Safe to call
 * on content that's already been resolved - unmatched cids are a no-op.
 */
export function resolveInlineImageUrls(
  html: string,
  messageId: string,
  attachments: EmailAttachment[]
): string {
  let result = html;
  for (const att of attachments) {
    if (!att.contentId) continue;
    const src = `/api/gmail/attachments/${messageId}/${att.attachmentId}`;
    result = result.split(`cid:${att.contentId}`).join(src);
  }
  return result;
}

/**
 * Given a stored EmailMessage row, resolves the sanitized HTML to render:
 * prefers the real HTML body, falls back to promoting HTML-looking plain
 * text (see looksLikeHtml), and rewrites any inline-image cid: references
 * against that message's stored attachments either way. Returns null when
 * there's nothing HTML-like to show, so callers fall back to plain text.
 */
export function resolveEmailHtml(email: {
  bodyHtml: string | null;
  body: string | null;
  gmailMessageId: string | null;
  attachments: unknown;
}): string | null {
  const rawHtml =
    email.bodyHtml ||
    (email.body && looksLikeHtml(email.body) ? email.body : null);
  if (!rawHtml) return null;

  const attachmentList = Array.isArray(email.attachments)
    ? (email.attachments as EmailAttachment[])
    : [];
  const resolved = email.gmailMessageId
    ? resolveInlineImageUrls(rawHtml, email.gmailMessageId, attachmentList)
    : rawHtml;

  return sanitizeEmailHtml(resolved);
}
