import { CharacterSheetData, AbilityScoreName, CharacterAction, ActionDamageDefinition, ActionHealingDefinition } from '../types/characterSheet';
import { calculateModifier, formatModifier } from '../types/characterSheet';

export const SPELLCASTING_ABILITY_MAP: Record<string, AbilityScoreName> = {
  Bard: 'charisma',
  Cleric: 'wisdom',
  Druid: 'wisdom',
  Paladin: 'charisma',
  Ranger: 'wisdom',
  Sorcerer: 'charisma',
  Warlock: 'charisma',
  Wizard: 'intelligence',
  Artificer: 'intelligence',
};

const ABILITY_LABELS: Record<AbilityScoreName, string> = {
  strength: 'Str',
  dexterity: 'Dex',
  constitution: 'Con',
  intelligence: 'Int',
  wisdom: 'Wis',
  charisma: 'Cha',
};

export interface AttackComputationOptions {
  includeProficiency?: boolean;
  bonus?: number;
  overrideAbility?: AbilityScoreName | null;
}

export const resolveSpellcastingAbility = (character: CharacterSheetData): AbilityScoreName | null => {
  const mapped = SPELLCASTING_ABILITY_MAP[character.class as keyof typeof SPELLCASTING_ABILITY_MAP];
  return mapped ?? null;
};

export const getAbilityModifier = (
  character: CharacterSheetData,
  ability: AbilityScoreName | 'spellcasting' | null | undefined
): number => {
  if (!ability) return 0;
  if (ability === 'spellcasting') {
    const spellAbility = resolveSpellcastingAbility(character);
    return spellAbility ? calculateModifier(character.abilityScores[spellAbility]) : 0;
  }
  return calculateModifier(character.abilityScores[ability]);
};

export const formatAbilityLabel = (ability: AbilityScoreName | 'spellcasting' | null | undefined): string | null => {
  if (!ability) return null;
  if (ability === 'spellcasting') {
    return 'Spellcasting';
  }
  return ABILITY_LABELS[ability] ?? ability;
};

export const computeAttackBonus = (
  character: CharacterSheetData,
  options: AttackComputationOptions = {}
): number => {
  const abilityMod = getAbilityModifier(character, options.overrideAbility ?? 'spellcasting');
  const base = abilityMod + (options.includeProficiency ? character.proficiencyBonus : 0);
  return base + (options.bonus ?? 0);
};

export interface DerivedAttackInfo {
  label: string;
  numericBonus: number;
}

export const deriveAttackLabel = (
  character: CharacterSheetData,
  ability: AbilityScoreName | 'spellcasting' | undefined,
  proficient: boolean | undefined,
  bonus?: number,
  overrideLabel?: string
): DerivedAttackInfo => {
  if (overrideLabel) {
    return { label: overrideLabel, numericBonus: 0 };
  }

  const modifier = getAbilityModifier(character, ability ?? 'spellcasting');
  const total = modifier + (proficient ? character.proficiencyBonus : 0) + (bonus ?? 0);
  return {
    label: total === 0 ? '+0' : formatModifier(total),
    numericBonus: total,
  };
};

interface ScalingNoteResult {
  dice: string | undefined;
  note?: string;
}

const pickCantripScalingDice = (scaling: Record<number, string>, characterLevel: number): ScalingNoteResult => {
  const levels = Object.keys(scaling)
    .map((key) => Number(key))
    .filter((level) => !Number.isNaN(level))
    .sort((a, b) => b - a);

  for (const level of levels) {
    if (characterLevel >= level) {
      return { dice: scaling[level] };
    }
  }

  const first = scaling[levels[levels.length - 1]];
  return { dice: first };
};

export const buildDamageString = (
  character: CharacterSheetData,
  damage: ActionDamageDefinition | undefined
): ScalingNoteResult => {
  if (!damage) {
    return { dice: undefined };
  }

  let expression = damage.dice ?? '';

  if (damage.scaling && damage.scaling.type === 'cantrip' && damage.scaling.progression) {
    const scaled = pickCantripScalingDice(damage.scaling.progression, character.level);
    expression = scaled.dice ?? expression;
  }

  if (damage.alternateDice && damage.note) {
    // Alternate dice typically mean versatile or similar. Keep base dice but append note later.
  }

  const abilityMod = damage.abilityMod
    ? getAbilityModifier(character, damage.ability ?? 'spellcasting')
    : 0;

  const bonusFromItem = damage.bonus ?? 0;
  let aggregateBonus = 0;

  if (damage.abilityMod && abilityMod !== 0) {
    aggregateBonus += abilityMod;
  }

  if (bonusFromItem) {
    aggregateBonus += bonusFromItem;
  }

  if (aggregateBonus !== 0) {
    expression = expression ? `${expression}${formatModifier(aggregateBonus)}` : formatModifier(aggregateBonus);
  }

  const suffixParts: string[] = [];
  if (damage.damageType) {
    suffixParts.push(damage.damageType.toLowerCase());
  }

  const noteParts: string[] = [];

  if (damage.note) {
    noteParts.push(damage.note);
  }

  if (damage.scaling && damage.scaling.type === 'spell-slot') {
    const base = damage.scaling.baseLevel;
    const inc = damage.scaling.incrementDice;
    noteParts.push(`+${inc} per slot ≥ ${base + 1}`);
  } else if (damage.scaling && damage.scaling.type === 'custom') {
    noteParts.push(damage.scaling.label);
  }

  if (damage.halfOnSave) {
    noteParts.push('half on save');
  }

  if (suffixParts.length > 0) {
    expression = expression ? `${expression} ${suffixParts.join(', ')}` : suffixParts.join(', ');
  }

  const result: ScalingNoteResult = { dice: expression || '—' };
  if (noteParts.length) {
    result.note = noteParts.join('; ');
  }
  return result;
};

