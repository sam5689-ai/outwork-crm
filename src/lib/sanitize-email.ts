import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags.concat([
  "img",
  "style",
  "span",
  "font",
  "center",
  "u",
  "s",
  "small",
  "sub",
  "sup",
  "colgroup",
  "col",
  "tfoot",
]);

/**
 * Sanitizes Gmail HTML message bodies for display. Rendered inside a
 * script-less sandboxed iframe as a second layer of defense, but this
 * strips scripts/handlers/unsafe schemes at the source so the markup is
 * also safe on its own.
 */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    // <style> content isn't script-executable and this markup is only ever
    // rendered inside a sandboxed iframe with scripts disabled.
    allowVulnerableTags: true,
    allowedAttributes: {
      "*": [
        "style",
        "class",
        "align",
        "width",
        "height",
        "colspan",
        "rowspan",
        "valign",
        "bgcolor",
        "border",
        "cellpadding",
        "cellspacing",
      ],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      font: ["face", "color", "size"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  });
}
