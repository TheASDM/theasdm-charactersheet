# Spell Selection Wizard - Full Implementation Plan (D&D 2024)

## 🚨 Critical Correction

**Previous Error:** Rangers were incorrectly listed as gaining spells at level 2.
**D&D 2024 Rules:** Rangers gain spellcasting at **level 1**.

---

## Current State Analysis

### What Exists
- ✅ `SpellSelectionWizard.tsx` (1589 lines) - Partial implementation
- ✅ `spellRules.ts` - Core spell mechanics and validation
- ✅ `spellcastingConfig.ts` - Class-specific spell configurations
- ✅ Spell API integration (`spellService.ts`)
- ✅ Cantrip/Known/Prepared spell tracking logic
- ✅ Mana pool calculations (`manaRules.ts`)

### What's Missing / Broken
- ❌ **Incorrect "known caster" model** - D&D 2024 uses prepared spell mechanics for all classes
- ❌ **Ranger** incorrectly blocked at level 1
- ❌ **Paladin** incorrectly blocked at level 1
- ❌ **Warlock** pact magic not properly handled
- ❌ **Fighter/Rogue** (third-casters) - need info panels at levels 1-2
- ❌ **Wizard** spellbook vs prepared not properly distinguished
- ❌ **Ritual-only spells** not properly flagged
- ❌ **Subclass-specific spell lists** not integrated (domain/oath spells)
- ❌ **Always-prepared spells** not auto-selected

---

## D&D 2024 Spell Preparation System

### Core Mechanics

D&D 2024 uses **two types of prepared casters**:

#### 1. Flexible Prepared Casters
**Classes:** Cleric, Druid, Paladin, Ranger, Wizard

- Prepare **N** spells from their class list (or spellbook for Wizard)
- Can **reselect their entire prepared list** after a long rest
- Source: Full class list (Wizard uses spellbook only)

#### 2. Semi-Prepared Casters (Limited Swap)
**Classes:** Bard, Sorcerer, Warlock

- Prepare **N** spells from their class list
- **Cannot** reselect entire list after long rest
- At **level up**, can replace **one** prepared spell
- These are traditionally called "known casters" but 2024 uses prepared terminology

---

## D&D 2024 Spell Selection Rules (Level 1)

### Full Casters (Flexible Prepared)

#### **Cleric** (Wisdom)
- **Type**: Flexible Prepared Caster
- **Cantrips**: 3
- **Prepared**: 1 + WIS mod (from entire Cleric spell list)
- **Always Prepared**: Domain spells (deferred to future sprint)
- **Note**: Can change entire prepared list after long rest

#### **Druid** (Wisdom)
- **Type**: Flexible Prepared Caster
- **Cantrips**: 2
- **Prepared**: 1 + WIS mod (from entire Druid spell list)
- **Note**: Can change entire prepared list after long rest

#### **Wizard** (Intelligence)
- **Type**: Flexible Prepared Caster + Spellbook
- **Cantrips**: 3
- **Spellbook**: 6 spells (any level 1 Wizard spells)
- **Prepared**: 1 + INT mod (from spellbook only)
- **Ritual Casting**: Can cast ANY wizard spell as ritual if in spellbook (even if not prepared)
- **Note**: Can change prepared list after long rest

### Full Casters (Semi-Prepared)

#### **Bard** (Charisma)
- **Type**: Semi-Prepared Caster
- **Cantrips**: 2
- **Prepared**: 4 (from Bard spell list, levels 0-1)
- **Note**: Can only replace one spell at level up

#### **Sorcerer** (Charisma)
- **Type**: Semi-Prepared Caster
- **Cantrips**: 4
- **Prepared**: 2 (from Sorcerer spell list, levels 0-1)
- **Note**: Can only replace one spell at level up

#### **Warlock** (Charisma)
- **Type**: Semi-Prepared Caster (Pact Magic)
- **Cantrips**: 2
- **Prepared**: 2 (from Warlock spell list, levels 0-1)
- **Spell Slots**: 1 × 1st level (Pact Magic, recovers on short rest)
- **Note**: Slots always cast at highest level; can replace one spell at level up

### Half-Casters (Flexible Prepared)

#### **Paladin** (Charisma)
- **Type**: Flexible Prepared Caster
- **Level 1**: 0 cantrips, prepare (1 + CHA mod) spells
- **Always Prepared**: Oath spells (deferred to future sprint)
- **Note**: Can change entire prepared list after long rest

