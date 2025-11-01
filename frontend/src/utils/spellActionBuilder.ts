import { CharacterAction, AbilityScoreName, ActionDamageDefinition, ActionHealingDefinition, DamageScalingDefinition } from '../types/characterSheet';
import type { Spell } from '@/types/api';

type RawEntry = string | { entries?: unknown } | { items?: unknown } | { type?: string; name?: string; entries?: unknown };

const ABILITY_NAME_MAP: Record<string, AbilityScoreName> = {
  str: 'strength',
  strength: 'strength',
  dex: 'dexterity',
  dexterity: 'dexterity',
  con: 'constitution',
  constitution: 'constitution',
  int: 'intelligence',
  intelligence: 'intelligence',
  wis: 'wisdom',
  wisdom: 'wisdom',
  cha: 'charisma',
  charisma: 'charisma',
};

const gatherText = (entry: RawEntry | RawEntry[] | null | undefined): string[] => {
  if (!entry) return [];
  if (typeof entry === 'string') return [entry];
  if (Array.isArray(entry)) {
    return entry.flatMap((item) => gatherText(item));
  }
  if (typeof entry === 'object') {
    if ('entries' in entry && entry.entries) {
      return gatherText(entry.entries as RawEntry[]);
    }
    if ('items' in entry && entry.items) {
      return gatherText(entry.items as RawEntry[]);
    }
  }
  return [];
};

const normaliseDiceExpression = (expr: string): string => expr.replace(/\s+/g, '').replace(/\u2212/g, '-');

const normaliseAbilityName = (value: string | undefined | null): AbilityScoreName | null => {
  if (!value) return null;
  return ABILITY_NAME_MAP[value.toLowerCase()] ?? null;
};

const extractMatches = (textSegments: string[], pattern: RegExp) => {
  const matches: Array<{ segmentIndex: number; index: number; value: string }> = [];
  textSegments.forEach((segment, segmentIndex) => {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(segment)) !== null) {
      matches.push({
        segmentIndex,
        index: match.index ?? 0,
        value: match[1],
      });
    }
  });
  return matches;
};

const findAbilityModifierContext = (text: string, index: number): { ability: AbilityScoreName | 'spellcasting' | null } => {
  const window = text.slice(Math.max(0, index - 90), Math.min(text.length, index + 120));
  const match = window.match(/plus your ([a-z ]+) modifier/i);
  if (!match) {
    return { ability: null };
  }

  const abilityWord = match[1].trim().toLowerCase().replace(/\s+ability$/, '');
  if (abilityWord === 'spellcasting') {
    return { ability: 'spellcasting' };
  }
  const normalised = normaliseAbilityName(abilityWord);
  return { ability: normalised };
};

const detectHalfOnSave = (text: string): boolean => /half as much damage/i.test(text);

const parseSpellSlotScaling = (textSegments: string[]): DamageScalingDefinition | undefined => {
  const combined = textSegments.join('\n');

  const taggedMatch = combined.match(/\{@scaled(?:ice|amage) ([^}]+)}/i);
  if (taggedMatch) {
    const parts = taggedMatch[1].split('|').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const baseRange = parts[1];
      const incrementDice = normaliseDiceExpression(parts[2]);
      const [start] = baseRange.split('-').map((value) => parseInt(value, 10));
      const baseLevel = Number.isFinite(start) ? start : 1;
      return {
        type: 'spell-slot',
        baseLevel,
        incrementDice,
      };
    }
  }

  const textualMatch = combined.match(/increases by \{@damage ([^}]+)\} for each spell slot level above (\d+)/i);
  if (textualMatch) {
    const incrementDice = normaliseDiceExpression(textualMatch[1]);
    const baseLevel = parseInt(textualMatch[2], 10);
    return {
      type: 'spell-slot',
      baseLevel: Number.isFinite(baseLevel) ? baseLevel : 1,
      incrementDice,
    };
  }

  if (/creates one more dart for each spell slot level above/i.test(combined)) {
    return {
      type: 'custom',
      label: '+1 dart per slot level above base',
    };
  }

  return undefined;
};

const parseCantripScaling = (spell: Spell): DamageScalingDefinition | undefined => {
  const scaling = spell.scalingLevelDice?.scaling;
  if (!scaling) {
    return undefined;
  }
  const progression: Record<number, string> = {};
  Object.entries(scaling).forEach(([level, dice]) => {
    const numericLevel = parseInt(level, 10);
    if (!Number.isNaN(numericLevel)) {
      progression[numericLevel] = normaliseDiceExpression(dice);
    }
  });
  return { type: 'cantrip', progression };
};

