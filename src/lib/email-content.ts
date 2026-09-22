import type { EmailAttachment } from "@/lib/gmail";

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
