export function slugify(input: string, fallback?: string): string {
  const base = input ?? fallback ?? "";
  const normalized = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  const slug = normalized || (fallback ? slugify(fallback) : "");
  if (!slug) {
    throw new Error(`Unable to derive slug from "${input}"`);
  }
  return slug;
}