#### **Ranger** (Wisdom)
- **Type**: Flexible Prepared Caster
- **Level 1**: 0 cantrips (unless subclass grants), prepare (1 + WIS mod) spells
- **Note**: Can change entire prepared list after long rest

### Third-Casters (Get spells at level 3)

#### **Fighter: Eldritch Knight** (Intelligence)
- **Level 1-2**: NO SPELLS
- **Level 3**: 3 cantrips, prepare 3 spells
- **Note**: School restrictions removed in 2024

#### **Rogue: Arcane Trickster** (Intelligence)
- **Level 1-2**: NO SPELLS
- **Level 3**: 3 cantrips (must include Mage Hand), prepare 3 spells
- **Note**: School restrictions removed in 2024

### Non-Casters
- **Barbarian**: No spells
- **Monk**: No spells (unless subclass grants)

---

## Implementation Plan (Level 1 Only)

### Phase 1: Core Architecture Changes

#### 1.1 Update Type System

**File**: `frontend/src/types/spells.ts`

```typescript
export type CasterType = 'flexiblePrepared' | 'semiPrepared' | 'none' | 'futureSubclass';

export interface ClassCastingConfig {
  casterType: CasterType;
  cantripsAtLevel: Record<number, number>;
  preparedAtLevel: Record<number, number>;
  usesSpellbook?: boolean;        // Wizard only
  pactMagic?: boolean;            // Warlock only
  requiresMageHandAtL3?: boolean; // Arcane Trickster (level 3)
}

export interface SubclassSpellConfig {
  classId: string;
  alwaysPrepared?: Record<number, string[]>; // Future: domain/oath spells
  tags?: string[];
}
```

#### 1.2 Update Spellcasting Config

**File**: `frontend/src/helpers/spellcastingConfig.ts`

```typescript
export const CLASS_CONFIG: Record<string, ClassCastingConfig> = {
  // Flexible Prepared Casters
  Cleric: {
    casterType: 'flexiblePrepared',
    cantripsAtLevel: { 1: 3 },
    preparedAtLevel: { 1: 1 } // + WIS mod
  },
  Druid: {
    casterType: 'flexiblePrepared',
    cantripsAtLevel: { 1: 2 },
    preparedAtLevel: { 1: 1 } // + WIS mod
  },
  Paladin: {
    casterType: 'flexiblePrepared',
    cantripsAtLevel: { 1: 0 },
    preparedAtLevel: { 1: 1 } // + CHA mod
  },
  Ranger: {
    casterType: 'flexiblePrepared',
    cantripsAtLevel: { 1: 0 }, // Unless subclass grants
    preparedAtLevel: { 1: 1 } // + WIS mod
  },
  Wizard: {
    casterType: 'flexiblePrepared',
    cantripsAtLevel: { 1: 3 },
    preparedAtLevel: { 1: 1 }, // + INT mod
    usesSpellbook: true
  },

  // Semi-Prepared Casters
  Bard: {
    casterType: 'semiPrepared',
    cantripsAtLevel: { 1: 2 },
    preparedAtLevel: { 1: 4 }
  },
  Sorcerer: {
    casterType: 'semiPrepared',
    cantripsAtLevel: { 1: 4 },
    preparedAtLevel: { 1: 2 }
  },
  Warlock: {
    casterType: 'semiPrepared',
    cantripsAtLevel: { 1: 2 },
    preparedAtLevel: { 1: 2 },
    pactMagic: true
  },

  // Third-Casters (no spells at L1)
  Fighter: {
    casterType: 'none', // Until level 3
    cantripsAtLevel: {},
    preparedAtLevel: {}
  },
  Rogue: {
    casterType: 'none', // Until level 3
    cantripsAtLevel: {},
    preparedAtLevel: {},
    requiresMageHandAtL3: true
  },

  // Non-Casters
  Barbarian: {
    casterType: 'none',
    cantripsAtLevel: {},
    preparedAtLevel: {}
  },
  Monk: {
    casterType: 'none',
    cantripsAtLevel: {},
    preparedAtLevel: {}
  }
};

// Future subclass hook (empty at L1)
export const SUBCLASS_CONFIG: Record<string, SubclassSpellConfig> = {};
```

#### 1.3 Create Subclass Spell Derivation Helper

**File**: `frontend/src/helpers/deriveGrantedSpells.ts` (NEW)

