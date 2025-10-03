import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Generate a random character using database content
router.post('/random', async (req: Request, res: Response) => {
  try {
    const { mode = 'random', indices } = req.body;

    // Get database counts for random selection
    const [spellCount, speciesCount, itemCount, classCount, backgroundCount, featCount] =
      await Promise.all([
        prisma.spell.count(),
        prisma.species.count(),
        prisma.item.count(),
        prisma.class.count(),
        prisma.background.count(),
        prisma.feat.count(),
      ]);

    // Generate or use provided indices
    const generatedIndices = mode === 'manual' && indices ? indices : {
      spellIndices: [
        Math.floor(Math.random() * spellCount) + 1,
        Math.floor(Math.random() * spellCount) + 1,
        Math.floor(Math.random() * spellCount) + 1,
      ],
      speciesIndex: Math.floor(Math.random() * speciesCount) + 1,
      itemIndices: [
        Math.floor(Math.random() * itemCount) + 1,
        Math.floor(Math.random() * itemCount) + 1,
        Math.floor(Math.random() * itemCount) + 1,
      ],
      classIndex: Math.floor(Math.random() * classCount) + 1,
      subclassIndex: Math.floor(Math.random() * 4) + 1,
      backgroundIndex: Math.floor(Math.random() * backgroundCount) + 1,
      featIndex: Math.floor(Math.random() * featCount) + 1,
    };

    // Fetch the selected content
    const [species, characterClass, background, feat, spells, items] = await Promise.all([
      prisma.species.findMany({
        orderBy: { name: 'asc' },
        skip: generatedIndices.speciesIndex - 1,
        take: 1,
      }),
      prisma.class.findMany({
        orderBy: { name: 'asc' },
        skip: generatedIndices.classIndex - 1,
        take: 1,
      }),
      prisma.background.findMany({
        orderBy: { name: 'asc' },
        skip: generatedIndices.backgroundIndex - 1,
        take: 1,
      }),
      prisma.feat.findMany({
        orderBy: { name: 'asc' },
        skip: generatedIndices.featIndex - 1,
        take: 1,
      }),
      Promise.all(
        generatedIndices.spellIndices.map((index: number) =>
          prisma.spell.findMany({
            orderBy: { name: 'asc' },
            skip: index - 1,
            take: 1,
          })
        )
      ),
      Promise.all(
        generatedIndices.itemIndices.map((index: number) =>
          prisma.item.findMany({
            orderBy: { name: 'asc' },
            skip: index - 1,
            take: 1,
          })
        )
      ),
    ]);

    // Generate random ability scores using 4d6 drop lowest
    const generateAbilityScores = () => {
      const scores = [];
      for (let i = 0; i < 6; i++) {
        const rolls = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ];
        // Take the highest 3 of 4 rolls
        rolls.sort((a, b) => b - a);
        const score = (rolls[0] || 6) + (rolls[1] || 6) + (rolls[2] || 6);
        scores.push(score);
      }
      return scores.sort((a, b) => b - a); // Sort highest to lowest
    };

    const abilityScores = generateAbilityScores();
    const level = Math.floor(Math.random() * 5) + 1; // Random level 1-5

    // Safely access data
    const speciesData = species[0];
    const classData = characterClass[0];
    const backgroundData = background[0];
    const featData = feat[0];

    // Calculate HP based on class and level
    const hitDie = classData?.hitDie || 8;
    const conMod = Math.floor(((abilityScores[2] || 10) - 10) / 2); // Assuming CON is 3rd highest
    const baseHP = hitDie + conMod;
    const hp = baseHP + ((level - 1) * (Math.floor(hitDie / 2) + 1 + conMod));

    // Generate character data matching CharacterSheetData interface
    const characterData = {
      name: generateRandomName(),
      background: backgroundData?.name || 'Folk Hero',
      class: classData?.name || 'Fighter',
      species: speciesData?.name || 'Human',
      subclass: extractSubclassName(classData, generatedIndices.subclassIndex),
      level: level,
      xp: calculateXPForLevel(level),
      abilityScores: {
        strength: abilityScores[0] || 10,
        dexterity: abilityScores[1] || 10,
        constitution: abilityScores[2] || 10,
        intelligence: abilityScores[3] || 10,
        wisdom: abilityScores[4] || 10,
        charisma: abilityScores[5] || 10,
      },
      proficiencyBonus: Math.ceil(level / 4) + 1,
      armorClass: 10 + Math.floor(((abilityScores[1] || 10) - 10) / 2), // Base AC + DEX mod
      initiative: Math.floor(((abilityScores[1] || 10) - 10) / 2),
      speed: (speciesData?.speed as number) || 30,
      size: (speciesData?.size as string) || 'Medium',
      passivePerception: 10 + Math.floor(((abilityScores[4] || 10) - 10) / 2),
      hitPoints: {
        current: hp,
        max: hp,
        temp: 0,
      },
      hitDice: {
        current: level,
        max: level,
        spent: 0,
      },
      deathSaves: {
        successes: 0,
        failures: 0,
      },
      heroicInspiration: false,
      skills: generateSkills(abilityScores, backgroundData, classData),
      savingThrows: generateSavingThrows(abilityScores, classData),
      classFeatures: extractClassFeatures(classData, level),
      speciesTraits: extractSpeciesTraits(speciesData),
      feats: featData?.name ? [featData.name] : [],
      weapons: generateWeapons(items.map(item => item[0]).filter(Boolean), abilityScores),
      proficiencies: {
        armor: extractProficiencies(classData, 'armor'),
        weapons: extractProficiencies(classData, 'weapons'),
        tools: extractProficiencies(backgroundData, 'tools'),
      },
    };

    // Validate character data has all required fields
    const requiredFields = ['name', 'background', 'class', 'species', 'level', 'abilityScores', 'hitPoints', 'skills', 'savingThrows'] as const;
    const missingFields = requiredFields.filter(field => {
      const value = characterData[field as keyof typeof characterData];
      return !value || value === '';
    });

    if (missingFields.length > 0) {
      console.warn('⚠️ Missing required fields:', missingFields);
    }

    // Debug log the character data
    console.log('🎲 Generated character for API response:');
    console.log('  Name:', characterData.name);
    console.log('  Species:', characterData.species);
    console.log('  Class:', characterData.class);
    console.log('  Level:', characterData.level);
    console.log('  Ability Scores:', characterData.abilityScores);

    // Include source data for reference
    const sourceData = {
      species: speciesData,
      class: classData,
      background: backgroundData,
      feat: featData,
      spells: spells.map(spell => spell[0]).filter(Boolean),
      items: items.map(item => item[0]).filter(Boolean),
      indices: generatedIndices,
      counts: { spellCount, speciesCount, itemCount, classCount, backgroundCount, featCount },
    };

    res.json({
      character: characterData,
      sources: sourceData,
      generated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating random character:', error);
    res.status(500).json({ error: 'Failed to generate random character' });
  }
});

// Helper functions
function generateRandomName(): string {
  const firstNames = [
    'Aeliana', 'Thorin', 'Lyralei', 'Grombrindal', 'Seraphina', 'Balgrim',
    'Caelynn', 'Dwalin', 'Elowen', 'Grimjaw', 'Isolde', 'Kazador',
    'Morgana', 'Norgrim', 'Ophelia', 'Throgg', 'Silviana', 'Uther',
    'Valeris', 'Wulfgar', 'Xara', 'Yorick', 'Zephyr', 'Aldric'
  ];

  const lastNames = [
    'Brightblade', 'Ironforge', 'Moonwhisper', 'Stormhammer', 'Shadowmere',
    'Goldbeard', 'Starweaver', 'Axebreaker', 'Nightfall', 'Forgeheart',
    'Silverleaf', 'Thunderstrike', 'Dawnbringer', 'Ironshield', 'Frostborn',
    'Dragonsbane', 'Lightbringer', 'Darkstone', 'Flameheart', 'Windwalker'
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

function extractSubclassName(classData: any, subclassIndex: number): string {
  if (!classData?.subclassFeatures) {
    return '';
  }

  try {
    if (Array.isArray(classData.subclassFeatures) && classData.subclassFeatures[subclassIndex - 1]) {
      const subclass = classData.subclassFeatures[subclassIndex - 1];
      if (typeof subclass === 'object' && subclass.name) {
        return subclass.name;
      }
    }
  } catch (e) {
    console.warn('Error extracting subclass name:', e);
  }

  return classData?.name ? `${classData.name} Subclass` : '';
}

function calculateXPForLevel(level: number): number {
  const xpTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];
  return xpTable[Math.min(level, 9)] || 0;
}

function generateSkills(abilityScores: number[], background: any, classData: any): any {
  const skills: any = {};
  const skillList = [
    'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
    'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
    'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
    'Sleight of Hand', 'Stealth', 'Survival'
  ];

  const skillToAbility: { [key: string]: number } = {
    'Acrobatics': 1, 'Animal Handling': 4, 'Arcana': 3, 'Athletics': 0,
    'Deception': 5, 'History': 3, 'Insight': 4, 'Intimidation': 5,
    'Investigation': 3, 'Medicine': 4, 'Nature': 3, 'Perception': 4,
    'Performance': 5, 'Persuasion': 5, 'Religion': 3, 'Sleight of Hand': 1,
    'Stealth': 1, 'Survival': 4
  };

  const proficiencyBonus = Math.ceil(abilityScores.length / 24) + 1; // Rough calculation

  skillList.forEach(skill => {
    const abilityIndex = skillToAbility[skill];
    if (abilityIndex !== undefined) {
      const abilityModifier = Math.floor(((abilityScores[abilityIndex] || 10) - 10) / 2);
      const proficient = Math.random() < 0.3; // 30% chance of proficiency

      skills[skill] = {
        proficient,
        modifier: proficient ? abilityModifier + proficiencyBonus : abilityModifier,
      };
    }
  });

  return skills;
}

function generateSavingThrows(abilityScores: number[], classData: any): any {
  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  const savingThrows: any = {};
  const proficiencyBonus = 2; // Standard for low levels

  abilities.forEach((ability, index) => {
    const abilityModifier = Math.floor(((abilityScores[index] || 10) - 10) / 2);
    const proficient = classData?.savingThrowProficiencies?.includes(ability) || false;

    savingThrows[ability] = {
      proficient,
      modifier: proficient ? abilityModifier + proficiencyBonus : abilityModifier,
    };
  });

  return savingThrows;
}

function extractClassFeatures(classData: any, level: number): string[] {
  if (!classData) return [];

  const features = [];

  // Add basic class info
  if (classData.name) {
    features.push(`${classData.name} (d${classData.hitDie} Hit Die)`);
  }

  // Add primary abilities
  if (classData.primaryAbility && Array.isArray(classData.primaryAbility)) {
    features.push(`Primary Abilities: ${classData.primaryAbility.join(', ').toUpperCase()}`);
  }

  // Add saving throw proficiencies
  if (classData.savingThrowProficiencies && Array.isArray(classData.savingThrowProficiencies)) {
    features.push(`Saving Throws: ${classData.savingThrowProficiencies.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`);
  }

  // Try to extract actual class features
  try {
    if (classData.classFeatures) {
      if (Array.isArray(classData.classFeatures)) {
        features.push(...classData.classFeatures.slice(0, Math.min(level + 2, 5)));
      } else if (typeof classData.classFeatures === 'object') {
        // Handle level-based features
        for (let i = 1; i <= Math.min(level, 5); i++) {
          if (classData.classFeatures[i]) {
            features.push(`Level ${i} Features`);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error extracting detailed class features:', e);
  }

  // Add some common low-level features based on class
  const className = classData?.name?.toLowerCase();
  if (className === 'fighter') {
    features.push('Fighting Style', 'Second Wind');
    if (level >= 2) features.push('Action Surge');
  } else if (className === 'wizard') {
    features.push('Spellcasting', 'Arcane Recovery');
  } else if (className === 'rogue') {
    features.push('Expertise', 'Sneak Attack', 'Thieves\' Cant');
  } else if (className === 'ranger') {
    features.push('Favored Enemy', 'Natural Explorer');
    if (level >= 2) features.push('Fighting Style', 'Spellcasting');
  } else if (className === 'paladin') {
    features.push('Divine Sense', 'Lay on Hands');
    if (level >= 2) features.push('Fighting Style', 'Spellcasting', 'Divine Smite');
  }

  return features.slice(0, 8); // Limit to reasonable number
}

function extractSpeciesTraits(speciesData: any): string[] {
  if (!speciesData) return [];

  const traits = [];

  // Add basic species info
  if (speciesData.name) {
    traits.push(`${speciesData.name} (${speciesData.size || 'Medium'} size, ${speciesData.speed || 30}ft speed)`);
  }

  // Add languages
  if (speciesData.languages && Array.isArray(speciesData.languages)) {
    traits.push(`Languages: ${speciesData.languages.join(', ')}`);
  }

  // Extract traits
  try {
    if (speciesData.traits) {
      if (Array.isArray(speciesData.traits)) {
        const traitNames = speciesData.traits.map((trait: any) => {
          if (typeof trait === 'string') return trait;
          if (trait.name) return trait.name;
          return 'Species Trait';
        }).slice(0, 4);
        traits.push(...traitNames);
      } else if (typeof speciesData.traits === 'object') {
        // Handle object-based traits
        Object.keys(speciesData.traits).slice(0, 4).forEach(key => {
          traits.push(key.charAt(0).toUpperCase() + key.slice(1));
        });
      }
    }
  } catch (e) {
    console.warn('Error extracting species traits:', e);
  }

  // Add species-specific traits based on name
  const speciesName = speciesData?.name?.toLowerCase();
  if (speciesName === 'human') {
    traits.push('Versatile', 'Extra Skill');
  } else if (speciesName === 'elf') {
    traits.push('Darkvision', 'Fey Ancestry', 'Keen Senses', 'Trance');
  } else if (speciesName === 'dwarf') {
    traits.push('Darkvision', 'Dwarven Resilience', 'Stonecunning');
  } else if (speciesName === 'halfling') {
    traits.push('Lucky', 'Brave', 'Halfling Nimbleness');
  } else if (speciesName === 'dragonborn') {
    traits.push('Draconic Ancestry', 'Breath Weapon', 'Damage Resistance');
  }

  return traits.slice(0, 6); // Reasonable number of traits
}

function extractProficiencies(data: any, type: string): string[] {
  if (!data) return [];

  try {
    // For classes (armor/weapon proficiencies)
    if (data.name && type === 'armor') {
      const className = data.name.toLowerCase();
      if (className === 'fighter' || className === 'paladin') {
        return ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'];
      } else if (className === 'ranger' || className === 'barbarian') {
        return ['Light Armor', 'Medium Armor', 'Shields'];
      } else if (className === 'rogue') {
        return ['Light Armor'];
      } else if (className === 'wizard' || className === 'sorcerer') {
        return [];
      }
      return ['Light Armor'];
    }

    if (data.name && type === 'weapons') {
      const className = data.name.toLowerCase();
      if (className === 'fighter' || className === 'paladin' || className === 'ranger') {
        return ['Simple Weapons', 'Martial Weapons'];
      } else if (className === 'rogue') {
        return ['Simple Weapons', 'Hand Crossbows', 'Longswords', 'Rapiers', 'Shortswords'];
      } else if (className === 'wizard') {
        return ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light Crossbows'];
      } else if (className === 'cleric') {
        return ['Simple Weapons'];
      }
      return ['Simple Weapons'];
    }

    // For backgrounds (tools)
    if (type === 'tools' && data.name) {
      const backgroundName = data.name.toLowerCase();
      if (backgroundName === 'criminal') {
        return ['Thieves\' Tools', 'Gaming Set'];
      } else if (backgroundName === 'farmer') {
        return ['Carpenter\'s Tools', 'Vehicles (Land)'];
      } else if (backgroundName === 'guild artisan') {
        return ['Artisan\'s Tools', 'Navigator\'s Tools'];
      }
      return ['Background Tools'];
    }

    // Fallback to original logic
    if (type === 'armor' && data.armorProficiencies) {
      return Array.isArray(data.armorProficiencies) ? data.armorProficiencies : [];
    }
    if (type === 'weapons' && data.weaponProficiencies) {
      return Array.isArray(data.weaponProficiencies) ? data.weaponProficiencies : [];
    }
  } catch (e) {
    console.warn('Error extracting proficiencies:', e);
  }

  return [];
}

function generateWeapons(items: any[], abilityScores: number[]): any[] {
  const weapons = items.filter(item =>
    item?.type?.toLowerCase().includes('weapon') ||
    item?.dmg1
  ).slice(0, 3);

  const strMod = Math.floor(((abilityScores[0] || 10) - 10) / 2);
  const dexMod = Math.floor(((abilityScores[1] || 10) - 10) / 2);
  const proficiencyBonus = 2;

  if (weapons.length === 0) {
    // Default weapons if none found
    return [
      {
        name: 'Longsword',
        atkBonus: `+${strMod + proficiencyBonus}`,
        damage: `1d8+${strMod} slashing`,
        notes: 'Versatile'
      },
      {
        name: 'Shield',
        atkBonus: `+${strMod + proficiencyBonus}`,
        damage: `1d4+${strMod} bludgeoning`,
        notes: '+2 AC'
      },
      { name: '', atkBonus: '', damage: '', notes: '' }
    ];
  }

  return weapons.map(weapon => ({
    name: weapon.name,
    atkBonus: `+${strMod + proficiencyBonus}`,
    damage: weapon.dmg1 ? `${weapon.dmg1} ${weapon.dmgType || 'damage'}` : '1d6',
    notes: weapon.property?.join(', ') || ''
  }));
}

export default router;
