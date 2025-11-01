import { strip5eTokens } from "./token-cleaner";

type JsonValue = unknown;

type TimeEntry = {
  number?: number;
  unit?: string;
  condition?: string;
};

type RangeEntry = {
  type?: string;
  distance?: {
    type?: string;
    amount?: number;
    note?: string;
  };
  amount?: number;
  unit?: string;
};

type DurationEntry = {
  type?: string;
  duration?: {
    amount?: number;
    type?: string;
  };
  concentration?: boolean;
};

export function flattenTime(value: JsonValue): string {
  if (!Array.isArray(value)) {
    return "";
  }
  const pieces = (value as TimeEntry[])
    .map((entry) => {
      const parts: string[] = [];
      if (entry.number !== undefined) {
        parts.push(String(entry.number));
      }
      if (entry.unit) {
        parts.push(entry.unit);
      }
      let result = parts.join(" ").trim();
      if (entry.condition) {
        result = `${result} (${strip5eTokens(entry.condition)})`;
      }
      return result.trim();
    })
    .filter(Boolean);
  return pieces.join(", ");
}

export function flattenRange(value: JsonValue): string {
  if (!value || typeof value !== "object") {
    return strip5eTokens(String(value ?? ""));
  }
  const range = value as RangeEntry;
  switch (range.type) {
    case "self":
      return "Self";
    case "point": {
      const distance = range.distance ?? {};
      const parts: string[] = [];
      if (distance.amount !== undefined) {
        parts.push(String(distance.amount));
      }
      if (distance.type) {
        parts.push(distance.type);
      }
      if (distance.note) {
        parts.push(strip5eTokens(distance.note));
      }
      return parts.join(" ").trim();
    }
    case "radius": {
      const distance = range.distance ?? {};
      const amount = distance.amount ?? range.amount;
      const unit = distance.type ?? range.unit;
      return `${amount ?? ""} ${unit ?? ""}`.trim() + " radius";
    }
    case "cube":
    case "sphere":
    case "line": {
      const amount = range.amount ?? range.distance?.amount;
      const unit = range.unit ?? range.distance?.type;
      return `${amount ?? ""} ${unit ?? ""} ${range.type}`.trim();
    }
    default:
      return strip5eTokens(JSON.stringify(value));
  }
}

export function flattenDuration(value: JsonValue): string {
  if (!Array.isArray(value)) {
    return strip5eTokens(String(value ?? ""));
  }
  const durations = (value as DurationEntry[])
    .map((entry) => {
      if (!entry.type) {
        return "";
      }
      if (entry.type === "instant") {
        return "Instantaneous";
      }
      if (entry.type === "timed") {
        const amount = entry.duration?.amount;
        const unit = entry.duration?.type;
        const base = [amount, unit].filter(Boolean).join(" ");
        if (entry.concentration) {
          return `${base} (Concentration)`;
        }
        return base;
      }
      if (entry.type === "permanent") {
        return "Permanent";
      }
      if (entry.type === "special") {
        return "Special";
      }
      return strip5eTokens(JSON.stringify(entry));
    })
    .filter(Boolean);
  return durations.join(", ");
}

export function flattenEntries(value: JsonValue): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return strip5eTokens(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => flattenEntries(entry))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, JsonValue>;
    if (Array.isArray(obj.entries)) {
      return flattenEntries(obj.entries);
    }
    if (typeof obj.name === "string" && Array.isArray(obj.entries)) {
      const name = strip5eTokens(obj.name);
      const body = flattenEntries(obj.entries);
      return [name, body].filter(Boolean).join("\n");
    }
    if (typeof obj.text === "string") {
      return strip5eTokens(obj.text);
    }
    const serialized = strip5eTokens(JSON.stringify(value));
    return serialized;
  }

  return strip5eTokens(String(value));
}

export function flattenStringArray(value: JsonValue): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        typeof entry === "string"
          ? strip5eTokens(entry)
          : strip5eTokens(JSON.stringify(entry)),
      )
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return [strip5eTokens(value)].filter(Boolean);
  }
  return [strip5eTokens(JSON.stringify(value))].filter(Boolean);
}
