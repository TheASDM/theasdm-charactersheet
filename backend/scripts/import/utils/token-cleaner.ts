const TOKEN_PATTERNS: Array<[RegExp, string]> = [
  [/\{@damage ([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@dice ([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@spell ([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@item ([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@feat ([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@class ([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@condition ([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@creature ([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@link ([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@[a-z0-9_]+\|([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@[a-z0-9_]+ ([^|}]+)(?:\|[^}]*)?\}/gi, "$1"],
  [/\{@[^}]+\}/g, ""],
];

export function strip5eTokens(input: string | null | undefined): string {
  if (!input) {
    return "";
  }
  let result = input;
  for (const [pattern, replacement] of TOKEN_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

export function strip5eTokensFromArray(values: unknown): string {
  if (!values) {
    return "";
  }
  if (Array.isArray(values)) {
    return values
      .map((entry) =>
        typeof entry === "string"
          ? strip5eTokens(entry)
          : strip5eTokens(JSON.stringify(entry)),
      )
      .filter(Boolean)
      .join("\n");
  }
  if (typeof values === "string") {
    return strip5eTokens(values);
  }
  return strip5eTokens(JSON.stringify(values));
}
