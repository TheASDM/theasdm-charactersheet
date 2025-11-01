#!/usr/bin/env ts-node
import { run as importReference } from "./import-reference";
import { run as importSpells } from "./import-spells";
import { run as importItems } from "./import-items";
import { run as importClasses } from "./import-classes";
import { run as importSpecies } from "./import-species";
import { run as importBackgrounds } from "./import-backgrounds";
import { run as importFeats } from "./import-feats";

const STEPS: Array<{ name: string; action: () => Promise<void> }> = [
  { name: "Reference data", action: importReference },
  { name: "Spells", action: importSpells },
  { name: "Items", action: importItems },
  { name: "Classes", action: importClasses },
  { name: "Species", action: importSpecies },
  { name: "Backgrounds", action: importBackgrounds },
  { name: "Feats", action: importFeats },
];

export async function run(): Promise<void> {
  for (const step of STEPS) {
    console.log(`\n▶️  Importing ${step.name}...`);
    await step.action();
  }
  console.log("\n✅ Completed full import pipeline");
}

if (require.main === module) {
  void run().catch((error) => {
    console.error("❌ Import pipeline failed", error);
    process.exit(1);
  });
}
