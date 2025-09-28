import { CharacterBuilderData } from '../components/CharacterGeneratorWizard';
import { CharacterSheetData, calculateProficiencyBonus, calculateModifier } from '../types/characterSheet';

/**
 * Maps CharacterBuilderData from the generator to CharacterSheetData for the character sheet
 */
export function mapGeneratorDataToCharacterSheet(builderData: CharacterBuilderData): CharacterSheetData {
  // Calculate final ability scores (base + background bonuses)
  const finalAbilityScores = calculateFinalAbilityScores(builderData);

  // Calculate derived stats
  const proficiencyBonus = calculateProficiencyBonus(1); // Level 1 characters
  const constitutionModifier = calculateModifier(finalAbilityScores.constitution);
  const dexterityModifier = calculateModifier(finalAbilityScores.dexterity);
  const wisdomModifier = calculateModifier(finalAbilityScores.wisdom);

  // Calculate hit points based on class hit dice + con modifier
  const classHitDie = getClassHitDie(builderData.selectedClass);
  const baseHitPoints = classHitDie + constitutionModifier;
  const hitPoints = Math.max(1, baseHitPoints); // Minimum 1 HP

  // Map skills from class and background proficiencies
  const skills = mapSkillProficiencies(builderData, finalAbilityScores, proficiencyBonus);

  // Map saving throws from class proficiencies
  const savingThrows = mapSavingThrows(builderData, finalAbilityScores, proficiencyBonus);

  // Combine all equipment sources
  const equipment = combineEquipment(builderData);
  const inventory = equipment.map(item => ({ name: item, quantity: 1 }));

  // Extract weapons from equipment and map to weapon actions
  const weapons = mapEquipmentToWeapons(equipment, finalAbilityScores, proficiencyBonus, builderData);
  const weaponActions = mapWeaponsToActions(weapons);

  // Debug logging
  console.log('🔍 Equipment list:', equipment);
  console.log('⚔️ Mapped weapons:', weapons);
  console.log('🎯 Weapon actions:', weaponActions);

  // Extract features and traits
  const classFeatures = extractClassFeatures(builderData);
  const speciesTraits = extractSpeciesTraits(builderData);
  const feats = builderData.selectedOriginFeats || [];

  // Map all proficiencies
  const proficiencies = {
    armor: builderData.classProficiencies?.armor || [],
    weapons: builderData.classProficiencies?.weapons || [],
    tools: builderData.classProficiencies?.tools || [],
    skills: [
      ...(builderData.selectedClassSkills || []),
      ...(builderData.backgroundSkillProficiencies || [])
    ],
    savingThrows: builderData.classProficiencies?.savingThrows || []
  };

  // Calculate AC (base 10 + Dex modifier, assuming no armor initially)
  const armorClass = 10 + dexterityModifier;

  // Calculate initiative
  const initiative = dexterityModifier;

  // Calculate passive perception
  const perceptionModifier = skills['Perception']?.modifier || wisdomModifier;
  const passivePerception = 10 + perceptionModifier;

  // Get species size and speed
  const size = builderData.speciesSize || 'Medium';
  const speed = builderData.speciesSpeed || 30;

  return {
    name: builderData.characterName || 'Unnamed Character',
    background: builderData.selectedBackground || '',
    class: builderData.selectedClass || '',
    species: builderData.selectedSpecies || '',
    subclass: '', // Subclass comes at level 3
    level: 1,
    xp: 0,
    abilityScores: finalAbilityScores,
    proficiencyBonus,
    armorClass,
    initiative,
    speed,
    size,
    passivePerception,
    hitPoints: {
      current: hitPoints,
      max: hitPoints,
      temp: 0,
    },
    hitDice: {
      current: 1,
      max: 1,
      spent: 0,
    },
    deathSaves: {
      successes: 0,
      failures: 0,
    },
    heroicInspiration: false,
    wounds: 0,
    mana: {
      current: 0,
      max: 0,
    },
    resources: {},
    inventory,
    equipment,
    skills,
    savingThrows,
    classFeatures,
    speciesTraits,
    feats,
    weapons,
    actions: (() => {
      const actions = [
        { name: 'Dash', atkBonus: '—', damage: 'Move Speed × 2' },
        { name: 'Dodge', atkBonus: '—', damage: '—' },
        { name: 'Help', atkBonus: '—', damage: '—' },
        ...weaponActions,
        ...Array(Math.max(0, 5 - weaponActions.length)).fill({ name: '', atkBonus: '', damage: '' }),
      ];
      console.log('🎬 Final actions array:', actions);
      return actions;
    })(),
    proficiencies,
  };
}

/**
 * Calculate final ability scores including background bonuses
 */
