#!/usr/bin/env ts-node
import path from "path";
import { PrismaClient } from "@prisma/client";

import { loadJsonFile } from "./utils/file-utils";

interface ReferenceData {
  spell_schools: Array<{ code: string; name: string; description?: string }>;
  damage_types: Array<{ slug: string; name: string; description?: string }>;
  conditions: Array<{ slug: string; name: string; description?: string }>;
}

const prisma = new PrismaClient();

async function importReferenceData(): Promise<void> {
  const dataPath = process.env.REFERENCE_DATA_PATH ?? path.join(__dirname, "data/reference-data.json");
  const referenceData = loadJsonFile<ReferenceData>(dataPath);

  await prisma.$transaction(async (tx) => {
    await tx.refSpellSchool.deleteMany();
    await tx.refDamageType.deleteMany();
    await tx.refCondition.deleteMany();

    if (referenceData.spell_schools?.length) {
      await tx.refSpellSchool.createMany({ data: referenceData.spell_schools });
    }
    if (referenceData.damage_types?.length) {
      await tx.refDamageType.createMany({ data: referenceData.damage_types });
    }
    if (referenceData.conditions?.length) {
      await tx.refCondition.createMany({ data: referenceData.conditions });
    }
  });

  console.log("✅ Reference tables seeded (ref.spell_school, ref.damage_type, ref.condition)");
}

export async function run(): Promise<void> {
  try {
    await importReferenceData();
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void run().catch((error) => {
    console.error("❌ Failed to import reference data", error);
    process.exit(1);
  });
}
