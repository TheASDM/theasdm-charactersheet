export const ALLOWED_SOURCES = new Set<string>(["XPHB", "XDMG", "SRD"]);

const HOMEBREW_PREFIX = "homebrew:";

export function normalizeSource(source: string | undefined): string {
  if (!source) {
    return "";
  }
  const trimmed = source.trim();
  if (trimmed.toLowerCase().startsWith(HOMEBREW_PREFIX)) {
    const suffix = trimmed.slice(HOMEBREW_PREFIX.length).trim().toLowerCase();
    return `${HOMEBREW_PREFIX}${suffix}`;
  }
  return trimmed.toUpperCase();
}

export function isSourceAllowed(source: string | undefined): boolean {
  if (!source) {
    return false;
  }
  const normalized = normalizeSource(source);
  if (normalized.startsWith(HOMEBREW_PREFIX.toUpperCase())) {
    return true;
  }
  return ALLOWED_SOURCES.has(normalized);
}

export function ensureAllowedSource(source: string | undefined): string {
  if (!isSourceAllowed(source)) {
    throw new Error(`Source "${source ?? ""}" is not in the approved whitelist`);
  }
  return normalizeSource(source);
}
