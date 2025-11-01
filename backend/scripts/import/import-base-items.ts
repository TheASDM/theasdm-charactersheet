#!/usr/bin/env ts-node
import path from "path";
import { Prisma, PrismaClient, RawContentKind } from "@prisma/client";

import { loadJsonFile } from "./utils/file-utils";
import { flattenEntries } from "./utils/jsonb-flattener";
import { strip5eTokens } from "./utils/token-cleaner";
import { ensureAllowedSource } from "./utils/source-filter";
import { slugify } from "./utils/slugify";

interface ItemFile {
  baseitem: ItemRecord[];
}

interface ItemRecord {
  name: string;
  source: string;
  type?: string;
  typeAlt?: string;
  rarity?: string;
  category?: string;
  entries?: unknown;
  entriesFluff?: unknown;
  value?: number;
  valueMult?: number;
  valueUnit?: string;
  cost?: unknown;
  weight?: number;
  recharge?: string;
  charges?: number;
  reqAttune?: boolean | string;
  weaponCategory?: string;
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;
  range?: unknown;
  property?: string[];
  ac?: number;
  acBonus?: number;
}

const DEFAULT_ITEMS_PATH = process.env.FIVETOOLS_ITEMS_PATH ?? path.join(process.cwd(), "../5etools/items-base.json");

const prisma = new PrismaClient();
const VALID_DAMAGE_TYPES = new Set([
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
]);

function parseItemCost(item: ItemRecord): { value: number | null; unit: string | null } {
  if (typeof item.value === "number" && item.valueUnit) {
    const multiplier = typeof item.valueMult === "number" ? item.valueMult : 1;
    return { value: Math.round(item.value * multiplier), unit: item.valueUnit.toLowerCase() };
  }

  const cost = item.cost as any;
  if (!cost) {
    return { value: null, unit: null };
  }

  if (typeof cost === "object") {
    const currencies = ["cp", "sp", "ep", "gp", "pp"] as const;
    let totalCopper = 0;
    let dominant: string | null = null;

    for (const currency of currencies) {
      const amount = cost?.[currency];
      if (typeof amount !== "number" || amount <= 0) {
        continue;
      }
      dominant = currency;
      switch (currency) {
        case "cp":
          totalCopper += amount;
          break;
        case "sp":
          totalCopper += amount * 10;
          break;
        case "ep":
          totalCopper += amount * 50;
          break;
        case "gp":
          totalCopper += amount * 100;
          break;
        case "pp":
          totalCopper += amount * 1000;
          break;
        default:
          break;
      }
    }

    return {
      value: totalCopper || null,
      unit: dominant ?? null,
    };
  }

  if (typeof cost === "string") {
    const match = cost.match(/(\d+(?:,\d+)*)\s*(gp|sp|cp|pp|ep)/i);
    if (match && match[1] && match[2]) {
      const amount = Number(match[1].replace(/,/g, ""));
      const currency = match[2].toLowerCase();
      return { value: amount, unit: currency };
    }
  }

  return { value: null, unit: null };
}

function formatRange(range: unknown): string {
  if (!range) {
    return "";
  }
  if (typeof range === "string") {
    return strip5eTokens(range);
  }
  if (Array.isArray(range)) {
    return range.map((entry) => strip5eTokens(String(entry))).join(", ");
  }
  if (typeof range === "object") {
    const data = range as Record<string, unknown>;
    if (typeof data.text === "string") {
      return strip5eTokens(data.text);
    }
    if (typeof data.normal === "number") {
      const parts: (string | number)[] = [data.normal];
      if (typeof data.long === "number") {
        parts.push(`/ ${data.long}`);
      }
      return parts.join(" ");
    }
  }
  return strip5eTokens(JSON.stringify(range));
}

function collectProperties(item: ItemRecord): string[] {
  const properties = new Set<string>();
  (item.property ?? []).forEach((prop) => {
    if (typeof prop === 'string') {
      properties.add(strip5eTokens(prop));
    } else {
      properties.add(String(prop));
    }
  });
  if (item.weaponCategory) {
    properties.add(strip5eTokens(item.weaponCategory));
  }
  if (item.range) {
    properties.add(formatRange(item.range));
  }
  return Array.from(properties).filter(Boolean);
}

function requiresAttunement(item: ItemRecord): boolean {
  if (typeof item.reqAttune === "boolean") {
    return item.reqAttune;
  }
  if (typeof item.reqAttune === "string") {
    return true;
  }
  return false;
}

async function importItems(): Promise<void> {
  const itemFile = loadJsonFile<ItemFile>(DEFAULT_ITEMS_PATH);
  const items = itemFile.baseitem ?? [];
  if (!items.length) {
    throw new Error(`No base items found in ${DEFAULT_ITEMS_PATH}`);
  }

  console.log(`📦 Found ${items.length} base items to import`);

  // Only import XPHB and XDMG (D&D 2024) base items
  const filtered = items.filter((item) => item.source === 'XPHB' || item.source === 'XDMG');
  console.log(`✅ Filtered to ${filtered.length} XPHB/XDMG 2024 base items`);

  await prisma.$transaction(async (tx) => {
    console.log('⚠️  NOTE: Not deleting existing items - base items will be added to existing items');
    // Don't delete existing items - we're adding to them
    // await tx.canonItem.deleteMany();
    // await tx.rawContent.deleteMany({ where: { kind: RawContentKind.item } });

    for (const item of filtered) {
      const normalizedSource = ensureAllowedSource(item.source);
      const slug = slugify(item.name);

      const rawRecord = await tx.rawContent.create({
        data: {
          kind: RawContentKind.item,
          slug,
          source: normalizedSource,
          title: item.name,
          raw: item as unknown as object,
          isHomebrew: normalizedSource.startsWith("homebrew:"),
        },
      });

      const { value, unit } = parseItemCost(item);
      const rawDamageType = item.dmgType ? item.dmgType.toLowerCase() : null;
      const damageTypeSlug = rawDamageType && VALID_DAMAGE_TYPES.has(rawDamageType) ? rawDamageType : null;

      await tx.canonItem.create({
        data: {
          rawContentId: rawRecord.id,
          slug,
          name: item.name,
          itemType: item.type ?? item.typeAlt ?? null,
          category: item.category ?? null,
          rarity: item.rarity ?? null,
          source: normalizedSource,
          costValue: value,
          costUnit: unit,
          weight: item.weight != null ? new Prisma.Decimal(item.weight) : null,
          requiresAttunement: requiresAttunement(item),
          attunementText: typeof item.reqAttune === "string" ? strip5eTokens(item.reqAttune) : null,
          weaponCategory: item.weaponCategory ?? null,
          damageDice: item.dmg2 ?? item.dmg1 ?? null,
          damageTypeSlug,
          itemRange: formatRange(item.range),
          armorClass: item.ac ?? null,
          acBonus: item.acBonus ?? null,
          properties: collectProperties(item),
          description: flattenEntries(item.entries ?? item.entriesFluff ?? []),
        },
      });
    }
  });

  console.log(`✅ Imported ${filtered.length} items`);
}

export async function run(): Promise<void> {
  try {
    await importItems();
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void run().catch((error) => {
    console.error("❌ Item import failed", error);
    process.exit(1);
  });
}
