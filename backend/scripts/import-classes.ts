import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Import D&D 2024 classes from 5etools JSON files into canon.class_definition
 */

interface ClassData {
  name: string;
  source: string;
  edition?: string;
  page?: number;
  hd: { number: number; faces: number };
  proficiency: string[]; // Saving throws
  spellcastingAbility?: string;
  casterProgression?: string;
  startingProficiencies: {
    armor?: string[];
    weapons?: string[];
    tools?: string[];
    skills?: Array<{ choose?: { from: string[]; count: number } }>;
  };
  multiclassing?: {
    proficienciesGained?: {
      armor?: string[];
      weapons?: string[];
    };
  };
  fluff?: Array<{ name: string; source: string; entries: any[] }>;
}

/**
 * Normalize weapon proficiency display
 * Converts 5etools format to user-friendly display strings
 */
function normalizeWeaponProficiencies(weapons: string[]): string[] {
  if (!weapons || weapons.length === 0) return [];

  const normalized: string[] = [];

  for (const weapon of weapons) {
    // Handle category proficiencies
    if (weapon === 'simple') {
      normalized.push('Simple Weapons');
    } else if (weapon === 'martial') {
      normalized.push('Martial Weapons');
    } else if (weapon.startsWith('{@item')) {
      // Individual weapon with template tag: {@item dagger|phb|daggers}
      // Extract the display name (third part after splitting by |)
      const match = weapon.match(/\{@item [^|]+\|[^|]+\|([^}]+)\}/);
      if (match) {
        // Capitalize first letter
        const weaponName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        normalized.push(weaponName);
      }
    } else {
      // Plain text weapon name
      normalized.push(weapon.charAt(0).toUpperCase() + weapon.slice(1));
    }
  }

  return normalized;
}

/**
 * Normalize armor proficiency display
 */
function normalizeArmorProficiencies(armor: string[]): string[] {
  if (!armor || armor.length === 0) return [];

  const normalized: string[] = [];

  for (const item of armor) {
    if (item === 'light') {
      normalized.push('Light Armor');
    } else if (item === 'medium') {
      normalized.push('Medium Armor');
    } else if (item === 'heavy') {
      normalized.push('Heavy Armor');
    } else if (item === 'shield' || item === 'shields') {
      normalized.push('Shields');
    } else {
      // Capitalize
      normalized.push(item.charAt(0).toUpperCase() + item.slice(1));
    }
  }

  return normalized;
}

/**
 * Normalize tool proficiencies
 */
function normalizeToolProficiencies(tools: string[]): string[] {
  if (!tools || tools.length === 0) return [];

  return tools.map(tool => {
    // Handle template tags like {@item thieves' tools|phb}
    if (tool.startsWith('{@item')) {
      const match = tool.match(/\{@item ([^|}]+)/);
      if (match) {
        return match[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    return tool.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  });
}

/**
 * Create slug from class name
 */
function createSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

async function importClasses() {
  const classesDir = path.join(process.cwd(), '../5etools');

  // Find all class JSON files
  const classFiles = fs.readdirSync(classesDir)
    .filter(f => f.startsWith('class-') && f.endsWith('.json') && !f.includes('fluff'));

  console.log(`Found ${classFiles.length} class files to process\n`);

  let imported = 0;
  let skipped = 0;

  for (const filename of classFiles) {
    const filePath = path.join(classesDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Filter for XPHB 2024 edition classes
    const xphbClasses = data.class.filter((cls: ClassData) =>
      cls.source === 'XPHB' || cls.edition === 'one'
    );

    if (xphbClasses.length === 0) {
      console.log(`⚠️  No XPHB edition found in ${filename}, skipping`);
      skipped++;
      continue;
    }

    // Use the first XPHB entry (should only be one)
    const classData: ClassData = xphbClasses[0];

    console.log(`📚 Importing: ${classData.name}`);

    // First, create or get raw content entry
    const slug = createSlug(classData.name);
    const rawContent = await prisma.rawContent.upsert({
      where: {
        kind_slug_source: {
          kind: 'class',
          slug: slug,
          source: classData.source
        }
      },
      create: {
        kind: 'class',
        slug: slug,
        source: classData.source,
        title: classData.name,
        raw: data as any
      },
      update: {
        title: classData.name,
        raw: data as any
      }
    });

    // Normalize proficiencies for display
    const weaponProfs = normalizeWeaponProficiencies(classData.startingProficiencies.weapons || []);
    const armorProfs = normalizeArmorProficiencies(classData.startingProficiencies.armor || []);
    const toolProfs = normalizeToolProficiencies(classData.startingProficiencies.tools || []);

    // Create/update class definition
    await prisma.canonClass.upsert({
      where: {
        slug_source: {
          slug: createSlug(classData.name),
          source: classData.source
        }
      },
      create: {
        rawContentId: rawContent.id,
        slug: createSlug(classData.name),
        name: classData.name,
        source: classData.source,
        hitDie: classData.hd.faces,
        primaryAbilities: classData.proficiency, // These are actually saving throws in 5etools
        savingThrows: classData.proficiency,
        armorProficiencies: armorProfs,
        weaponProficiencies: weaponProfs,
        toolProficiencies: toolProfs,
        spellcastingAbility: classData.spellcastingAbility || null,
        summary: null // We can add this later from fluff data
      },
      update: {
        hitDie: classData.hd.faces,
        primaryAbilities: classData.proficiency,
        savingThrows: classData.proficiency,
        armorProficiencies: armorProfs,
        weaponProficiencies: weaponProfs,
        toolProficiencies: toolProfs,
        spellcastingAbility: classData.spellcastingAbility || null
      }
    });

    console.log(`  ✅ Imported with proficiencies:`);
    console.log(`     - Armor: ${armorProfs.join(', ') || 'None'}`);
    console.log(`     - Weapons: ${weaponProfs.join(', ') || 'None'}`);
    console.log(`     - Tools: ${toolProfs.join(', ') || 'None'}`);
    console.log(`     - Saving Throws: ${classData.proficiency.map(s => s.toUpperCase()).join(', ')}`);
    console.log('');

    imported++;
  }

  console.log(`\n✨ Import complete!`);
  console.log(`   - Imported: ${imported} classes`);
  console.log(`   - Skipped: ${skipped} files`);
}

// Run the import
importClasses()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