function calculateFinalAbilityScores(builderData: CharacterBuilderData) {
  const base = builderData.abilityScores;
  const bonuses = builderData.backgroundAbilityScoreAllocations || {};

  return {
    strength: base.strength + (bonuses.strength || bonuses.str || 0),
    dexterity: base.dexterity + (bonuses.dexterity || bonuses.dex || 0),
    constitution: base.constitution + (bonuses.constitution || bonuses.con || 0),
    intelligence: base.intelligence + (bonuses.intelligence || bonuses.int || 0),
    wisdom: base.wisdom + (bonuses.wisdom || bonuses.wis || 0),
    charisma: base.charisma + (bonuses.charisma || bonuses.cha || 0),
  };
}

/**
 * Get class hit die value
 */
function getClassHitDie(className: string): number {
  const hitDiceMap: { [key: string]: number } = {
    'Barbarian': 12,
    'Fighter': 10,
    'Paladin': 10,
    'Ranger': 10,
    'Bard': 8,
    'Cleric': 8,
    'Druid': 8,
    'Monk': 8,
    'Rogue': 8,
    'Warlock': 8,
    'Sorcerer': 6,
    'Wizard': 6,
  };

  return hitDiceMap[className] || 8; // Default to d8
}

/**
 * Map skill proficiencies and calculate modifiers
 */
function mapSkillProficiencies(builderData: CharacterBuilderData, abilityScores: any, proficiencyBonus: number) {
  const skillToAbility: { [key: string]: keyof typeof abilityScores } = {
    'Acrobatics': 'dexterity',
    'Animal Handling': 'wisdom',
    'Arcana': 'intelligence',
    'Athletics': 'strength',
    'Deception': 'charisma',
    'History': 'intelligence',
    'Insight': 'wisdom',
    'Intimidation': 'charisma',
    'Investigation': 'intelligence',
    'Medicine': 'wisdom',
    'Nature': 'intelligence',
    'Perception': 'wisdom',
    'Performance': 'charisma',
    'Persuasion': 'charisma',
    'Religion': 'intelligence',
    'Sleight of Hand': 'dexterity',
    'Stealth': 'dexterity',
    'Survival': 'wisdom',
  };

  const allProficientSkills = [
    ...(builderData.selectedClassSkills || []),
    ...(builderData.backgroundSkillProficiencies || [])
  ];

  const skills: { [key: string]: { proficient: boolean; modifier: number } } = {};

  Object.entries(skillToAbility).forEach(([skill, ability]) => {
    const isProficient = allProficientSkills.includes(skill);
    const abilityModifier = calculateModifier(abilityScores[ability]);
    const modifier = isProficient ? abilityModifier + proficiencyBonus : abilityModifier;

    skills[skill] = {
      proficient: isProficient,
      modifier: modifier,
    };
  });

  return skills;
}

/**
 * Map saving throw proficiencies and calculate modifiers
 */
function mapSavingThrows(builderData: CharacterBuilderData, abilityScores: any, proficiencyBonus: number) {
  const savingThrows: { [key: string]: { proficient: boolean; modifier: number } } = {};
  const proficientSaves = builderData.classProficiencies?.savingThrows || [];

  Object.entries(abilityScores).forEach(([ability, score]) => {
    const isProficient = proficientSaves.includes(ability);
    const abilityModifier = calculateModifier(score as number);
    const modifier = isProficient ? abilityModifier + proficiencyBonus : abilityModifier;

    savingThrows[ability] = {
      proficient: isProficient,
      modifier: modifier,
    };
  });

  return savingThrows;
}

/**
 * Combine equipment from all sources
 */
function combineEquipment(builderData: CharacterBuilderData): string[] {
  const equipment: string[] = [];

  // Class starting equipment
  if (builderData.classStartingEquipment) {
    equipment.push(...builderData.classStartingEquipment);
  }

  // Background starting equipment
  if (builderData.backgroundStartingEquipment) {
    equipment.push(...builderData.backgroundStartingEquipment);
  }

  // Selected equipment from step 4
  if (builderData.selectedEquipment) {
    if (builderData.selectedEquipment.armor) {
      equipment.push(builderData.selectedEquipment.armor);
    }
    if (builderData.selectedEquipment.weapons) {
      equipment.push(...builderData.selectedEquipment.weapons);
    }
    if (builderData.selectedEquipment.shield) {
      equipment.push(builderData.selectedEquipment.shield);
    }
    if (builderData.selectedEquipment.equipment) {
      equipment.push(...builderData.selectedEquipment.equipment);
    }
  }

  return equipment;
}

/**
 * Extract class features as string array
 */
