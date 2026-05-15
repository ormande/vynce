export function buildMatchSnippet(
  text: string,
  query: string,
  fieldLabel: string,
): string {
  const normalized = text.trim();
  if (!normalized) {
    return fieldLabel;
  }

  const q = query.trim();
  if (!q) {
    return `${fieldLabel}: ${normalized.slice(0, 72)}`;
  }

  const lower = normalized.toLowerCase();
  const needle = q.toLowerCase();
  const index = lower.indexOf(needle);

  if (index === -1) {
    return `${fieldLabel}: ${normalized.slice(0, 72)}${normalized.length > 72 ? "…" : ""}`;
  }

  const start = Math.max(0, index - 24);
  const end = Math.min(normalized.length, index + needle.length + 36);
  let excerpt = normalized.slice(start, end);

  if (start > 0) excerpt = `…${excerpt}`;
  if (end < normalized.length) excerpt = `${excerpt}…`;

  return `${fieldLabel}: ${excerpt}`;
}
