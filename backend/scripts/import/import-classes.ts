#!/usr/bin/env ts-node
import fs from "fs";
import path from "path";
import { PrismaClient, RawContentKind } from "@prisma/client";

import { loadJsonFile } from "./utils/file-utils";
import { flattenEntries } from "./utils/jsonb-flattener";
import { strip5eTokens } from "./utils/token-cleaner";
import { ensureAllowedSource, isSourceAllowed } from "./utils/source-filter";
import { slugify } from "./utils/slugify";

interface ClassFile {
  class?: ClassRecord[];
  classFeature?: ClassFeatureRecord[];
  subclass?: SubclassRecord[];
  subclassFeature?: SubclassFeatureRecord[];
}

interface ClassRecord {
  name: string;
  source: string;
  hd?: { faces?: number };
  primaryAbility?: string[];
  spellcastingAbility?: string;
  subclassTitle?: string;
  startingProficiencies?: {
    armor?: string[];
    weapons?: string[];
    tools?: string[];
  };
  proficiency?: string[];
  classFeatures?: string[][];
  entries?: unknown;
}

interface ClassFeatureRecord {
  name: string;
  source: string;
  className: string;
  classSource: string;
  level: number;
  entries?: unknown;
}

interface SubclassRecord {
  name: string;
  shortName?: string;
  source: string;
  className: string;
  classSource: string;
  subclassFeatures?: string[];
  entries?: unknown;
}

interface SubclassFeatureRecord {
  name: string;
  source: string;
  subclassShortName?: string;
  subclassSource?: string;
  className: string;
  classSource: string;
  level: number;
  entries?: unknown;
}

interface FeatureReference {
  name: string;
  className: string;
  classSource?: string;
  subclassName?: string;
  subclassSource?: string;
  level: number;
}

const prisma = new PrismaClient();
const DEFAULT_CLASSES_DIR = process.env.FIVETOOLS_CLASSES_DIR ?? path.join(process.cwd(), "data", "class");

const ABILITY_MAP: Record<string, string> = {
  STR: "strength",
  DEX: "dexterity",
  CON: "constitution",
  INT: "intelligence",
  WIS: "wisdom",
  CHA: "charisma",
};

function normalizeArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        typeof entry === "string" ? strip5eTokens(entry) : strip5eTokens(JSON.stringify(entry)),
      )
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return [strip5eTokens(value)].filter(Boolean);
  }
  return [strip5eTokens(JSON.stringify(value))].filter(Boolean);
}

function parseFeatureReference(ref: unknown): FeatureReference | null {
  if (typeof ref !== "string") {
    return null;
  }
  const parts = ref.split("|");
  if (parts.length === 4) {
    const [name, className, classSource, levelStr] = parts;
    return {
      name: name!,
      className: className!,
      classSource: classSource!,
      level: Number(levelStr ?? "0") || 0,
    };
  }
  if (parts.length === 6) {
    const [name, className, classSource, subclassName, subclassSource, levelStr] = parts;
    const result: FeatureReference = {
      name: name!,
      className: className!,
      classSource: classSource!,
      level: Number(levelStr ?? "0") || 0,
    };
    if (subclassName) result.subclassName = subclassName;
    if (subclassSource) result.subclassSource = subclassSource;
    return result;
  }
  return null;
}

function buildClassFeatureIndex(records: ClassFeatureRecord[]): Map<string, ClassFeatureRecord> {
  const index = new Map<string, ClassFeatureRecord>();
  for (const record of records) {
    if (!isSourceAllowed(record.source) || !isSourceAllowed(record.classSource)) {
      continue;
    }
    const classSource = ensureAllowedSource(record.classSource);
    const key = `${record.className}|${classSource}|${record.name}|${record.level}`;
    index.set(key, record);
  }
  return index;
}

function buildSubclassFeatureIndex(records: SubclassFeatureRecord[]): Map<string, SubclassFeatureRecord> {
  const index = new Map<string, SubclassFeatureRecord>();
  for (const record of records) {
    if (
      !isSourceAllowed(record.source) ||
      !isSourceAllowed(record.classSource) ||
      !isSourceAllowed(record.subclassSource ?? record.source)
    ) {
      continue;
    }
    const classSource = ensureAllowedSource(record.classSource);
    const subclassSource = ensureAllowedSource(record.subclassSource ?? record.source);
    const subclassKeyName = record.subclassShortName ?? record.name;
    const key = `${record.className}|${classSource}|${subclassKeyName}|${subclassSource}|${record.name}|${record.level}`;
    index.set(key, record);
  }
  return index;
}

