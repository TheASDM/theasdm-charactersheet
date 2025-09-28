import { CharacterSheetData } from '../types/characterSheet';
import { calculateModifier, calculateProficiencyBonus, calculateSkillModifier, skillToAbility } from '../types/characterSheet';
import { getCharacterResources } from '../utils/resourceDetection';
import { EquipmentValidator } from '../utils/equipmentValidator';

/**
 * Calculate all derived character values
 */
export function calculateDerivedValues(character: CharacterSheetData) {
  const proficiencyBonus = calculateProficiencyBonus(character.level);

  const abilityModifiers = {
    strength: calculateModifier(character.abilityScores.strength),
    dexterity: calculateModifier(character.abilityScores.dexterity),
    constitution: calculateModifier(character.abilityScores.constitution),
    intelligence: calculateModifier(character.abilityScores.intelligence),
    wisdom: calculateModifier(character.abilityScores.wisdom),
    charisma: calculateModifier(character.abilityScores.charisma),
  };

  const savingThrows = {
    strength: abilityModifiers.strength +
      (character.proficiencies?.savingThrows?.includes('Strength') ? proficiencyBonus : 0),
    dexterity: abilityModifiers.dexterity +
      (character.proficiencies?.savingThrows?.includes('Dexterity') ? proficiencyBonus : 0),
    constitution: abilityModifiers.constitution +
      (character.proficiencies?.savingThrows?.includes('Constitution') ? proficiencyBonus : 0),
    intelligence: abilityModifiers.intelligence +
      (character.proficiencies?.savingThrows?.includes('Intelligence') ? proficiencyBonus : 0),
    wisdom: abilityModifiers.wisdom +
      (character.proficiencies?.savingThrows?.includes('Wisdom') ? proficiencyBonus : 0),
    charisma: abilityModifiers.charisma +
      (character.proficiencies?.savingThrows?.includes('Charisma') ? proficiencyBonus : 0),
  };

  // Calculate AC using equipped items (this ensures AC is always recalculated when derived values are computed)
  const armorClass = EquipmentValidator.calculateArmorClass(character);

  const initiative = abilityModifiers.dexterity;
  const isPerceptionProficient = character.proficiencies?.skills?.includes('Perception') || false;
  const passivePerception = 10 + calculateSkillModifier(
    character.abilityScores.wisdom,
    proficiencyBonus,
    isPerceptionProficient
  );

  return {
    proficiencyBonus,
    abilityModifiers,
    savingThrows,
    armorClass,
    initiative,
    passivePerception
  };
}

/**
 * Get skill modifiers for all skills
 */
