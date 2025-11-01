#!/usr/bin/env ts-node
import path from "path";
import { PrismaClient, RawContentKind } from "@prisma/client";

import { loadJsonFile } from "./utils/file-utils";
import { flattenEntries } from "./utils/jsonb-flattener";
import { strip5eTokens } from "./utils/token-cleaner";
import { ensureAllowedSource, isSourceAllowed } from "./utils/source-filter";
import { slugify } from "./utils/slugify";

interface BackgroundFile {
  background?: BackgroundRecord[];
}

interface BackgroundRecord {
  name: string;
  source: string;
  entries?: unknown[];
  skillProficiencies?: string[] | { choose?: { from?: string[]; count?: number } };
  toolProficiencies?: string[] | { choose?: { from?: string[]; count?: number } };
  languages?: string[] | { choose?: { from?: string[]; count?: number } };
  equipment?: unknown;
  feature?: { name?: string; entries?: unknown[] };
}

const prisma = new PrismaClient();
const DEFAULT_BACKGROUNDS_PATH = process.env.FIVETOOLS_BACKGROUNDS_PATH ?? path.join(process.cwd(), "data", "backgrounds.json");

function normalizeProficiency(value: BackgroundRecord["skillProficiencies"]): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => strip5eTokens(entry));
  }
  const choose = value.choose;
  if (!choose) {
    return [];
  }
  const parts: string[] = [];
  if (Array.isArray(choose.from)) {
    parts.push(`Choose ${choose.count ?? 1} from ${choose.from.join(", ")}`);
  }
  return parts;
}

function normalizeLanguages(value: BackgroundRecord["languages"]): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => strip5eTokens(entry));
  }
  if (value.choose?.from) {
    return [`Choose ${value.choose.count ?? 1} language(s)`];
  }
  return [];
}

async function importBackgrounds(): Promise<void> {
  const data = loadJsonFile<BackgroundFile>(DEFAULT_BACKGROUNDS_PATH);
  const records = (data.background ?? []).filter((record) => isSourceAllowed(record.source));
  if (!records.length) {
    throw new Error(`No allowed backgrounds found in ${DEFAULT_BACKGROUNDS_PATH}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.canonBackground.deleteMany();
    await tx.rawContent.deleteMany({ where: { kind: RawContentKind.background } });

    for (const record of records) {
      const normalizedSource = ensureAllowedSource(record.source);
      const slug = slugify(record.name);
      const raw = await tx.rawContent.create({
        data: {
          kind: RawContentKind.background,
          slug,
          source: normalizedSource,
          title: record.name,
          raw: record as unknown as object,
          isHomebrew: normalizedSource.startsWith("homebrew:"),
        },
      });

      const featureName = strip5eTokens(record.feature?.name ?? "");
      const featureDescription = flattenEntries(record.feature?.entries ?? []);

      await tx.canonBackground.create({
        data: {
          rawContentId: raw.id,
          slug,
          name: record.name,
          source: normalizedSource,
          description: flattenEntries(record.entries ?? []),
          skillProficiencies: normalizeProficiency(record.skillProficiencies),
          toolProficiencies: normalizeProficiency(record.toolProficiencies),
          languages: normalizeLanguages(record.languages),
          equipment: record.equipment ? strip5eTokens(typeof record.equipment === "string" ? record.equipment : JSON.stringify(record.equipment)) : null,
          featureName: featureName || null,
          featureDescription: featureDescription || null,
        },
      });
    }
  });

  console.log(`✅ Imported ${records.length} backgrounds`);
}

export async function run(): Promise<void> {
  try {
    await importBackgrounds();
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void run().catch((error) => {
    console.error("❌ Background import failed", error);
    process.exit(1);
  });
}