```typescript
import { SUBCLASS_CONFIG } from './spellcastingConfig';

/**
 * Returns spells that are always prepared for a given class/subclass/level.
 * At level 1, this returns [] (subclass integration is deferred).
 * Future: Will return domain spells, oath spells, etc.
 */
export function deriveAlwaysPreparedSpells(
  classId: string,
  level: number,
  subclassId?: string
): string[] {
  // Level 1: No subclass spells implemented yet
  // Future: return SUBCLASS_CONFIG[subclassId]?.alwaysPrepared?.[level] ?? [];
  return [];
}

/**
 * Helper to check if a spell is always prepared (doesn't count against limit).
 */
export function isAlwaysPrepared(
  spellId: string,
  classId: string,
  level: number,
  subclassId?: string
): boolean {
  const alwaysPrepared = deriveAlwaysPreparedSpells(classId, level, subclassId);
  return alwaysPrepared.includes(spellId);
}
```

### Phase 2: Update SpellSelectionWizard Component

#### 2.1 Remove Incorrect Early Exits

**File**: `frontend/src/components/wizard-steps/SpellSelectionWizard.tsx`

```typescript
// ❌ DELETE these blocks (Ranger/Paladin DO get spells at L1)
// if (level === 1 && ['Paladin', 'Ranger'].includes(classId)) { ... }

// ✅ KEEP this block (third-casters don't get spells until L3)
if (level < 3 && ['Fighter', 'Rogue'].includes(classId)) {
  return (
    <StepContainer>
      <h2>Spell Selection</h2>
      <InfoPanel>
        {classId} gains spellcasting at <strong>level 3</strong>.
        {classId === 'Rogue' && ' (Arcane Trickster must select Mage Hand as one cantrip)'}
      </InfoPanel>
    </StepContainer>
  );
}

// ✅ SKIP for non-casters
const config = CLASS_CONFIG[classId];
if (config.casterType === 'none') {
  return null; // Skip spell selection step entirely
}
```

#### 2.2 Add Caster Type Indicators

```typescript
// Show different UI based on caster type
const config = CLASS_CONFIG[classId];
const preparedCount = config.preparedAtLevel[level] + getAbilityModifier(relevantAbility);
const cantripCount = config.cantripsAtLevel[level] ?? 0;

// Flexible vs Semi-Prepared info panel
{config.casterType === 'flexiblePrepared' && (
  <InfoPanel variant="info">
    You can change your entire prepared spell list after a long rest.
  </InfoPanel>
)}

{config.casterType === 'semiPrepared' && (
  <InfoPanel variant="info">
    You can replace <strong>one</strong> prepared spell when you gain a level.
  </InfoPanel>
)}

// Warlock Pact Magic
{config.pactMagic && (
  <InfoPanel variant="special">
    <strong>Pact Magic:</strong> You have {getWarlockSlots(level)} spell slot(s) that recover on short rest.
    Your spell slots are always cast at the highest level available.
  </InfoPanel>
)}
```

#### 2.3 Update Validation Logic

```typescript
function validateSpellSelection(
  classId: string,
  level: number,
  cantrips: string[],
  prepared: string[],
  spellbook?: string[] // Wizard only
): { valid: boolean; error?: string } {
  const config = CLASS_CONFIG[classId];
  const expectedCantrips = config.cantripsAtLevel[level] ?? 0;
  const expectedPrepared = config.preparedAtLevel[level] + getAbilityModifier(...);
  const alwaysPrepared = deriveAlwaysPreparedSpells(classId, level); // Empty at L1

  // 1. Cantrips
  if (cantrips.length !== expectedCantrips) {
    return { valid: false, error: `Must select ${expectedCantrips} cantrips` };
  }

  // 2. Prepared spells
  const userPreparedCount = prepared.filter(s => !alwaysPrepared.includes(s)).length;
  if (userPreparedCount !== expectedPrepared) {
    return { valid: false, error: `Must prepare ${expectedPrepared} spells` };
  }

  // 3. Wizard spellbook
  if (config.usesSpellbook) {
    if (!spellbook || spellbook.length !== 6) {
      return { valid: false, error: 'Wizard must have 6 spells in spellbook' };
    }
    if (prepared.some(s => !spellbook.includes(s))) {
      return { valid: false, error: 'Can only prepare spells from spellbook' };
    }
  }

  return { valid: true };
}
```

### Phase 3: Wizard Two-Step Selection

#### 3.1 Create Spellbook Step Component

**File**: `frontend/src/components/wizard-steps/SpellbookStep.tsx` (NEW)