function extractClassFeatures(builderData: CharacterBuilderData): string[] {
  const features: string[] = [];

  if (builderData.classFeatures) {
    builderData.classFeatures.forEach((feature: any) => {
      if (typeof feature === 'string') {
        features.push(feature);
      } else if (feature.name) {
        features.push(feature.name);
      }
    });
  }

  return features;
}

/**
 * Extract species traits as string array
 */
function extractSpeciesTraits(builderData: CharacterBuilderData): string[] {
  const traits: string[] = [];

  if (builderData.speciesTraits) {
    builderData.speciesTraits.forEach((trait: any) => {
      if (typeof trait === 'string') {
        traits.push(trait);
      } else if (trait.name) {
        traits.push(trait.name);
      }
    });
  }

  return traits;
}

/**
 * Map equipment to weapons with stats
 */
function mapEquipmentToWeapons(equipment: string[], abilityScores: any, proficiencyBonus: number, builderData: CharacterBuilderData) {
  const weapons = [];
  const weaponProficiencies = builderData.classProficiencies?.weapons || [];

  console.log('🔧 Weapon proficiencies:', weaponProficiencies);

  // Common weapon data - simplified mapping
  const weaponData: { [key: string]: { damage: string; properties: string[]; ability: 'strength' | 'dexterity' } } = {
    'Dagger': { damage: '1d4', properties: ['finesse', 'light', 'thrown'], ability: 'dexterity' },
    'Shortsword': { damage: '1d6', properties: ['finesse', 'light'], ability: 'dexterity' },
    'Longsword': { damage: '1d8', properties: ['versatile'], ability: 'strength' },
    'Rapier': { damage: '1d8', properties: ['finesse'], ability: 'dexterity' },
    'Scimitar': { damage: '1d6', properties: ['finesse', 'light'], ability: 'dexterity' },
    'Handaxe': { damage: '1d6', properties: ['light', 'thrown'], ability: 'strength' },
    'Javelin': { damage: '1d6', properties: ['thrown'], ability: 'strength' },
    'Spear': { damage: '1d6', properties: ['thrown', 'versatile'], ability: 'strength' },
    'Mace': { damage: '1d6', properties: [], ability: 'strength' },
    'Club': { damage: '1d4', properties: ['light'], ability: 'strength' },
    'Greataxe': { damage: '1d12', properties: ['heavy', 'two-handed'], ability: 'strength' },
    'Greatsword': { damage: '2d6', properties: ['heavy', 'two-handed'], ability: 'strength' },
    'Maul': { damage: '2d6', properties: ['heavy', 'two-handed'], ability: 'strength' },
    'Light Crossbow': { damage: '1d8', properties: ['ammunition', 'loading', 'two-handed'], ability: 'dexterity' },
    'Heavy Crossbow': { damage: '1d10', properties: ['ammunition', 'heavy', 'loading', 'two-handed'], ability: 'dexterity' },
    'Shortbow': { damage: '1d6', properties: ['ammunition', 'two-handed'], ability: 'dexterity' },
    'Longbow': { damage: '1d8', properties: ['ammunition', 'heavy', 'two-handed'], ability: 'dexterity' },
  };

  equipment.forEach(item => {
    console.log('🔍 Checking equipment item:', item);
    const weaponName = Object.keys(weaponData).find(weapon =>
      item.toLowerCase().includes(weapon.toLowerCase())
    );

    console.log('🗡️ Found weapon match:', weaponName, 'for item:', item);

    if (weaponName) {
      const weapon = weaponData[weaponName];
      const ability = weapon.ability;
      const abilityModifier = calculateModifier(abilityScores[ability]);

      // Check if proficient with this weapon
      const isProficient = weaponProficiencies.some(prof =>
        prof.toLowerCase().includes(weaponName.toLowerCase()) ||
        (weapon.properties.includes('simple') && prof.toLowerCase().includes('simple')) ||
        (prof.toLowerCase().includes('martial') && !weapon.properties.includes('simple'))
      );

      const attackBonus = abilityModifier + (isProficient ? proficiencyBonus : 0);
      const damageBonus = abilityModifier;

      weapons.push({
        name: weaponName,
        atkBonus: attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`,
        damage: `${weapon.damage}${damageBonus >= 0 ? '+' + damageBonus : damageBonus}`,
        notes: weapon.properties.join(', ')
      });
    }
  });

  // Fill remaining slots with empty weapons
  while (weapons.length < 3) {
    weapons.push({ name: '', atkBonus: '', damage: '', notes: '' });
  }

  return weapons.slice(0, 3); // Limit to 3 weapons
}

/**
 * Convert weapons to action format
 */
function mapWeaponsToActions(weapons: any[]) {
  return weapons
    .filter(weapon => weapon.name) // Only weapons with names
    .map(weapon => ({
      name: weapon.name,
      atkBonus: weapon.atkBonus,
      damage: weapon.damage
    }));
}