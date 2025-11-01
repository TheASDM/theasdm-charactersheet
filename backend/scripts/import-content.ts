import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Configuration
const DATA_DIR =
  '/Users/dustinamodeo/Documents/coding/projects/theasdm-charactersheet/5etools';
const ALLOWED_SOURCES = ['XPHB', 'XDMG']; // Only 2024 books

// Helper: Map old sources to new sources
function mapSource(item: any): string | null {
  if (!item.source) return null;

  // Only allow XPHB and XDMG (2024 books)
  const sourceMap: Record<string, string> = {
    'XPHB': 'XPHB',
    'XDMG': 'XDMG',
  };

  // Map the source - ONLY 2024 books
  const mapped = sourceMap[item.source];
  if (mapped && ALLOWED_SOURCES.includes(mapped)) return mapped;

  return null;
}

// Helper: Check if source is allowed
function isAllowedSource(item: any): boolean {
  return mapSource(item) !== null;
}

// Helper: Clean 5etools markup tokens
function cleanMarkup(text: string | null | undefined): string {
  if (!text) return '';

  let cleaned = text;

  // {@skill Insight} → Insight
  cleaned = cleaned.replace(/\{@skill ([^}]+)\}/g, '$1');

  // {@item holy symbol|phb} → holy symbol
  cleaned = cleaned.replace(/\{@item ([^|}]+)(?:\|[^}]*)?\}/g, '$1');

  // {@spell Cure Wounds} → Cure Wounds
  cleaned = cleaned.replace(/\{@spell ([^|}]+)(?:\|[^}]*)?\}/g, '$1');

  // {@damage 1d4 + 1} → 1d4 + 1
  cleaned = cleaned.replace(/\{@damage ([^}]+)\}/g, '$1');

  // {@creature Mister Witch|WBtW} → Mister Witch
  cleaned = cleaned.replace(/\{@creature ([^|}]+)(?:\|[^}]*)?\}/g, '$1');

  // {@feat Strixhaven Initiate|SCC} → Strixhaven Initiate
  cleaned = cleaned.replace(/\{@feat ([^|}]+)(?:\|[^}]*)?\}/g, '$1');

  // {@class Wizard|PHB|School of Necromancy|Necromancy|PHB} → Wizard (School of Necromancy)
  cleaned = cleaned.replace(
    /\{@class ([^|]+)\|[^|]*\|([^|]+)(?:\|[^}]*)?\}/g,
    '$1 ($2)'
  );
  cleaned = cleaned.replace(/\{@class ([^|}]+)(?:\|[^}]*)?\}/g, '$1');

  // Generic {@tag content} → content
  cleaned = cleaned.replace(/\{@[a-zA-Z0-9_]+ ([^|}]+)(?:\|[^}]*)?\}/g, '$1');

  // Remove any remaining tags
  cleaned = cleaned.replace(/\{@[^}]+\}/g, '');

  return cleaned.trim();
}