export const buildHealingString = (
  character: CharacterSheetData,
  healing: ActionHealingDefinition | undefined
): ScalingNoteResult => {
  if (!healing) {
    return { dice: undefined };
  }

  let expression = healing.dice ?? '';

  if (healing.scaling && healing.scaling.type === 'cantrip') {
    const scaled = pickCantripScalingDice(healing.scaling.progression, character.level);
    expression = scaled.dice ?? expression;
  }

  const abilityMod = healing.abilityMod
    ? getAbilityModifier(character, healing.ability ?? 'spellcasting')
    : 0;

  const flatBonus = healing.bonus ?? 0;
  let aggregateBonus = 0;

  if (healing.abilityMod && abilityMod !== 0) {
    aggregateBonus += abilityMod;
  }

  if (flatBonus) {
    aggregateBonus += flatBonus;
  }

  if (aggregateBonus !== 0) {
    expression = expression ? `${expression}${formatModifier(aggregateBonus)}` : formatModifier(aggregateBonus);
  }

  const noteParts: string[] = [];
  if (healing.note) {
    noteParts.push(healing.note);
  }

  if (healing.scaling && healing.scaling.type === 'spell-slot') {
    const base = healing.scaling.baseLevel;
    const inc = healing.scaling.incrementDice;
    noteParts.push(`+${inc} per slot ≥ ${base + 1}`);
  } else if (healing.scaling && healing.scaling.type === 'custom') {
    noteParts.push(healing.scaling.label);
  }

  const result: ScalingNoteResult = { dice: expression || '—' };
  if (noteParts.length) {
    result.note = noteParts.join('; ');
  }
  return result;
};

export interface DerivedActionDisplay {
  attack: string;
  secondary?: string;
  damage: string;
  notes?: string;
}

export const deriveActionDisplay = (
  action: CharacterAction,
  character: CharacterSheetData
): DerivedActionDisplay => {
  let attackLabel = action.displayOverrides?.attack ?? '—';
  let secondary: string | undefined;

  if (action.attack) {
    const { label } = deriveAttackLabel(
      character,
      action.attack.ability ?? 'spellcasting',
      action.attack.proficient ?? true,
      action.attack.bonus,
      action.attack.label
    );
    attackLabel = label.startsWith('+') || label.startsWith('-') ? label : `+${label}`;
  }

  if (!action.attack && action.save) {
    const dcAbility = action.save.dcAbility ?? 'spellcasting';
    const abilityMod = getAbilityModifier(character, dcAbility);
    const dc = 8 + character.proficiencyBonus + abilityMod + (action.save.bonus ?? 0);
    const abilityLabel = formatAbilityLabel(action.save.ability);
    attackLabel = `DC ${dc}${abilityLabel ? ` (${abilityLabel})` : ''}`;
  } else if (action.attack && action.save) {
    const dcAbility = action.save.dcAbility ?? 'spellcasting';
    const abilityMod = getAbilityModifier(character, dcAbility);
    const dc = 8 + character.proficiencyBonus + abilityMod + (action.save.bonus ?? 0);
    const abilityLabel = formatAbilityLabel(action.save.ability);
    secondary = `DC ${dc}${abilityLabel ? ` (${abilityLabel})` : ''}`;
  }

  let damageLabel = action.displayOverrides?.damage ?? '—';
  let notes: string | undefined = action.notes;

  // Check if damage is an array (not a string from legacy data)
  if (Array.isArray(action.damage) && action.damage.length > 0) {
    const segments = action.damage.map((segment) => buildDamageString(character, segment));
    const damageStrings = segments.map((segment) => segment.dice ?? '—');
    const uniqueDamage = Array.from(new Set(damageStrings));
    damageLabel = uniqueDamage.join(' / ');
    const damageNotes = segments
      .map((segment) => segment.note)
      .filter((text): text is string => Boolean(text));
    if (damageNotes.length) {
      notes = notes ? `${notes}; ${damageNotes.join('; ')}` : damageNotes.join('; ');
    }
  } else if (Array.isArray(action.healing) && action.healing.length > 0) {
    const segments = action.healing.map((segment) => buildHealingString(character, segment));
    const healingStrings = segments.map((segment) => segment.dice ?? '—');
    const uniqueHealing = Array.from(new Set(healingStrings));
    damageLabel = uniqueHealing.join(' / ');
    const healingNotes = segments
      .map((segment) => segment.note)
      .filter((text): text is string => Boolean(text));
    const healingLabel = 'healing';
    damageLabel = `${damageLabel} ${healingLabel}`.trim();
    if (healingNotes.length) {
      notes = notes ? `${notes}; ${healingNotes.join('; ')}` : healingNotes.join('; ');
    }
  }

  if (!action.attack && !action.save && action.displayOverrides?.attack) {
    attackLabel = action.displayOverrides.attack;
  }

  if (!(Array.isArray(action.damage) && action.damage.length > 0) &&
      !(Array.isArray(action.healing) && action.healing.length > 0) &&
      action.displayOverrides?.damage) {
    damageLabel = action.displayOverrides.damage;
  }

  if (!action.attack && !action.save && !action.displayOverrides?.attack) {
    attackLabel = '—';
  }

  if (!(Array.isArray(action.damage) && action.damage.length > 0) &&
      !(Array.isArray(action.healing) && action.healing.length > 0) &&
      !action.displayOverrides?.damage) {
    damageLabel = '—';
  }

  const result: DerivedActionDisplay = {
    attack: attackLabel,
    damage: damageLabel,
  };

  if (secondary) {
    result.secondary = secondary;
  }

  if (notes) {
    result.notes = notes;
  }

  return result;
};
