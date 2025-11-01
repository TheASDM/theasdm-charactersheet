#!/usr/bin/env ts-node
import path from "path";
import { PrismaClient, RawContentKind } from "@prisma/client";

import { loadJsonFile } from "./utils/file-utils";
import { flattenEntries } from "./utils/jsonb-flattener";
import { strip5eTokens } from "./utils/token-cleaner";
import { ensureAllowedSource, isSourceAllowed } from "./utils/source-filter";
import { slugify } from "./utils/slugify";

interface SpeciesFile {
  race?: SpeciesRecord[];
  species?: SpeciesRecord[];
}

interface SpeciesRecord {
  name: string;
  source: string;
  size?: string[] | string;
  speed?: { walk?: number } & Record<string, number | undefined>;
  creatureType?: { type?: string } | string;
  lifespan?: string;
  entries?: unknown[];
  languageProficiencies?: Array<{ name?: string } | string> | { standard?: string[]; anyStandard?: number };
}

interface TraitData {
  name: string;
  description: string;
}

const prisma = new PrismaClient();
const DEFAULT_SPECIES_PATH = process.env.FIVETOOLS_SPECIES_PATH ?? path.join(process.cwd(), "data", "species.json");

function normalizeSize(size?: string[] | string): string {
  if (!size) {
    return "";
  }
  if (Array.isArray(size)) {
    return size.join(", ");
  }
  return size;
}

function normalizeCreatureType(creatureType?: { type?: string } | string): string {
  if (!creatureType) {
    return "";
  }
  if (typeof creatureType === "string") {
    return creatureType.toLowerCase();
  }
  return creatureType.type?.toLowerCase() ?? "";
}

function normalizeLanguages(value: SpeciesRecord["languageProficiencies"]): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        typeof entry === "string" ? strip5eTokens(entry) : strip5eTokens(entry.name ?? ""),
      )
      .filter(Boolean);
  }
  const parts: string[] = [];
  if (Array.isArray(value.standard)) {
    parts.push(...value.standard.map((entry) => strip5eTokens(entry)));
  }
  if (typeof value.anyStandard === "number" && value.anyStandard > 0) {
    parts.push(`${value.anyStandard} additional languages of your choice`);
  }
  return parts;
}

function extractTraits(entries: unknown[] | undefined): TraitData[] {
  if (!Array.isArray(entries)) {
    return [];
  }
  const traits: TraitData[] = [];
  for (const entry of entries) {
    if (typeof entry === "string") {
      continue;
    }
    if (entry && typeof entry === "object" && "name" in entry) {
      const typed = entry as { name?: string; entries?: unknown[]; headerEntries?: unknown[] };
      const name = strip5eTokens(typed.name ?? "");
      if (!name) {
        continue;
      }
      const description = flattenEntries(typed.entries ?? typed.headerEntries ?? []);
      if (description) {
        traits.push({ name, description });
      }
    }
  }
  return traits;
}

async function importSpecies(): Promise<void> {
  const data = loadJsonFile<SpeciesFile>(DEFAULT_SPECIES_PATH);
  const records = (data.species ?? data.race ?? []).filter((record) => isSourceAllowed(record.source));
  if (!records.length) {
    throw new Error(`No allowed species found in ${DEFAULT_SPECIES_PATH}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.canonSpeciesTrait.deleteMany();
    await tx.canonSpecies.deleteMany();
    await tx.rawContent.deleteMany({ where: { kind: RawContentKind.species } });

    for (const record of records) {
      const normalizedSource = ensureAllowedSource(record.source);
      const slug = slugify(record.name);
      const raw = await tx.rawContent.create({
        data: {
          kind: RawContentKind.species,
          slug,
          source: normalizedSource,
          title: record.name,
          raw: record as unknown as object,
          isHomebrew: normalizedSource.startsWith("homebrew:"),
        },
      });

      const speedWalk = record.speed?.walk ?? null;
      const otherSpeedEntries = Object.entries(record.speed ?? {})
        .filter(([key]) => key !== "walk" && record.speed?.[key] != null)
        .map(([key, value]) => `${key} ${value}`);
      const traits = extractTraits(record.entries);

      const speciesRecord = await tx.canonSpecies.create({
        data: {
          rawContentId: raw.id,
          slug,
          name: record.name,
          source: normalizedSource,
          size: normalizeSize(record.size),
          speedWalk: typeof speedWalk === "number" ? Math.round(speedWalk) : null,
          speedOther: otherSpeedEntries.join(", "),
          creatureType: normalizeCreatureType(record.creatureType) || null,
          lifespan: record.lifespan ? strip5eTokens(record.lifespan) : null,
          description: flattenEntries(record.entries ?? []),
          languages: normalizeLanguages(record.languageProficiencies),
        },
      });

      for (const trait of traits) {
        const traitSlug = slugify(`${slug}-${trait.name}`);
        await tx.canonSpeciesTrait.create({
          data: {
            speciesId: speciesRecord.id,
            slug: traitSlug,
            name: trait.name,
            description: trait.description,
            source: normalizedSource,
          },
        });
      }
    }
  });

  console.log(`✅ Imported ${records.length} species`);
}

export async function run(): Promise<void> {
  try {
    await importSpecies();
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void run().catch((error) => {
    console.error("❌ Species import failed", error);
    process.exit(1);
  });
}