const buildDamageComponents = (
  spell: Spell,
  baseSegments: string[],
  higherLevelSegments: string[]
): ActionDamageDefinition[] => {
  const primaryMatches = extractMatches(baseSegments, /\{@damage ([^}]+)}/gi);
  const higherMatches = extractMatches(higherLevelSegments, /\{@damage ([^}]+)}/gi);
  const combinedSegments = [...baseSegments, ...higherLevelSegments];

  const damageMatches = spell.level === 0
    ? primaryMatches
    : [...primaryMatches, ...higherMatches];

  const damageTypes = spell.damageInflict ?? [];
  const components: ActionDamageDefinition[] = [];

  damageMatches.forEach((match, index) => {
    const segment = combinedSegments[match.segmentIndex] ?? '';
    const expression = normaliseDiceExpression(match.value);

    const abilityContext = findAbilityModifierContext(segment, match.index);
    const damageType = damageTypes[index] ?? damageTypes[damageTypes.length - 1];

    const component: ActionDamageDefinition = {
      dice: expression,
      abilityMod: abilityContext.ability !== null,
    };

    if (damageType) {
      component.damageType = damageType;
    }

    if (abilityContext.ability) {
      component.ability = abilityContext.ability;
    }

    components.push(component);
  });

  if (components.length === 0 && spell.level === 0 && spell.scalingLevelDice?.scaling) {
    components.push({
      dice: normaliseDiceExpression(Object.values(spell.scalingLevelDice.scaling)[0]),
    });
  }

  const scaling = spell.level === 0 ? parseCantripScaling(spell) : parseSpellSlotScaling(combinedSegments);
  if (components.length > 0 && scaling) {
    components.forEach((component) => {
      component.scaling = scaling;
    });
  }

  const combinedText = combinedSegments.join('\n');
  if (components.length > 0 && detectHalfOnSave(combinedText)) {
    components.forEach((component) => {
      component.halfOnSave = true;
    });
  }

  if (!components.length) {
    return [];
  }

  return components;
};

const buildHealingComponents = (
  _spell: Spell,
  textSegments: string[]
): ActionHealingDefinition[] => {
  const healingMatches = extractMatches(
    textSegments,
    /\{@dice ([^}]+)}/gi
  );

  if (!healingMatches.length) {
    return [];
  }

  const components: ActionHealingDefinition[] = healingMatches.map((match) => {
    const segment = textSegments[match.segmentIndex] ?? '';
    const expression = normaliseDiceExpression(match.value);
    const abilityContext = findAbilityModifierContext(segment, match.index);
    const component: ActionHealingDefinition = {
      dice: expression,
      abilityMod: abilityContext.ability !== null,
    };

    if (abilityContext.ability) {
      component.ability = abilityContext.ability;
    }

    return component;
  });

  const scaling = parseSpellSlotScaling(textSegments);
  if (scaling) {
    components.forEach((component) => {
      component.scaling = scaling;
    });
  }

  return components;
};

const computeDisplayOverrides = (
  requiresAttack: boolean,
  hasSave: boolean,
  hasEffect: boolean
) => {
  const displayOverrides: CharacterAction['displayOverrides'] = {};

  if (!requiresAttack && !hasSave) {
    displayOverrides.attack = '—';
  }

  if (!hasEffect) {
    displayOverrides.damage = '—';
  }

  if (!displayOverrides.attack && !displayOverrides.damage) {
    return undefined;
  }

  return displayOverrides;
};

const buildNotes = (spell: Spell, damageComponents: ActionDamageDefinition[], healingComponents: ActionHealingDefinition[]): string | undefined => {
  const notes: string[] = [];

  if (!spell.spellAttack?.length && !spell.savingThrow?.length && (damageComponents.length || healingComponents.length)) {
    notes.push('Automatically applies');
  }

  if (damageComponents.some((component) => component.halfOnSave)) {
    notes.push('Half damage on save');
  }

  if (spell.miscTags?.includes('SGT')) {
    notes.push('Single-target');
  }

  return notes.length ? notes.join('; ') : undefined;
};

export const buildSpellAction = (spell: Spell): CharacterAction => {
  // Use mechanics field for 5etools data, fallback to top-level fields for backward compatibility
  const mechanics = spell.mechanics || spell;

  const baseSegments = gatherText(mechanics.entries as RawEntry[]);
  const higherLevelSegments = gatherText(mechanics.entriesHigherLevel as RawEntry[]);
  const textSegments = [...baseSegments, ...higherLevelSegments];

  const requiresAttack = Array.isArray(mechanics.spellAttack) && mechanics.spellAttack.length > 0;
  const savingThrows = Array.isArray(mechanics.savingThrow) ? mechanics.savingThrow : [];
  const savingAbility = normaliseAbilityName(savingThrows[0]);

  const damageComponents = buildDamageComponents(mechanics, baseSegments, higherLevelSegments);
  const healingComponents = buildHealingComponents(mechanics, textSegments);
  const hasEffect = damageComponents.length > 0 || healingComponents.length > 0;

  const displayOverrides = computeDisplayOverrides(requiresAttack, Boolean(savingAbility), hasEffect);
  const notes = buildNotes(mechanics, damageComponents, healingComponents);

  const tags: string[] = ['spell'];
  if (spell.level === 0) tags.push('cantrip');
  if (requiresAttack) tags.push('spell-attack');
  if (savingAbility) tags.push('save');
  if (damageComponents.length) tags.push('damage');
  if (healingComponents.length) tags.push('healing');

  const action: CharacterAction = {
    name: spell.name,
    type: 'spell',
    spellId: String(spell.id),
    attack: requiresAttack
      ? {
          kind: 'spell',
          ability: 'spellcasting',
          proficient: true,
        }
      : null,
    save: savingAbility
      ? {
          ability: savingAbility,
          dcAbility: 'spellcasting',
        }
      : null,
    damage: damageComponents.length ? damageComponents : null,
    healing: healingComponents.length ? healingComponents : null,
    tags,
  };

  if (notes) {
    action.notes = notes;
  }

  if (displayOverrides) {
    action.displayOverrides = displayOverrides;
  }

  return action;
};
