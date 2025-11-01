#!/usr/bin/env ts-node
import path from "path";
import { PrismaClient, RawContentKind } from "@prisma/client";

import { loadJsonFile } from "./utils/file-utils";
import { flattenDuration, flattenEntries, flattenRange, flattenTime } from "./utils/jsonb-flattener";
import { strip5eTokens } from "./utils/token-cleaner";
import { ensureAllowedSource } from "./utils/source-filter";
import { slugify } from "./utils/slugify";

interface SpellFile {
  spell: SpellRecord[];
}

interface SpellRecord {
  name: string;
  source: string;
  level?: number;
  school?: string;
  time?: unknown;
  range?: unknown;
  components?: { v?: boolean; s?: boolean; m?: string };
  duration?: unknown;
  entries?: unknown;
  entriesHigherLevel?: unknown;
  damageInflict?: string[];
  conditionInflict?: string[];
  savingThrow?: string[];
  classes?: {
    fromClassList?: Array<{ name: string }>;
    fromClassListVariant?: Array<{ name: string }>;
    fromSubclass?: Array<{ class?: { name?: string } }>;
  };
  meta?: { ritual?: boolean; concentration?: boolean };
  ritual?: boolean;
}

const DEFAULT_SPELLS_PATH = process.env.FIVETOOLS_SPELLS_PATH ?? path.join(process.cwd(), "data", "spells.json");
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
const VALID_CONDITIONS = new Set([
  "blinded",
  "charmed",
  "deafened",
  "exhaustion",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
]);

const ABILITY_MAP: Record<string, string> = {
  STR: "strength",
  DEX: "dexterity",
  CON: "constitution",
  INT: "intelligence",
  WIS: "wisdom",
  CHA: "charisma",
};

const prisma = new PrismaClient();

function extractClassNames(spell: SpellRecord): string[] {
  const names = new Set<string>();
  const addName = (value?: string) => {
    if (value) {
      names.add(value);
    }
  };

  spell.classes?.fromClassList?.forEach((entry) => addName(entry.name));
  spell.classes?.fromClassListVariant?.forEach((entry) => addName(entry.name));
  spell.classes?.fromSubclass?.forEach((entry) => {
    if (entry.class?.name) {
      addName(entry.class.name);
    }
  });

  return Array.from(names).sort();
}

function extractSavingThrows(spell: SpellRecord): string[] {
  if (!Array.isArray(spell.savingThrow)) {
    return [];
  }
  return spell.savingThrow
    .map((code) => ABILITY_MAP[code.toUpperCase()] ?? strip5eTokens(code))
    .filter(Boolean)
    .map((value) => value.toLowerCase());
}

function spellIsConcentration(spell: SpellRecord): boolean {
  if (spell.meta?.concentration) {
    return true;
  }
  if (!Array.isArray(spell.duration)) {
    return false;
  }
  return spell.duration.some((entry: any) => Boolean(entry?.concentration));
}

async function importSpells(): Promise<void> {
  const spellFile = loadJsonFile<SpellFile>(DEFAULT_SPELLS_PATH);
  const spells = spellFile.spell ?? [];

  if (!spells.length) {
    throw new Error(`No spells found in ${DEFAULT_SPELLS_PATH}`);
  }

  const filteredSpells = spells.filter((spell) => ensureAllowedSource(spell.source));

  await prisma.$transaction(async (tx) => {
    await tx.canonSpellCondition.deleteMany();
    await tx.canonSpellDamageType.deleteMany();
    await tx.canonSpellClass.deleteMany();
    await tx.canonSpell.deleteMany();
    await tx.rawContent.deleteMany({ where: { kind: RawContentKind.spell } });

    for (const spell of filteredSpells) {
      const normalizedSource = ensureAllowedSource(spell.source);
      const slug = slugify(spell.name);
      const rawContent = await tx.rawContent.create({
        data: {
          kind: RawContentKind.spell,
          slug,
          source: normalizedSource,
          title: spell.name,
          raw: spell as unknown as object,
          isHomebrew: normalizedSource.startsWith("homebrew:"),
        },
      });

      const damageSlugs = (spell.damageInflict ?? [])
        .map((value) => value?.toLowerCase?.() ?? "")
        .filter((value) => VALID_DAMAGE_TYPES.has(value));

      const conditionSlugs = (spell.conditionInflict ?? [])
        .map((value) => value?.toLowerCase?.() ?? "")
        .filter((value) => VALID_CONDITIONS.has(value));

      await tx.canonSpell.create({
        data: {
          rawContentId: rawContent.id,
          slug,
          name: spell.name,
          level: spell.level ?? 0,
          schoolCode: spell.school ?? null,
          castingTime: flattenTime(spell.time),
          spellRange: flattenRange(spell.range),
          componentsVerbal: Boolean(spell.components?.v),
          componentsSomatic: Boolean(spell.components?.s),
          componentsMaterial: strip5eTokens(spell.components?.m ?? ""),
          duration: flattenDuration(spell.duration),
          description: flattenEntries(spell.entries),
          higherLevel: flattenEntries(spell.entriesHigherLevel),
          ritual: Boolean(spell.ritual ?? spell.meta?.ritual),
          concentration: spellIsConcentration(spell),
          source: normalizedSource,
          classes: extractClassNames(spell),
          savingThrows: extractSavingThrows(spell),
          damage: {
            create: damageSlugs.map((slugValue) => ({
              damageType: { connect: { slug: slugValue } },
            })),
          },
          conditions: {
            create: conditionSlugs.map((slugValue) => ({
              condition: { connect: { slug: slugValue } },
            })),
          },
        },
      });
    }
  });

  console.log(`✅ Imported ${filteredSpells.length} spells into raw.content + canon.spell`);
}

export async function run(): Promise<void> {
  try {
    await importSpells();
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void run().catch((error) => {
    console.error("❌ Spell import failed", error);
    process.exit(1);
  });
}