```typescript
export function SpellbookStep({
  onComplete
}: {
  onComplete: (spells: string[]) => void
}) {
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);

  return (
    <StepContainer>
      <h2>Choose Spellbook Spells (6 required)</h2>
      <CounterPill $invalid={selectedSpells.length !== 6}>
        Spellbook: {selectedSpells.length} / 6
      </CounterPill>

      {/* Spell grid */}

      <Button
        disabled={selectedSpells.length !== 6}
        onClick={() => onComplete(selectedSpells)}
      >
        Next: Prepare Spells
      </Button>
    </StepContainer>
  );
}
```

#### 3.2 Create Prepared Spells Step Component

**File**: `frontend/src/components/wizard-steps/PreparedSpellsStep.tsx` (NEW)

```typescript
export function PreparedSpellsStep({
  spellbook,
  maxPrepared,
  onComplete
}: {
  spellbook: string[];
  maxPrepared: number;
  onComplete: (spells: string[]) => void;
}) {
  const [prepared, setPrepared] = useState<string[]>([]);

  return (
    <StepContainer>
      <h2>Prepare Spells from Spellbook</h2>
      <CounterPill $invalid={prepared.length !== maxPrepared}>
        Prepared: {prepared.length} / {maxPrepared}
      </CounterPill>

      <InfoPanel>
        You can change your prepared spells after a long rest.
        Ritual spells can be cast from your spellbook without preparing.
      </InfoPanel>

      {/* Show only spellbook spells */}

      <Button
        disabled={prepared.length !== maxPrepared}
        onClick={() => onComplete(prepared)}
      >
        Complete Spell Selection
      </Button>
    </StepContainer>
  );
}
```

#### 3.3 Integrate Two-Step Wizard

```typescript
// In SpellSelectionWizard.tsx
if (config.usesSpellbook) {
  const [wizardStep, setWizardStep] = useState<'spellbook' | 'prepare'>('spellbook');
  const [wizardSpellbook, setWizardSpellbook] = useState<string[]>([]);

  if (wizardStep === 'spellbook') {
    return (
      <SpellbookStep
        onComplete={(spells) => {
          setWizardSpellbook(spells);
          setWizardStep('prepare');
        }}
      />
    );
  }

  return (
    <PreparedSpellsStep
      spellbook={wizardSpellbook}
      maxPrepared={getPreparedCount(classId, level)}
      onComplete={(spells) => {
        // Save both spellbook and prepared
        onComplete({ spellbook: wizardSpellbook, prepared: spells });
      }}
    />
  );
}
```

### Phase 4: Ritual Casting Indicators

#### 4.1 Add Ritual Badge to Spell Cards

```typescript
{spell.ritual && (
  <RitualBadge>
    📖 Ritual
    {config.usesSpellbook && ' (Can cast without preparing)'}
  </RitualBadge>
)}
```

#### 4.2 Show Ritual Summary (Wizard)

```typescript
{config.usesSpellbook && wizardSpellbook.length > 0 && (
  <InfoPanel>
    You have {wizardSpellbook.filter(id => getSpell(id)?.ritual).length} ritual
    spells in your spellbook that can be cast without preparing.
  </InfoPanel>
)}
```

### Phase 5: Class-Specific Help Text

```typescript
const HELP_TEXT: Record<string, string> = {
  // Flexible Prepared
  Cleric: 'Prepare spells from the entire Cleric spell list. You can change your prepared spells after a long rest.',
  Druid: 'Prepare spells from the entire Druid spell list. You can change your prepared spells after a long rest.',
  Paladin: 'Prepare spells from the entire Paladin spell list. You can change your prepared spells after a long rest.',
  Ranger: 'Prepare spells from the entire Ranger spell list. You can change your prepared spells after a long rest.',
  Wizard: 'Choose 6 spells for your spellbook, then prepare spells from it. You can change prepared spells after a long rest. Ritual spells can be cast from your spellbook without preparing.',

  // Semi-Prepared
  Bard: 'Prepare spells from the Bard spell list. You can only replace one spell when you gain a level.',
  Sorcerer: 'Prepare spells from the Sorcerer spell list. You can only replace one spell when you gain a level.',
  Warlock: 'Prepare spells from the Warlock spell list. You have Pact Magic slots that recover on short rest. You can only replace one spell when you gain a level.'
};
```

---

## Testing Checklist (Level 1 Only)

### Flexible Prepared Casters

