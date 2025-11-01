import { PrismaClient, Prisma } from '@prisma/client';

type AbilityScoreName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

interface ActionAttackDefinition {
  kind: 'weapon' | 'spell' | 'custom';
  ability?: AbilityScoreName | 'spellcasting';
  proficient?: boolean;
  bonus?: number;
  label?: string;
}

interface ActionSaveDefinition {
  ability: AbilityScoreName;
  dcAbility?: AbilityScoreName | 'spellcasting';
  bonus?: number;
  label?: string;
}

type DamageScalingDefinition =
  | { type: 'cantrip'; progression: Record<number, string> }
  | { type: 'spell-slot'; baseLevel: number; incrementDice: string; note?: string }
  | { type: 'custom'; label: string };

interface ActionDamageDefinition {
  dice?: string;
  bonus?: number;
  damageType?: string;
  abilityMod?: boolean;
  ability?: AbilityScoreName | 'spellcasting';
  alternateDice?: string;
  note?: string;
  halfOnSave?: boolean;
  scaling?: DamageScalingDefinition;
}

interface ActionHealingDefinition {
  dice?: string;
  bonus?: number;
  abilityMod?: boolean;
  ability?: AbilityScoreName | 'spellcasting';
  scaling?: DamageScalingDefinition;
  note?: string;
}

type CharacterActionKind = 'default' | 'weapon' | 'spell' | 'feature' | 'custom';

interface CharacterAction {
  name: string;
  type: CharacterActionKind;
  attack?: ActionAttackDefinition | null;
  save?: ActionSaveDefinition | null;
  damage?: ActionDamageDefinition[] | null;
  healing?: ActionHealingDefinition[] | null;
  notes?: string;
  tags?: string[];
  spellId?: string;
  sourceId?: string;
  displayOverrides?: {
    attack?: string;
    damage?: string;
  };
  legacy?: {
    atkBonus?: string;
    damage?: string;
  };
}

type RawEntry =
  | string
  | { entries?: unknown }
  | { items?: unknown }
  | { type?: string; name?: string; entries?: unknown };

type CanonSpellWithRaw = Prisma.CanonSpellGetPayload<{
  include: {
    raw: true;
    school: true;
    damage: {
      include: {
        damageType: true;
      };
    };
    conditions: true;
  };
}>;

interface SpellLike {
  id: number | string;
  name: string;
  level: number;
  school?: string | { code: string; name: string };
  entries?: RawEntry[];
  entriesHigherLevel?: RawEntry[];
  damageInflict?: string[];
  savingThrow?: string[];
  miscTags?: string[];
  scalingLevelDice?: {
    label?: string;
    scaling: Record<string, string>;
  };
  spellAttack?: string[];
}

const prisma = new PrismaClient();
const spellCache = new Map<string, CanonSpellWithRaw | null>();
const spellIdByNameCache = new Map<string, string>();

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

const normaliseDiceExpression = (expr: string): string =>
  expr.replace(/\s+/g, '').replace(/\u2212/g, '-');

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

const findAbilityModifierContext = (
  text: string,
  index: number
): { ability: AbilityScoreName | 'spellcasting' | null } => {
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
    const parts = taggedMatch[1]
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean);
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

  const textualMatch = combined.match(
    /increases by \{@damage ([^}]+)\} for each spell slot level above (\d+)/i
  );
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

