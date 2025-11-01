#!/usr/bin/env ts-node
import path from "path";
import { PrismaClient, RawContentKind } from "@prisma/client";

import { loadJsonFile } from "./utils/file-utils";
import { flattenEntries } from "./utils/jsonb-flattener";
import { strip5eTokens } from "./utils/token-cleaner";
import { ensureAllowedSource, isSourceAllowed } from "./utils/source-filter";
import { slugify } from "./utils/slugify";

interface FeatFile {
  feat?: FeatRecord[];
}

interface FeatRecord {
  name: string;
  source: string;
  level?: number;
  prerequisite?: unknown[];
  repeatable?: boolean | string;
  ability?: unknown;
  entries?: unknown[];
}

const prisma = new PrismaClient();
const DEFAULT_FEATS_PATH = process.env.FIVETOOLS_FEATS_PATH ?? path.join(process.cwd(), "data", "feats.json");

function normalizePrerequisites(value: unknown[] | undefined): string {
  if (!Array.isArray(value)) {
    return "";
  }
  return value
    .map((entry) => (typeof entry === "string" ? strip5eTokens(entry) : strip5eTokens(JSON.stringify(entry))))
    .filter(Boolean)
    .join("; ");
}

function normalizeAbilityScoreIncrease(value: unknown): string {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return strip5eTokens(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => strip5eTokens(typeof entry === "string" ? entry : JSON.stringify(entry))).join("; ");
  }
  if (typeof value === "object") {
    return strip5eTokens(JSON.stringify(value));
  }
  return strip5eTokens(String(value));
}

function isRepeatable(value: FeatRecord["repeatable"]): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "yes" || value.toLowerCase() === "true";
  }
  return false;
}

async function importFeats(): Promise<void> {
  const data = loadJsonFile<FeatFile>(DEFAULT_FEATS_PATH);
  const feats = (data.feat ?? []).filter((feat) => isSourceAllowed(feat.source));
  if (!feats.length) {
    throw new Error(`No allowed feats found in ${DEFAULT_FEATS_PATH}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.canonFeat.deleteMany();
    await tx.rawContent.deleteMany({ where: { kind: RawContentKind.feat } });

    for (const feat of feats) {
      const normalizedSource = ensureAllowedSource(feat.source);
      const slug = slugify(feat.name);
      const raw = await tx.rawContent.create({
        data: {
          kind: RawContentKind.feat,
          slug,
          source: normalizedSource,
          title: feat.name,
          raw: feat as unknown as object,
          isHomebrew: normalizedSource.startsWith("homebrew:"),
        },
      });

      await tx.canonFeat.create({
        data: {
          rawContentId: raw.id,
          slug,
          name: feat.name,
          source: normalizedSource,
          levelRequirement: feat.level ?? null,
          prerequisiteSummary: normalizePrerequisites(feat.prerequisite),
          repeatable: isRepeatable(feat.repeatable),
          abilityScoreIncrease: normalizeAbilityScoreIncrease(feat.ability) || null,
          description: flattenEntries(feat.entries ?? []),
        },
      });
    }
  });

  console.log(`✅ Imported ${feats.length} feats`);
}

export async function run(): Promise<void> {
  try {
    await importFeats();
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void run().catch((error) => {
    console.error("❌ Feat import failed", error);
    process.exit(1);
  });
}
