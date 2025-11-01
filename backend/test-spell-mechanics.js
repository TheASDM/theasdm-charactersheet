/**
 * Test script to verify spell mechanics are being returned correctly by the API
 */

const DATABASE_URL = "postgresql://wtforge:wtforge@localhost:5433/wtforge?schema=public";
process.env.DATABASE_URL = DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSpellMechanics() {
  console.log('🔍 Testing Spell Mechanics API Response\n');

  try {
    // Fetch a spell that should have rich mechanics (Fireball)
    const spell = await prisma.canonSpell.findFirst({
      where: {
        slug: 'fireball',
        source: 'XPHB'
      },
      include: {
        raw: true
      }
    });

    if (!spell) {
      console.error('❌ Could not find Fireball spell');
      return;
    }

    console.log('✅ Found spell:', spell.name);
    console.log('   ID:', spell.id.toString());
    console.log('   Level:', spell.level);
    console.log('   School:', spell.schoolCode);

    // Transform like the API does
    const transformed = {
      ...spell,
      mechanics: spell.raw?.raw
    };

    console.log('\n📋 Checking mechanics field:');
    console.log('   Has mechanics?', Boolean(transformed.mechanics));

    if (transformed.mechanics) {
      console.log('   Has entries?', Boolean(transformed.mechanics.entries));
      console.log('   Has entriesHigherLevel?', Boolean(transformed.mechanics.entriesHigherLevel));
      console.log('   Has spellAttack?', Boolean(transformed.mechanics.spellAttack));
      console.log('   Has damageInflict?', Boolean(transformed.mechanics.damageInflict));
      console.log('   Has savingThrow?', Boolean(transformed.mechanics.savingThrow));

      console.log('\n📊 Mechanics content:');
      console.log('   spellAttack:', transformed.mechanics.spellAttack);
      console.log('   damageInflict:', transformed.mechanics.damageInflict);
      console.log('   savingThrow:', transformed.mechanics.savingThrow);

      if (transformed.mechanics.entries && Array.isArray(transformed.mechanics.entries)) {
        console.log('\n   First entry:',
          typeof transformed.mechanics.entries[0] === 'string'
            ? transformed.mechanics.entries[0].substring(0, 100) + '...'
            : JSON.stringify(transformed.mechanics.entries[0], null, 2)
        );
      }
    } else {
      console.error('❌ No mechanics field found!');
      console.log('   Raw content:', spell.raw?.raw ? 'exists' : 'missing');
    }

    // Test with a cantrip that has scaling (Fire Bolt)
    console.log('\n\n🔍 Testing Cantrip Scaling (Fire Bolt)\n');

    const cantrip = await prisma.canonSpell.findFirst({
      where: {
        slug: 'fire-bolt',
        source: 'XPHB'
      },
      include: {
        raw: true
      }
    });

    if (cantrip) {
      const transformedCantrip = {
        ...cantrip,
        mechanics: cantrip.raw?.raw
      };

      console.log('✅ Found cantrip:', cantrip.name);
      console.log('   Level:', cantrip.level);

      if (transformedCantrip.mechanics) {
        console.log('\n📊 Cantrip mechanics:');
        console.log('   Has scalingLevelDice?', Boolean(transformedCantrip.mechanics.scalingLevelDice));
        if (transformedCantrip.mechanics.scalingLevelDice) {
          console.log('   Scaling:', JSON.stringify(transformedCantrip.mechanics.scalingLevelDice, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpellMechanics();
