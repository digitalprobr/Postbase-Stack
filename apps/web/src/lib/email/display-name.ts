const FALLBACK_NAME = "there";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** HTML-safe name for `{{name}}` in email templates; "there" when the user has none. */
export function emailDisplayName(name: string | null | undefined): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return escapeHtml(trimmed || FALLBACK_NAME);
}