- [ ] **Cleric**: 3 cantrips, prepare (1 + WIS mod) spells, shows "change after long rest" info
- [ ] **Druid**: 2 cantrips, prepare (1 + WIS mod) spells, shows "change after long rest" info
- [ ] **Paladin**: 0 cantrips, prepare (1 + CHA mod) spells, shows "change after long rest" info
- [ ] **Ranger**: 0 cantrips, prepare (1 + WIS mod) spells, shows "change after long rest" info
- [ ] **Wizard**: 3 cantrips, 6 spellbook spells, prepare (1 + INT mod) from book, ritual badges shown

### Semi-Prepared Casters

- [ ] **Bard**: 2 cantrips, prepare 4 spells, shows "replace one at level up" info
- [ ] **Sorcerer**: 4 cantrips, prepare 2 spells, shows "replace one at level up" info
- [ ] **Warlock**: 2 cantrips, prepare 2 spells, shows Pact Magic panel + "replace one at level up" info

### Third-Casters & Non-Casters

- [ ] **Fighter/Rogue**: Info panel at L1-2: "spellcasting at level 3"
- [ ] **Barbarian/Monk**: Spell selection step skipped entirely

### Validation

- [ ] Cannot exceed cantrip limit
- [ ] Cannot exceed prepared limit
- [ ] Wizard cannot prepare spells outside spellbook
- [ ] Cannot select level 2+ spells at level 1
- [ ] Next button disabled until valid

### Subclass Scaffolding (Future-Proofing)

- [ ] `deriveAlwaysPreparedSpells()` returns empty array at L1
- [ ] UI handles empty always-prepared list gracefully
- [ ] Code structure supports future domain/oath spell integration

---

## File Structure

```
frontend/src/
├── components/wizard-steps/
│   ├── SpellSelectionWizard.tsx  (UPDATE - main component)
│   ├── SpellbookStep.tsx         (NEW - Wizard spellbook selection)
│   └── PreparedSpellsStep.tsx    (NEW - Wizard prepared selection)
├── helpers/
│   ├── spellRules.ts             (UPDATE - prepared model)
│   ├── spellcastingConfig.ts     (UPDATE - CLASS_CONFIG with casterType)
│   └── deriveGrantedSpells.ts    (NEW - subclass spell hook, returns [] at L1)
├── data/
│   └── subclassSpells.ts         (NEW - empty scaffold for future)
└── types/
    └── spells.ts                 (UPDATE - CasterType, ClassCastingConfig)
```

---

## Implementation Priority

### **Sprint 1: Core Fixes (High Priority)**
1. ✅ Update type system (`CasterType`, remove "known" terminology)
2. ✅ Update `CLASS_CONFIG` with correct L1 numbers for all classes
3. ✅ Remove incorrect Ranger/Paladin early exits
4. ✅ Add caster type info panels (flexible vs semi-prepared)
5. ✅ Implement Wizard two-step (spellbook → prepared)
6. ✅ Add Warlock Pact Magic indicator
7. ✅ Fix validation to use prepared model

### **Sprint 2: Subclass Scaffolding (Medium Priority)**
1. Create `deriveGrantedSpells.ts` with future hooks
2. Add `SUBCLASS_CONFIG` stub (empty at L1)
3. Update UI to render always-prepared spells as locked chips (if any)
4. Add `isAlwaysPrepared()` helper for validation exclusion

### **Sprint 3: Polish & UX (Low Priority)**
1. Add ritual casting indicators
2. Add class-specific help text
3. Improve sorting and filtering
4. Add spell tooltips with full descriptions

---

## Estimated Effort

- **Sprint 1**: 10-14 hours
- **Sprint 2**: 3-4 hours
- **Sprint 3**: 4-6 hours

**Total**: ~17-24 hours of development

---

## Success Criteria

✅ All classes use the 2024 prepared spell model (flexible or semi-prepared)
✅ Ranger and Paladin can select spells at level 1
✅ Wizard has distinct spellbook and prepared spell selection
✅ Warlock shows Pact Magic mechanics
✅ Third-casters show info panel at L1-2
✅ Validation prevents invalid selections
✅ Subclass hooks exist (inactive) for future domain/oath spell integration
✅ User can complete character creation without errors

---

## Notes

- **Terminology change**: Replace all "known caster" references with "semi-prepared caster"
- **Ranger fix**: Critical correction - Rangers DO get spells at level 1 in 2024 rules
- **Subclass deferral**: Domain/oath spells are scaffolded but not implemented at L1
- **School restrictions**: Removed in 2024 (EK/AT no longer have Evocation/Abjuration restrictions)
- **AT Mage Hand**: Still required at level 3 (out of scope for L1 implementation)
- **Refactoring**: Consider breaking up 1589-line component into smaller, focused components