// Helper: Extract text from entries array
function extractEntries(entries: any[]): string {
  if (!Array.isArray(entries)) return '';

  return entries
    .map((entry) => {
      if (typeof entry === 'string') return cleanMarkup(entry);
      if (entry.type === 'entries' && entry.entries) {
        return extractEntries(entry.entries);
      }
      if (entry.type === 'list' && entry.items) {
        return extractEntries(entry.items);
      }
      if (entry.entry) return cleanMarkup(entry.entry);
      if (entry.entries) return extractEntries(entry.entries);
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

// Helper: Create slug from name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Import Backgrounds
async function importBackgrounds() {
  console.log('\n📚 Importing Backgrounds...');

  const filePath = path.join(DATA_DIR, 'backgrounds.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const backgrounds = data.background || [];

  // Load fluff data
  const fluffPath = path.join(DATA_DIR, 'fluff-backgrounds.json');
  const fluffData = JSON.parse(fs.readFileSync(fluffPath, 'utf-8'));
  const fluffMap: Record<string, any> = {};
  (fluffData.backgroundFluff || []).forEach((f: any) => {
    const key = `${f.name}|${f.source}`;
    fluffMap[key] = f;
  });

  let imported = 0;
  let skipped = 0;

  for (const bg of backgrounds) {
    const source = mapSource(bg);
    if (!source) {
      skipped++;
      continue;
    }

    const slug = slugify(bg.name);
    const description = extractEntries(bg.entries || []);

    // Merge fluff data if available
    const fluffKey = `${bg.name}|${bg.source}`;
    if (fluffMap[fluffKey]) {
      bg.fluff = fluffMap[fluffKey].entries;
    }

    // Extract origin feat
    let originFeatSlug = null;
    if (bg.feat) {
      // 2024 backgrounds: "feat": "Magic Initiate (Cleric)"
      originFeatSlug = slugify(bg.feat);
    } else if (bg.feats && bg.feats.length > 0) {
      // Older format: "feats": [{"magic initiate|phb": true}]
      const featKey = Object.keys(bg.feats[0])[0];
      if (featKey) {
        originFeatSlug = slugify(featKey.split('|')[0]); // Remove source suffix
      }
    }

    try {
      // Insert into raw.content
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO raw.content (kind, slug, source, title, raw, is_homebrew)
        VALUES ('background', $1, $2, $3, $4::jsonb, false)
        ON CONFLICT (kind, slug, source) DO UPDATE SET
          raw = EXCLUDED.raw,
          imported_at = NOW()
      `,
        slug,
        source,
        bg.name,
        JSON.stringify(bg)
      );

      // Insert into canon.background_definition
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO canon.background_definition (
          raw_content_id,
          slug,
          name,
          source,
          description,
          skill_proficiencies,
          tool_proficiencies,
          languages,
          equipment,
          feature_name,
          feature_description,
          origin_feat_slug
        )
        SELECT
          rc.id,
          $1,
          $2,
          $3,
          canon.collect_entries($4::jsonb),
          $5::jsonb,
          $6::jsonb,
          $7::jsonb,
          $8,
          $9,
          $10,
          $11
        FROM raw.content rc
        WHERE rc.kind = 'background' AND rc.slug = $1 AND rc.source = $3
        ON CONFLICT (slug, source) DO UPDATE SET
          description = EXCLUDED.description,
          skill_proficiencies = EXCLUDED.skill_proficiencies,
          tool_proficiencies = EXCLUDED.tool_proficiencies,
          languages = EXCLUDED.languages,
          equipment = EXCLUDED.equipment,
          feature_name = EXCLUDED.feature_name,
          feature_description = EXCLUDED.feature_description,
          origin_feat_slug = EXCLUDED.origin_feat_slug,
          updated_at = NOW()
      `,
        slug,
        bg.name,
        source,
        JSON.stringify(bg.entries || []),
        JSON.stringify(bg.skillProficiencies || []),
        JSON.stringify(bg.toolProficiencies || []),
        JSON.stringify(bg.languageProficiencies || []),
        extractEntries(bg.startingEquipment || []) || null,
        bg.featureName || null,
        bg.featureDescription || extractEntries(bg.featureEntries || []) || null,
        originFeatSlug
      );

      imported++;
    } catch (error: any) {
      console.error(`  ❌ Failed to import ${bg.name}:`, error.message);
    }
  }

  console.log(`  ✅ Imported ${imported} backgrounds (${skipped} skipped)`);
}

// Import Feats
async function importFeats() {
  console.log('\n🎯 Importing Feats...');

  const filePath = path.join(DATA_DIR, 'feats.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const feats = data.feat || [];

  // Load fluff data
  const fluffPath = path.join(DATA_DIR, 'fluff-feats.json');
  const fluffData = JSON.parse(fs.readFileSync(fluffPath, 'utf-8'));
  const fluffMap: Record<string, any> = {};
  (fluffData.featFluff || []).forEach((f: any) => {
    const key = `${f.name}|${f.source}`;
    fluffMap[key] = f;
  });

  let imported = 0;
  let skipped = 0;

  for (const feat of feats) {
    const source = mapSource(feat);
    if (!source) {
      skipped++;
      continue;
    }

    const slug = slugify(feat.name);
    const description = extractEntries(feat.entries || []);

    // Merge fluff data if available
    const fluffKey = `${feat.name}|${feat.source}`;
    if (fluffMap[fluffKey]) {
      feat.fluff = fluffMap[fluffKey].entries;
    }

    try {
      // Insert into raw.content
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO raw.content (kind, slug, source, title, raw, is_homebrew)
        VALUES ('feat', $1, $2, $3, $4::jsonb, false)
        ON CONFLICT (kind, slug, source) DO UPDATE SET
          raw = EXCLUDED.raw,
          imported_at = NOW()
      `,
        slug,
        source,
        feat.name,
        JSON.stringify(feat)
      );

      // Extract prerequisite summary
      let prerequisiteSummary = null;
      if (feat.prerequisite) {
        if (Array.isArray(feat.prerequisite)) {
          prerequisiteSummary = feat.prerequisite
            .map((p: any) => {
              if (typeof p === 'string') return p;
              if (p.level) return `Level ${p.level}`;
              if (p.ability) {
                return Object.entries(p.ability)
                  .map(([ab, val]) => `${ab.toUpperCase()} ${val}`)
                  .join(', ');
              }
              return JSON.stringify(p);
            })
            .join(', ');
        } else if (typeof feat.prerequisite === 'object') {
          if (feat.prerequisite.level) {
            prerequisiteSummary = `Level ${feat.prerequisite.level}`;
          }
        }
      }

      // Extract level requirement
      let levelRequirement = null;
      if (feat.prerequisite) {
        if (Array.isArray(feat.prerequisite)) {
          const levelPrereq = feat.prerequisite.find((p: any) => p.level);
          if (levelPrereq) levelRequirement = levelPrereq.level;
        } else if (feat.prerequisite.level) {
          levelRequirement = feat.prerequisite.level;
        }
      }

      // Extract ability score increase
      let abilityScoreIncrease = null;
      if (feat.ability && Array.isArray(feat.ability)) {
        const increases = feat.ability
          .map((ab: any) => {
            if (ab.choose) {
              return `+${ab.choose.amount || 1} to ${ab.choose.count || 1} ability score(s)`;
            }
            return Object.entries(ab)
              .filter(([k]) => k !== 'choose')
              .map(([k, v]) => `${k.toUpperCase()} +${v}`)
              .join(', ');
          })
          .filter(Boolean)
          .join('; ');
        if (increases) abilityScoreIncrease = increases;
      }

      // Map category code to readable name
      let category = null;
      if (feat.category) {
        const categoryMap: Record<string, string> = {
          'O': 'Origin',
          'G': 'General',
          'FS': 'Fighting Style',
          'FS:P': 'Fighting Style (Paladin)',
          'FS:R': 'Fighting Style (Ranger)',
          'Epic': 'Epic Boon',
          'EB': 'Epic Boon'
        };
        category = categoryMap[feat.category] || feat.category;
      }

      // Insert into canon.feat_definition
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO canon.feat_definition (
          raw_content_id,
          slug,
          name,
          source,
          category,
          level_requirement,
          prerequisite_summary,
          repeatable,
          ability_score_increase,
          description
        )
        SELECT
          rc.id,
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          canon.collect_entries($9::jsonb)
        FROM raw.content rc
        WHERE rc.kind = 'feat' AND rc.slug = $1 AND rc.source = $3
        ON CONFLICT (slug, source) DO UPDATE SET
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          level_requirement = EXCLUDED.level_requirement,
          prerequisite_summary = EXCLUDED.prerequisite_summary,
          repeatable = EXCLUDED.repeatable,
          ability_score_increase = EXCLUDED.ability_score_increase,
          updated_at = NOW()
      `,
        slug,
        feat.name,
        source,
        category,
        levelRequirement,
        prerequisiteSummary,
        feat.repeatable || false,
        abilityScoreIncrease,
        JSON.stringify(feat.entries || [])
      );

      imported++;
    } catch (error: any) {
      console.error(`  ❌ Failed to import ${feat.name}:`, error.message);
    }
  }

  console.log(`  ✅ Imported ${imported} feats (${skipped} skipped)`);
}

// Import Species (from races.json)
async function importSpecies() {
  console.log('\n🧝 Importing Species...');

  const filePath = path.join(DATA_DIR, 'races.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const races = data.race || [];

  // Load fluff data
  const fluffPath = path.join(DATA_DIR, 'fluff-races.json');
  const fluffData = JSON.parse(fs.readFileSync(fluffPath, 'utf-8'));
  const fluffMap: Record<string, any> = {};
  (fluffData.raceFluff || []).forEach((f: any) => {
    const key = `${f.name}|${f.source}`;
    fluffMap[key] = f;
  });

  let imported = 0;
  let skipped = 0;

  for (const race of races) {
    const source = mapSource(race);
    if (!source) {
      skipped++;
      continue;
    }

    const slug = slugify(race.name);
    const description = extractEntries(race.entries || []);

    // Merge fluff data if available
    const fluffKey = `${race.name}|${race.source}`;
    if (fluffMap[fluffKey]) {
      race.fluff = fluffMap[fluffKey].entries;
    }

    try {
      // Insert into raw.content
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO raw.content (kind, slug, source, title, raw, is_homebrew)
        VALUES ('species', $1, $2, $3, $4::jsonb, false)
        ON CONFLICT (kind, slug, source) DO UPDATE SET
          raw = EXCLUDED.raw,
          imported_at = NOW()
      `,
        slug,
        source,
        race.name,
        JSON.stringify(race)
      );

      // Extract size
      let size = null;
      if (race.size && Array.isArray(race.size)) {
        size = race.size[0]; // Take first size if multiple
      } else if (typeof race.size === 'string') {
        size = race.size;
      }

      // Extract speed
      const speedWalk = race.speed?.walk || 30;
      let speedOther = null;
      if (race.speed) {
        const otherSpeeds = Object.entries(race.speed)
          .filter(([k]) => k !== 'walk')
          .map(([k, v]) => `${k} ${v} ft.`)
          .join(', ');
        if (otherSpeeds) speedOther = otherSpeeds;
      }

      // Extract languages
      const languages: string[] = [];
      if (race.languageProficiencies && Array.isArray(race.languageProficiencies)) {
        for (const langObj of race.languageProficiencies) {
          if (typeof langObj === 'object') {
            if (langObj.anyStandard) {
              languages.push(`Any ${langObj.anyStandard} standard languages`);
            } else if (langObj.choose) {
              languages.push(`Choose ${langObj.choose.count || 1} from ${langObj.choose.from?.join(', ') || 'any'}`);
            } else {
              languages.push(...Object.keys(langObj).filter(k => langObj[k]));
            }
          } else if (typeof langObj === 'string') {
            languages.push(langObj);
          }
        }
      }

      // Insert into canon.species_definition
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO canon.species_definition (
          raw_content_id,
          slug,
          name,
          source,
          size,
          speed_walk,
          speed_other,
          description,
          languages
        )
        SELECT
          rc.id,
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          canon.collect_entries($7::jsonb),
          $8::text[]
        FROM raw.content rc
        WHERE rc.kind = 'species' AND rc.slug = $1 AND rc.source = $3
        ON CONFLICT (slug, source) DO UPDATE SET
          description = EXCLUDED.description,
          size = EXCLUDED.size,
          speed_walk = EXCLUDED.speed_walk,
          speed_other = EXCLUDED.speed_other,
          languages = EXCLUDED.languages,
          updated_at = NOW()
      `,
        slug,
        race.name,
        source,
        size,
        speedWalk,
        speedOther,
        JSON.stringify(race.entries || []),
        languages
      );

      imported++;
    } catch (error: any) {
      console.error(`  ❌ Failed to import ${race.name}:`, error.message);
    }
  }

  console.log(`  ✅ Imported ${imported} species (${skipped} skipped)`);
}

// Import Items
async function importItems() {
  console.log('\n⚔️ Importing Items...');

  const filePath = path.join(DATA_DIR, 'items.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Items can be in different arrays
  const items = [
    ...(data.item || []),
    ...(data.itemGroup || []),
    ...(data.baseitem || []),
  ];

  let imported = 0;
  let skipped = 0;

  for (const item of items) {
    const source = mapSource(item);
    if (!source) {
      skipped++;
      continue;
    }

    const slug = slugify(item.name);
    const description = extractEntries(item.entries || []);

    try {
      // Insert into raw.content
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO raw.content (kind, slug, source, title, raw, is_homebrew)
        VALUES ('item', $1, $2, $3, $4::jsonb, false)
        ON CONFLICT (kind, slug, source) DO UPDATE SET
          raw = EXCLUDED.raw,
          imported_at = NOW()
      `,
        slug,
        source,
        item.name,
        JSON.stringify(item)
      );

      // Insert into canon.item
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO canon.item (
          raw_content_id,
          slug,
          name,
          source,
          item_type,
          rarity,
          description,
          requires_attunement,
          cost_value,
          cost_unit,
          weight
        )
        SELECT 
          rc.id,
          $1,
          $2,
          $3,
          $4,
          $5,
          canon.collect_entries($6::jsonb),
          $7,
          $8,
          $9,
          $10
        FROM raw.content rc
        WHERE rc.kind = 'item' AND rc.slug = $1 AND rc.source = $3
        ON CONFLICT (slug, source) DO UPDATE SET
          description = EXCLUDED.description,
          updated_at = NOW()
      `,
        slug,
        item.name,
        source,
        item.type || item.typeAlt || null,
        item.rarity || null,
        JSON.stringify(item.entries || []),
        item.reqAttune ? true : false,
        item.value || null,
        item.valueCurrency || 'gp',
        item.weight || null
      );

      imported++;
    } catch (error: any) {
      console.error(`  ❌ Failed to import ${item.name}:`, error.message);
    }
  }

  console.log(`  ✅ Imported ${imported} items (${skipped} skipped)`);
}

// Import Spells
async function importSpells() {
  console.log('\n✨ Importing Spells...');

  const filePath = path.join(DATA_DIR, 'spells.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const spells = data.spell || [];

  let imported = 0;
  let skipped = 0;

  for (const spell of spells) {
    if (!isAllowedSource(spell)) {
      skipped++;
      continue;
    }

    const slug = slugify(spell.name);
    const source = mapSource(spell)!;

    try {
      // Insert into raw.content
      await prisma.$executeRawUnsafe(`
        INSERT INTO raw.content (kind, slug, source, title, raw, is_homebrew)
        VALUES ('spell', $1, $2, $3, $4::jsonb, false)
        ON CONFLICT (kind, slug, source) DO UPDATE SET
          raw = EXCLUDED.raw,
          imported_at = NOW()
      `, slug, source, spell.name, JSON.stringify(spell));

      // Extract spell components
      const componentsVerbal = spell.components?.v || false;
      const componentsSomatic = spell.components?.s || false;
      const componentsMaterial = spell.components?.m ?
        (typeof spell.components.m === 'string' ? spell.components.m : spell.components.m.text) : null;

      // Extract casting time
      const castingTime = spell.time && spell.time[0] ?
        `${spell.time[0].number || 1} ${spell.time[0].unit || 'action'}` : null;

      // Extract range
      const spellRange = spell.range?.distance?.amount ?
        `${spell.range.distance.amount} ${spell.range.distance.type}` :
        (spell.range?.type || null);

      // Extract duration
      const duration = spell.duration && spell.duration[0] ?
        (spell.duration[0].concentration ? 'Concentration, ' : '') +
        (spell.duration[0].duration?.amount ?
          `${spell.duration[0].duration.amount} ${spell.duration[0].duration.type}` :
          spell.duration[0].type || 'Instantaneous') : null;

      // Extract description
      const description = extractEntries(spell.entries || []);
      const higherLevel = spell.entriesHigherLevel ?
        extractEntries(spell.entriesHigherLevel) : null;

      // Extract classes (spell lists)
      const classes: string[] = [];
      if (spell.classes?.fromClassList && Array.isArray(spell.classes.fromClassList)) {
        classes.push(...spell.classes.fromClassList.map((c: any) => c.name || c));
      }

      // Insert into canon.spell
      await prisma.$executeRawUnsafe(`
        INSERT INTO canon.spell (
          raw_content_id, slug, name, level, school_code,
          casting_time, spell_range, components_verbal, components_somatic,
          components_material, duration, description, higher_level,
          ritual, concentration, source, classes
        )
        SELECT
          rc.id, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::text[]
        FROM raw.content rc
        WHERE rc.kind = 'spell' AND rc.slug = $1 AND rc.source = $15
        ON CONFLICT (slug, source) DO UPDATE SET
          description = EXCLUDED.description,
          higher_level = EXCLUDED.higher_level,
          updated_at = NOW()
      `,
        slug,
        spell.name,
        spell.level || 0,
        spell.school || null,
        castingTime,
        spellRange,
        componentsVerbal,
        componentsSomatic,
        componentsMaterial,
        duration,
        description,
        higherLevel,
        spell.meta?.ritual || false,
        spell.duration?.[0]?.concentration || false,
        source,
        classes
      );

      imported++;
    } catch (error: any) {
      console.error(`  ❌ Failed to import ${spell.name}:`, error.message);
    }
  }

  console.log(`  ✅ Imported ${imported} spells (${skipped} skipped)`);
}

// Main
async function main() {
  console.log('🚀 Starting content import from 5etools...');
  console.log(`📁 Source: ${DATA_DIR}`);
  console.log(`✅ Allowed sources: ${ALLOWED_SOURCES.join(', ')}, SRD\n`);

  try {
    await importBackgrounds();
    await importFeats();
    await importSpecies();
    await importItems();
    await importSpells();

    console.log('\n✅ All content imported successfully!');
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