async function importClasses(): Promise<void> {
  if (!fs.existsSync(DEFAULT_CLASSES_DIR)) {
    throw new Error(
      `Class directory not found: ${DEFAULT_CLASSES_DIR}\nSet FIVETOOLS_CLASSES_DIR to the 5etools "data/class" directory.`,
    );
  }

  const files = fs.readdirSync(DEFAULT_CLASSES_DIR).filter((file) => file.endsWith(".json"));
  if (!files.length) {
    throw new Error(`No class JSON files found in ${DEFAULT_CLASSES_DIR}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.canonSubclassFeature.deleteMany();
    await tx.canonSubclass.deleteMany();
    await tx.canonClassFeature.deleteMany();
    await tx.canonClass.deleteMany();
    await tx.rawContent.deleteMany({ where: { kind: RawContentKind.class } });

    for (const file of files) {
      const filePath = path.join(DEFAULT_CLASSES_DIR, file);
      const data = loadJsonFile<ClassFile>(filePath);
      const classEntries = data.class ?? [];
      const classFeatureIndex = buildClassFeatureIndex(data.classFeature ?? []);
      const subclassFeatureIndex = buildSubclassFeatureIndex(data.subclassFeature ?? []);

      for (const classEntry of classEntries) {
        if (!isSourceAllowed(classEntry.source)) {
          continue;
        }
        const normalizedSource = ensureAllowedSource(classEntry.source);
        const slug = slugify(classEntry.name);

        const raw = await tx.rawContent.create({
          data: {
            kind: RawContentKind.class,
            slug,
            source: normalizedSource,
            title: classEntry.name,
            raw: classEntry as unknown as object,
            isHomebrew: normalizedSource.startsWith("homebrew:"),
          },
        });

        const classRecord = await tx.canonClass.create({
          data: {
            rawContentId: raw.id,
            slug,
            name: classEntry.name,
            source: normalizedSource,
            hitDie: classEntry.hd?.faces ?? null,
            primaryAbilities: (classEntry.primaryAbility ?? []).map(
              (ability) => ABILITY_MAP[ability.toUpperCase()] ?? ability.toLowerCase(),
            ),
            savingThrows: (classEntry.proficiency ?? []).map((value) => ABILITY_MAP[value.toUpperCase()] ?? value.toLowerCase()),
            armorProficiencies: normalizeArray(classEntry.startingProficiencies?.armor),
            weaponProficiencies: normalizeArray(classEntry.startingProficiencies?.weapons),
            toolProficiencies: normalizeArray(classEntry.startingProficiencies?.tools),
            spellcastingAbility: classEntry.spellcastingAbility ?? null,
            subclassTitle: classEntry.subclassTitle ?? null,
            summary: flattenEntries(classEntry.entries ?? []),
          },
        });

        const featureRefs = (classEntry.classFeatures ?? []).flat();
        for (const reference of featureRefs) {
          const parsed = parseFeatureReference(reference);
          if (!parsed || parsed.subclassName) {
            continue;
          }
          const classSourceKey = parsed.classSource ? ensureAllowedSource(parsed.classSource) : normalizedSource;
          const key = `${classEntry.name}|${classSourceKey}|${parsed.name}|${parsed.level}`;
          const featureData = classFeatureIndex.get(key);
          if (!featureData) {
            continue;
          }

          const featureSlug = slugify(`${slug}-${parsed.level}-${featureData.name}`);
          await tx.canonClassFeature.create({
            data: {
              classId: classRecord.id,
              level: featureData.level ?? parsed.level,
              slug: featureSlug,
              name: featureData.name,
              description: flattenEntries(featureData.entries ?? []),
              source: ensureAllowedSource(featureData.source),
            },
          });
        }

        const subclassEntries = (data.subclass ?? []).filter(
          (entry) => entry.className === classEntry.name && isSourceAllowed(entry.source),
        );

        for (const subclassEntry of subclassEntries) {
          const subclassSource = ensureAllowedSource(subclassEntry.source);
          const subclassSlug = slugify(`${slug}-${subclassEntry.shortName ?? subclassEntry.name}`);
          const subclassRecord = await tx.canonSubclass.create({
            data: {
              classId: classRecord.id,
              slug: subclassSlug,
              name: subclassEntry.name,
              source: subclassSource,
              summary: flattenEntries(subclassEntry.entries ?? []),
            },
          });

          for (const ref of subclassEntry.subclassFeatures ?? []) {
            const parsed = parseFeatureReference(ref);
            if (!parsed) {
              continue;
            }
            const classSourceKey = parsed.classSource ? ensureAllowedSource(parsed.classSource) : normalizedSource;
            const subclassSourceKey = parsed.subclassSource ? ensureAllowedSource(parsed.subclassSource) : subclassSource;
            const key = `${classEntry.name}|${classSourceKey}|${subclassEntry.shortName ?? subclassEntry.name}|${subclassSourceKey}|${parsed.name}|${parsed.level}`;
            const featureData = subclassFeatureIndex.get(key);
            if (!featureData) {
              continue;
            }
            const featureSlug = slugify(`${subclassSlug}-${parsed.level}-${featureData.name}`);
            await tx.canonSubclassFeature.create({
              data: {
                subclassId: subclassRecord.id,
                level: featureData.level ?? parsed.level,
                slug: featureSlug,
                name: featureData.name,
                description: flattenEntries(featureData.entries ?? []),
                source: ensureAllowedSource(featureData.source),
              },
            });
          }
        }
      }
    }

    const classIndex = new Map<string, bigint>();
    const allClasses = await tx.canonClass.findMany({ select: { id: true, name: true } });
    for (const entry of allClasses) {
      classIndex.set(entry.name.toLowerCase(), entry.id);
    }

    await tx.canonSpellClass.deleteMany();
    const spells = await tx.canonSpell.findMany({ select: { id: true, classes: true } });
    for (const spell of spells) {
      for (const className of spell.classes ?? []) {
        const classId = classIndex.get(className.toLowerCase());
        if (!classId) {
          continue;
        }
        await tx.canonSpellClass.create({
          data: {
            spellId: spell.id,
            classId,
          },
        });
      }
    }
  });

  console.log("✅ Classes and subclasses imported from 5etools data");
}

export async function run(): Promise<void> {
  try {
    await importClasses();
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void run().catch((error) => {
    console.error("❌ Class import failed", error);
    process.exit(1);
  });
}
