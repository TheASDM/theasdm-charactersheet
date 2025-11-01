const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportCharacter(characterId) {
  try {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    if (!character) {
      console.log('Character not found');
      return;
    }

    // Pretty print the full character data
    const output = JSON.stringify(character, null, 2);
    
    // Save to file
    const filename = `character-${character.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    fs.writeFileSync(filename, output);
    
    console.log(`Character exported to: ${filename}`);
    console.log('\n=== CHARACTER DATA ===\n');
    console.log(output);
  } catch (error) {
    console.error('Error exporting character:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get character ID from command line or use the first character
const characterId = process.argv[2];

if (characterId) {
  exportCharacter(parseInt(characterId));
} else {
  // Export the first character if no ID provided
  prisma.character.findFirst()
    .then(char => {
      if (char) {
        console.log(`No ID provided, exporting first character: ${char.name} (ID: ${char.id})`);
        return exportCharacter(char.id);
      } else {
        console.log('No characters found in database');
      }
    });
}