const parseCantripScaling = (spell: SpellLike): DamageScalingDefinition | undefined => {
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
  spell: SpellLike,
  baseSegments: string[],
  higherLevelSegments: string[]
): ActionDamageDefinition[] => {
  const combinedSegments = [...baseSegments, ...higherLevelSegments];
  const damageMatches = extractMatches(baseSegments, /\{@damage ([^}]+)}/gi);

  const damageTypes = spell.damageInflict ?? [];
  const components: ActionDamageDefinition[] = [];

  damageMatches.forEach((match, index) => {
    const segment = baseSegments[match.segmentIndex] ?? '';
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
    const firstEntry = Object.values(spell.scalingLevelDice.scaling)[0];
    if (firstEntry) {
      components.push({
        dice: normaliseDiceExpression(firstEntry),
      });
    }
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

const buildHealingComponents = (spell: SpellLike, textSegments: string[]): ActionHealingDefinition[] => {
  const healingMatches = extractMatches(textSegments, /\{@dice ([^}]+)}/gi);

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

const buildNotes = (
  spell: SpellLike,
  damageComponents: ActionDamageDefinition[],
  healingComponents: ActionHealingDefinition[]
): string | undefined => {
  const notes: string[] = [];

  if (
    (!spell.spellAttack || spell.spellAttack.length === 0) &&
    (!spell.savingThrow || spell.savingThrow.length === 0) &&
    (damageComponents.length || healingComponents.length)
  ) {
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

const normaliseSavingThrow = (values: string[] | undefined): string[] | undefined => {
  if (!values || !values.length) return undefined;
  return values.map((save) => {
    const normalized = save.toLowerCase();
    return normalized.includes('dex') ? 'dexterity' : normalized;
  });
};

const mapCanonSpellToSpellLike = (spell: CanonSpellWithRaw): SpellLike => {
  const raw = (spell.raw?.raw ?? {}) as Record<string, any>;
  const damageInflict = Array.isArray(raw.damageInflict)
    ? raw.damageInflict
    : spell.damage
        .map((d) => d.damageType?.slug ?? d.damageType?.name ?? null)
        .filter((d): d is string => Boolean(d))
        .map((d) => d.toLowerCase());

  const savingThrowRaw = raw.savingThrow as string[] | undefined;
  const savingThrows = normaliseSavingThrow(
    savingThrowRaw && savingThrowRaw.length ? savingThrowRaw : spell.savingThrows
  );

  return {
    id: Number(spell.id),
    name: spell.name,
    level: spell.level,
    school: spell.schoolCode
      ? { code: spell.schoolCode, name: spell.school?.name ?? spell.schoolCode }
      : raw.school,
    entries: (raw.entries ?? []) as RawEntry[],
    entriesHigherLevel: (raw.entriesHigherLevel ?? []) as RawEntry[],
    damageInflict,
    savingThrow: savingThrows,
    miscTags: Array.isArray(raw.miscTags) ? raw.miscTags : [],
    scalingLevelDice: raw.scalingLevelDice,
    spellAttack: Array.isArray(raw.spellAttack) ? raw.spellAttack : undefined,
  };
};

const buildSpellActionFromCanonSpell = (spell: CanonSpellWithRaw): CharacterAction => {
  const spellLike = mapCanonSpellToSpellLike(spell);
  const baseSegments = gatherText(spellLike.entries as RawEntry[]);
  const higherLevelSegments = gatherText(spellLike.entriesHigherLevel as RawEntry[]);
  const textSegments = [...baseSegments, ...higherLevelSegments];

  const requiresAttack = Array.isArray(spellLike.spellAttack) && spellLike.spellAttack.length > 0;
  const savingThrows = Array.isArray(spellLike.savingThrow) ? spellLike.savingThrow : [];
  const savingAbility = normaliseAbilityName(savingThrows[0]);

  const damageComponents = buildDamageComponents(spellLike, baseSegments, higherLevelSegments);
  const healingComponents = buildHealingComponents(spellLike, textSegments);
  const hasEffect = damageComponents.length > 0 || healingComponents.length > 0;

  const displayOverrides = computeDisplayOverrides(requiresAttack, Boolean(savingAbility), hasEffect);
  const notes = buildNotes(spellLike, damageComponents, healingComponents);

  const tags: string[] = ['spell'];
  if (spellLike.level === 0) tags.push('cantrip');
  if (requiresAttack) tags.push('spell-attack');
  if (savingAbility) tags.push('save');
  if (damageComponents.length) tags.push('damage');
  if (healingComponents.length) tags.push('healing');

  return {
    name: spellLike.name,
    type: 'spell',
    spellId: String(spellLike.id),
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
    notes,
    tags,
    displayOverrides,
  };
};

const shouldMigrateSpellAction = (action: any): boolean => {
  if (!action || typeof action !== 'object') return false;
  const type = action.type;
  const tags = Array.isArray(action.tags) ? action.tags : [];
  const looksLikeSpell =
    type === 'spell' || tags.includes('spell') || action.spellId || action.spell?.id;
  if (!looksLikeSpell) return false;

  const missingAttack = !action.attack && !action.save;
  const missingEffect =
    (!Array.isArray(action.damage) || action.damage.length === 0) &&
    (!Array.isArray(action.healing) || action.healing.length === 0);
  const hasLegacyFields =
    typeof action.atkBonus === 'string' || typeof action.damage === 'string';

  return missingAttack || missingEffect || hasLegacyFields;
};

const resolveSpellId = async (action: any): Promise<string | null> => {
  if (action.spellId) {
    return String(action.spellId);
  }

  if (action.spell?.id) {
    return String(action.spell.id);
  }

  const name = typeof action.name === 'string' ? action.name.trim() : '';
  if (!name) return null;

  if (spellIdByNameCache.has(name.toLowerCase())) {
    return spellIdByNameCache.get(name.toLowerCase()) ?? null;
  }

  const candidate = await prisma.canonSpell.findFirst({
    where: { name },
    select: { id: true },
  });

  const resolved = candidate ? String(candidate.id) : null;
  spellIdByNameCache.set(name.toLowerCase(), resolved);
  return resolved;
};

const fetchSpell = async (spellId: string): Promise<CanonSpellWithRaw | null> => {
  if (spellCache.has(spellId)) {
    return spellCache.get(spellId) ?? null;
  }

  try {
    const spell = await prisma.canonSpell.findUnique({
      where: { id: BigInt(spellId) },
      include: {
        raw: true,
        school: true,
        damage: {
          include: {
            damageType: true,
          },
        },
        conditions: true,
      },
    });

    spellCache.set(spellId, spell ?? null);
    return spell ?? null;
  } catch (error) {
    console.error(`Failed to fetch spell ${spellId}:`, error);
    spellCache.set(spellId, null);
    return null;
  }
};

const mergeNotes = (existing: string | undefined, generated: string | undefined) => {
  if (!existing) return generated;
  if (!generated) return existing;
  if (generated.includes(existing)) return generated;
  if (existing.includes(generated)) return existing;
  return `${generated}; ${existing}`;
};

const migrateAction = async (action: any): Promise<CharacterAction | any> => {
  if (!shouldMigrateSpellAction(action)) {
    return action;
  }

  const spellId = await resolveSpellId(action);
  if (!spellId) {
    console.warn(`⚠️ Unable to resolve spell ID for action "${action?.name}"`);
    return action;
  }

  const spell = await fetchSpell(spellId);
  if (!spell) {
    console.warn(`⚠️ Spell ${spellId} not found for action "${action?.name}"`);
    return action;
  }

  const rebuilt = buildSpellActionFromCanonSpell(spell);
  rebuilt.spellId = String(spell.id);

  if (action.displayOverrides) {
    rebuilt.displayOverrides = {
      ...rebuilt.displayOverrides,
      ...action.displayOverrides,
    };
  }

  if (action.legacy || action.atkBonus || action.damage) {
    rebuilt.legacy = {
      ...(action.legacy ?? {}),
      ...(typeof action.atkBonus === 'string' ? { atkBonus: action.atkBonus } : {}),
      ...(typeof action.damage === 'string' ? { damage: action.damage } : {}),
    };
  }

  if (action.notes || rebuilt.notes) {
    rebuilt.notes = mergeNotes(action.notes, rebuilt.notes);
  }

  if (Array.isArray(action.tags)) {
    const combined = new Set([...(rebuilt.tags ?? []), ...action.tags]);
    rebuilt.tags = Array.from(combined);
  }

  if (action.sourceId) {
    rebuilt.sourceId = action.sourceId;
  }

  return rebuilt;
};

const migrateCharacter = async (
  character: Prisma.CharacterGetPayload<{}>
): Promise<boolean> => {
  const data = character.characterData as any;
  if (!data || !Array.isArray(data.actions) || !data.actions.length) {
    return false;
  }

  let updated = false;
  const migratedActions: CharacterAction[] = [];

  for (const action of data.actions) {
    const migrated = await migrateAction(action);
    if (migrated !== action) {
      updated = true;
    }
    migratedActions.push(migrated);
  }

  if (!updated) {
    return false;
  }

  data.actions = migratedActions;

  await prisma.character.update({
    where: { id: character.id },
    data: {
      characterData: data as Prisma.JsonValue,
    },
  });

  console.log(`✅ Migrated spell actions for character ${character.id} (${character.name})`);
  return true;
};

const main = async () => {
  console.log('🔧 Starting spell action migration...');

  const batchSize = 25;
  let skip = 0;
  let migratedCount = 0;

  while (true) {
    const characters = await prisma.character.findMany({
      skip,
      take: batchSize,
      orderBy: { id: 'asc' },
    });

    if (characters.length === 0) {
      break;
    }

    for (const character of characters) {
      const migrated = await migrateCharacter(character);
      if (migrated) {
        migratedCount += 1;
      }
    }

    skip += characters.length;
  }

  console.log(`\n🎉 Migration complete. Updated ${migratedCount} character(s).`);
};

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
