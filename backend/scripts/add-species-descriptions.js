const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const speciesDescriptions = {
  'Aasimar': 'Aasimars are mortals who carry a spark of the Upper Planes within their souls. Whether descended from a celestial being or infused with heavenly power, aasimars are meant to be champions of the good.',
  'Dragonborn': 'Dragonborn look very much like dragons standing erect in humanoid form, though they lack wings or a tail. Their draconic heritage is plainly visible, with scales, horns, and powerful builds that mark them as kin to dragons.',
  'Dwarf': 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. Though they stand well under 5 feet tall, dwarves are so broad and compact that they can weigh as much as a human standing nearly two feet taller.',
  'Elf': 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. They live in places of ethereal beauty, in the midst of ancient forests or in silvery spires glittering with faerie light.',
  'Gnome': 'A gnome\'s energy and enthusiasm for living shines through every inch of their tiny body. Gnomes average slightly over 3 feet tall and weigh 40 to 45 pounds. Their tan or brown faces are usually adorned with bright smiles.',
  'Goliath': 'Goliaths are towering giants who wander the peaks of the world, constantly challenging themselves against the elements and their own limits. Standing between 7 and 8 feet tall, they are formidable warriors and survivors.',
  'Halfling': 'Halflings are an affable and cheerful people who blend into the crowds of bigger folk and survive by avoiding notice or, barring that, avoiding offense. They are inclined to be stout, weighing between 40 and 45 pounds.',
  'Human': 'Humans are the most adaptable and ambitious people among the common species. Whatever drives them, humans are the innovators, the achievers, and the pioneers of the worlds they inhabit.',
  'Orc': 'Orcs are powerful, resilient warriors who have overcome a legacy of rage and savagery to find their own path. Modern orcs embrace their strength while also pursuing knowledge, faith, and honor in equal measure.',
  'Tiefling': 'To be greeted with stares and whispers, to suffer violence and insult on the street, to see mistrust and fear in every eye: this is the lot of the tiefling. Descended from an infernal bloodline, tieflings face prejudice but possess unique gifts.'
};

async function addSpeciesDescriptions() {
  console.log('Adding species descriptions...\n');

  try {
    // First, add the description column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE species
        ADD COLUMN IF NOT EXISTS description TEXT;
      `);
      console.log('✓ Added description column to species table\n');
    } catch (error) {
      console.log('Description column may already exist, continuing...\n');
    }

    // Update each species with its description
    for (const [name, description] of Object.entries(speciesDescriptions)) {
      try {
        const result = await prisma.species.updateMany({
          where: { name },
          data: { description }
        });

        if (result.count > 0) {
          console.log(`✓ Updated ${name}: "${description.substring(0, 60)}..."`);
        } else {
          console.log(`⚠ Species "${name}" not found in database`);
        }
      } catch (error) {
        console.error(`✗ Error updating ${name}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully updated ${Object.keys(speciesDescriptions).length} species descriptions!`);

    // Show current species with descriptions
    const species = await prisma.species.findMany({
      select: {
        name: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    console.log('\n📋 Current species in database:');
    species.forEach(s => {
      const hasDesc = s.description ? '✓' : '✗';
      console.log(`  ${hasDesc} ${s.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSpeciesDescriptions();
