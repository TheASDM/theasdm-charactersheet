/**
 * Test that spell actions are building correctly with mechanics data
 */

const DATABASE_URL = "postgresql://wtforge:wtforge@localhost:5433/wtforge?schema=public";
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSpellActions() {
  console.log('🔍 Testing Spell Action Building\n');

  try {
    // Test spells with different mechanics
    const testCases = [
      { name: 'Fire Bolt', slug: 'fire-bolt', expected: 'Cantrip with attack and damage' },
      { name: 'Fireball', slug: 'fireball', expected: 'Save spell with damage' },
      { name: 'Cure Wounds', slug: 'cure-wounds', expected: 'Touch spell with healing' },
      { name: 'Shield', slug: 'shield', expected: 'Reaction spell, no attack/damage' },
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 ${testCase.name} (${testCase.expected})`);
      console.log('─'.repeat(60));

      const spell = await prisma.canonSpell.findFirst({
        where: {
          slug: testCase.slug,
          source: 'XPHB'
        },
        include: {
          raw: true
        }
      });

      if (!spell) {
        console.log(`  ❌ Spell not found`);
        continue;
      }

      // Transform like the API does
      const transformed = {
        ...spell,
        mechanics: spell.raw?.raw
      };

      // Check what the action builder would see
      const mechanics = transformed.mechanics || transformed;

      console.log(`  ✅ Level: ${spell.level} (${spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`})`);
      console.log(`  📊 Mechanics available:`);
      console.log(`     - entries: ${Boolean(mechanics.entries)}`);
      console.log(`     - spellAttack: ${mechanics.spellAttack || 'none'}`);
      console.log(`     - savingThrow: ${mechanics.savingThrow || 'none'}`);
      console.log(`     - damageInflict: ${mechanics.damageInflict || 'none'}`);
      console.log(`     - scalingLevelDice: ${Boolean(mechanics.scalingLevelDice)}`);

      // Check for damage tags in entries
      if (mechanics.entries) {
        const entriesStr = JSON.stringify(mechanics.entries);
        const hasDamageTags = /{@damage/.test(entriesStr);
        const hasDiceTags = /{@dice/.test(entriesStr);

        if (hasDamageTags) {
          const damageMatch = entriesStr.match(/{@damage ([^}]+)}/);
          console.log(`     - damage tags: ${damageMatch ? damageMatch[1] : 'found'}`);
        }

        if (hasDiceTags) {
          const diceMatch = entriesStr.match(/{@dice ([^}]+)}/);
          console.log(`     - dice tags: ${diceMatch ? diceMatch[1] : 'found'}`);
        }
      }

      // Expected action components
      console.log(`  🎯 Expected in action:`);

      if (mechanics.spellAttack?.length) {
        console.log(`     - attack: spell attack (ability: spellcasting)`);
      }

      if (mechanics.savingThrow?.length) {
        console.log(`     - save: ${mechanics.savingThrow[0]} DC (spellcasting)`);
      }

      if (mechanics.damageInflict?.length) {
        console.log(`     - damage: ${mechanics.damageInflict.join(', ')} damage`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpellActions();