export function getSkillModifiers(
  character: CharacterSheetData,
  proficiencyBonus: number
) {
  const skills = [
    'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
    'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
    'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
    'Sleight of Hand', 'Stealth', 'Survival'
  ];

  return skills.reduce((acc, skill) => {
    const abilityKey = skillToAbility[skill];
    const abilityScore = character.abilityScores[abilityKey];
    const isProficient = character.proficiencies?.skills?.includes(skill) || false;

    acc[skill] = calculateSkillModifier(
      abilityScore,
      proficiencyBonus,
      isProficient
    );
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Calculate max HP based on class and constitution
 */
export function calculateMaxHP(
  character: CharacterSheetData,
  constitutionModifier: number
): number {
  // Base HP calculation (simplified - should use class hit dice)
  const classHitDice: Record<string, number> = {
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

  const hitDie = classHitDice[character.class] || 8;
  const level1HP = hitDie + constitutionModifier;
  const additionalHP = (character.level - 1) * (Math.floor(hitDie / 2) + 1 + constitutionModifier);

  return level1HP + additionalHP;
}

/**
 * Get spell save DC and spell attack bonus
 */
export function getSpellcastingStats(
  character: CharacterSheetData,
  proficiencyBonus: number,
  abilityModifiers: Record<string, number>
) {
  // Determine spellcasting ability based on class
  const spellcastingAbility: Record<string, keyof typeof abilityModifiers> = {
    'Bard': 'charisma',
    'Cleric': 'wisdom',
    'Druid': 'wisdom',
    'Paladin': 'charisma',
    'Ranger': 'wisdom',
    'Sorcerer': 'charisma',
    'Warlock': 'charisma',
    'Wizard': 'intelligence',
  };

  const ability = spellcastingAbility[character.class];

  if (!ability) {
    return { spellSaveDC: 8, spellAttackBonus: 0 };
  }

  const abilityMod = abilityModifiers[ability];
  return {
    spellSaveDC: 8 + proficiencyBonus + abilityMod,
    spellAttackBonus: proficiencyBonus + abilityMod
  };
}

/**
 * Format a modifier for display (e.g., "+2" or "-1")
 */
export function formatModifierDisplay(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/**
 * Get proficiency bonus display
 */
export function getProficiencyBonusDisplay(level: number): string {
  return `+${calculateProficiencyBonus(level)}`;
}

/**
 * Calculate spell slots based on class and level
 */
export function calculateSpellSlots(character: CharacterSheetData): Record<string, number> {
  // Simplified spell slot calculation
  // In a real implementation, this would use the full spell slot progression tables
  const fullCasters = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'];
  const halfCasters = ['Paladin', 'Ranger'];

  if (fullCasters.includes(character.class)) {
    // Full caster progression (simplified)
    const slots: Record<string, number> = {};
    if (character.level >= 1) slots['1st'] = Math.min(4, 1 + Math.floor(character.level / 2));
    if (character.level >= 3) slots['2nd'] = Math.min(3, Math.floor((character.level - 2) / 2));
    if (character.level >= 5) slots['3rd'] = Math.min(3, Math.floor((character.level - 4) / 2));
    if (character.level >= 7) slots['4th'] = Math.min(3, Math.floor((character.level - 6) / 3));
    if (character.level >= 9) slots['5th'] = Math.min(2, Math.floor((character.level - 8) / 4));
    if (character.level >= 11) slots['6th'] = 1;
    if (character.level >= 13) slots['7th'] = 1;
    if (character.level >= 15) slots['8th'] = 1;
    if (character.level >= 17) slots['9th'] = 1;
    return slots;
  } else if (halfCasters.includes(character.class)) {
    // Half caster progression (simplified)
    const slots: Record<string, number> = {};
    if (character.level >= 2) slots['1st'] = Math.min(4, Math.floor(character.level / 2));
    if (character.level >= 5) slots['2nd'] = Math.min(3, Math.floor((character.level - 4) / 3));
    if (character.level >= 9) slots['3rd'] = Math.min(3, Math.floor((character.level - 8) / 4));
    if (character.level >= 13) slots['4th'] = Math.min(3, Math.floor((character.level - 12) / 5));
    if (character.level >= 17) slots['5th'] = Math.min(2, Math.floor((character.level - 16) / 6));
    return slots;
  }

  return {};
}

/**
 * Calculate movement speed based on species and other factors
 */
export function calculateSpeed(character: CharacterSheetData): number {
  // Base speeds by species (in feet)
  const baseSpeed: Record<string, number> = {
    'Dwarf': 25,
    'Elf': 30,
    'Halfling': 25,
    'Human': 30,
    'Dragonborn': 30,
    'Gnome': 25,
    'Half-Elf': 30,
    'Half-Orc': 30,
    'Tiefling': 30,
    'Aasimar': 30,
    'Goliath': 30,
    'Orc': 30,
  };

  return baseSpeed[character.species] || 30;
}

/**
 * Get hit dice string (e.g., "5d10")
 */
export function getHitDiceString(character: CharacterSheetData): string {
  const classHitDice: Record<string, number> = {
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

  const hitDie = classHitDice[character.class] || 8;
  return `${character.level}d${hitDie}`;
}

/**
 * Check if a character has a specific proficiency
 */
export function hasProficiency(
  character: CharacterSheetData,
  type: 'armor' | 'weapons' | 'tools' | 'skills' | 'savingThrows',
  item: string
): boolean {
  const proficiencies = character.proficiencies?.[type] || [];
  return proficiencies.includes(item);
}

/**
 * Get all active resources for the character
 */
export function getActiveResources(character: CharacterSheetData) {
  return getCharacterResources(character);
}