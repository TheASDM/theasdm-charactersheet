import { describe, it, expect } from 'vitest';
import { buildWeaponAction } from '@/utils/weaponCalculator';
import { buildSpellAction } from '@/utils/spellActionBuilder';
import { deriveActionDisplay } from '@/utils/combatActions';
import { createDefaultCharacterSheet, CharacterSheetData } from '@/types/characterSheet';
import type { InventoryItem } from '@/types/characterSheet';
import type { Spell } from '@/types/api';

const createTestCharacter = (overrides: Partial<CharacterSheetData>): CharacterSheetData => {
  const base = createDefaultCharacterSheet();
  return {
    ...base,
    ...overrides,
    abilityScores: {
      ...base.abilityScores,
      ...overrides.abilityScores,
    },
    proficiencies: {
      ...base.proficiencies,
      ...overrides.proficiencies,
    },
  };
};

describe('combat action calculations', () => {
  it('builds accurate weapon action for melee weapon', () => {
    const character = createTestCharacter({
      class: 'Fighter',
      level: 5,
      proficiencyBonus: 3,
      abilityScores: {
        strength: 16,
        dexterity: 12,
        constitution: 10,
        intelligence: 8,
        wisdom: 10,
        charisma: 10,
      },
      proficiencies: {
        armor: [],
        weapons: ['martial', 'simple'],
        tools: [],
      },
    });

    const longsword: InventoryItem = {
      id: 'weapon-1',
      name: 'Longsword',
      quantity: 1,
      equipped: true,
      attuned: false,
    };

    const action = buildWeaponAction(longsword, character);
    const display = deriveActionDisplay(action, character);

    expect(action.attack?.ability).toBe('strength');
    expect(action.attack?.proficient).toBe(true);
    expect(display.attack).toBe('+6');
    expect(display.damage).toBe('1d8+3 slashing');
  });

  it('prefers dexterity for finesse weapons', () => {
    const character = createTestCharacter({
      class: 'Rogue',
      level: 5,
      proficiencyBonus: 3,
      abilityScores: {
        strength: 10,
        dexterity: 16,
        constitution: 10,
        intelligence: 8,
        wisdom: 10,
        charisma: 10,
      },
      proficiencies: {
        armor: [],
        weapons: ['simple', 'rapier', 'shortsword'],
        tools: [],
      },
    });

    const dagger: InventoryItem = {
      id: 'weapon-2',
      name: 'Dagger',
      quantity: 1,
      equipped: true,
      attuned: false,
    };

    const action = buildWeaponAction(dagger, character);
    const display = deriveActionDisplay(action, character);

    expect(action.attack?.ability).toBe('dexterity');
    expect(display.attack).toBe('+6');
    expect(display.damage).toBe('1d4+3 piercing');
  });

  it('includes magic bonuses for enchanted weapons', () => {
    const character = createTestCharacter({
      class: 'Paladin',
      level: 7,
      proficiencyBonus: 3,
      abilityScores: {
        strength: 16,
        dexterity: 12,
        constitution: 12,
        intelligence: 8,
        wisdom: 10,
        charisma: 14,
      },
      proficiencies: {
        armor: [],
        weapons: ['martial', 'simple'],
        tools: [],
      },
    });

    const magicSword: InventoryItem = {
      id: 'weapon-3',
      name: '+1 Longsword',
      quantity: 1,
      equipped: true,
      attuned: false,
    };

    const action = buildWeaponAction(magicSword, character);
    const display = deriveActionDisplay(action, character);

    expect(action.attack?.bonus).toBe(1);
    expect(action.damage?.[0].bonus).toBe(1);
    expect(display.attack).toBe('+7');
    expect(display.damage).toBe('1d8+4 slashing');
  });

  const baseSpellProps = {
    source: 'XPHB',
    page: 0,
    srd52: true,
    basicRules2024: true,
    time: [{ number: 1, unit: 'action' }],
    range: { type: 'point', distance: { type: 'feet', amount: 120 } },
    components: { v: true, s: true } as Spell['components'],
    duration: [{ type: 'instant' }] as Spell['duration'],
    miscTags: [],
    createdAt: '',
    updatedAt: '',
  };

  const fireBoltSpell: Spell = {
    ...baseSpellProps,
    id: 1,
    name: 'Fire Bolt',
    level: 0,
    school: 'V',
    entries: [
      'You hurl a mote of fire. Make a ranged spell attack. On a hit, the target takes {@damage 1d10} Fire damage.',
    ],
    entriesHigherLevel: [
      {
        type: 'entries',
        name: 'Cantrip Upgrade',
        entries: ['The damage increases by {@damage 1d10} when you reach levels 5, 11, and 17.'],
      },
    ],
    scalingLevelDice: {
      label: 'Fire damage',
      scaling: {
        '1': '1d10',
        '5': '2d10',
        '11': '3d10',
        '17': '4d10',
      },
    } as any,
    damageInflict: ['fire'],
    spellAttack: ['R'],
  } as unknown as Spell;

  const sacredFlameSpell: Spell = {
    ...baseSpellProps,
    id: 2,
    name: 'Sacred Flame',
    level: 0,
    school: 'V',
    entries: [
      'Flame-like radiance descends on a creature. The target must succeed on a Dexterity saving throw or take {@damage 1d8} Radiant damage.',
    ],
    entriesHigherLevel: [
      {
        type: 'entries',
        name: 'Cantrip Upgrade',
        entries: ['The damage increases by {@damage 1d8} when you reach levels 5, 11, and 17.'],
      },
    ],
    scalingLevelDice: {
      label: 'Radiant damage',
      scaling: {
        '1': '1d8',
        '5': '2d8',
        '11': '3d8',
        '17': '4d8',
      },
    } as any,
    damageInflict: ['radiant'],
    savingThrow: ['dexterity'],
  } as unknown as Spell;

  const cureWoundsSpell: Spell = {
    ...baseSpellProps,
    id: 3,
    name: 'Cure Wounds',
    level: 1,
    school: 'A',
    entries: ['A creature you touch regains {@dice 2d8} plus your spellcasting ability modifier hit points.'],
    entriesHigherLevel: [
      {
        type: 'entries',
        name: 'Using a Higher-Level Spell Slot',
        entries: ['The healing increases by {@scaledice 2d8|1-9|2d8} for each spell slot level above 1.'],
      },
    ],
    miscTags: ['HL'],
  } as unknown as Spell;

  const magicMissileSpell: Spell = {
    ...baseSpellProps,
    id: 4,
    name: 'Magic Missile',
    level: 1,
    school: 'V',
    entries: [
      'You create three glowing darts of magic force. Each dart deals {@damage 1d4 + 1} Force damage to its target.',
    ],
    entriesHigherLevel: [
      {
        type: 'entries',
        name: 'Higher Levels',
        entries: ['The spell creates one more dart for each spell slot level above 1.'],
      },
    ],
    damageInflict: ['force'],
    miscTags: ['SGT'],
  } as unknown as Spell;

  it('builds spell attack actions with cantrip scaling', () => {
    const character = createTestCharacter({
      class: 'Wizard',
      level: 13,
      proficiencyBonus: 5,
      abilityScores: {
        strength: 8,
        dexterity: 12,
        constitution: 12,
        intelligence: 18,
        wisdom: 12,
        charisma: 10,
      },
    });

    const action = buildSpellAction(fireBoltSpell);
    const display = deriveActionDisplay(action, character);

    expect(action.attack?.kind).toBe('spell');
    expect(display.attack).toBe('+9');
    expect(display.damage).toBe('3d10 fire');
    expect(action.damage?.[0].scaling?.type).toBe('cantrip');
  });

  it('builds save-based spell entries', () => {
    const character = createTestCharacter({
      class: 'Cleric',
      level: 5,
      proficiencyBonus: 3,
      abilityScores: {
        strength: 8,
        dexterity: 12,
        constitution: 12,
        intelligence: 10,
        wisdom: 16,
        charisma: 10,
      },
    });

    const action = buildSpellAction(sacredFlameSpell);
    const display = deriveActionDisplay(action, character);

    expect(action.save?.ability).toBe('dexterity');
    expect(display.attack).toBe('DC 14 (Dex)');
    expect(display.damage).toBe('2d8 radiant');
  });

  it('captures healing logic and upcast scaling', () => {
    const character = createTestCharacter({
      class: 'Cleric',
      level: 7,
      proficiencyBonus: 3,
      abilityScores: {
        strength: 8,
        dexterity: 10,
        constitution: 12,
        intelligence: 10,
        wisdom: 16,
        charisma: 12,
      },
    });

    const action = buildSpellAction(cureWoundsSpell);
    const display = deriveActionDisplay(action, character);

    expect(action.healing?.length).toBe(1);
    expect(action.healing?.[0].scaling?.type).toBe('spell-slot');
    expect(action.healing?.[0].ability).toBe('spellcasting');
    expect(action.healing?.[0].abilityMod).toBe(true);
    expect(display.attack).toBe('—');
    expect(display.damage).toBe('2d8+3 healing');
  });

  it('handles auto-hit spells without attack or save', () => {
    const character = createTestCharacter({
      class: 'Wizard',
      level: 5,
      proficiencyBonus: 3,
      abilityScores: {
        strength: 8,
        dexterity: 12,
        constitution: 12,
        intelligence: 18,
        wisdom: 12,
        charisma: 10,
      },
    });

    const action = buildSpellAction(magicMissileSpell);
    const display = deriveActionDisplay(action, character);

    expect(display.attack).toBe('—');
    expect(action.notes).toContain('Automatically applies');
    expect(display.damage).toBe('1d4+1 force');
  });
});
