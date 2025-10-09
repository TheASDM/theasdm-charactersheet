# Spell Selection Wizard - Comprehensive Refactor Plan

## Current Issues

### 1. **Data Structure Inconsistency**
- API returns spells with `classSpells: [{class: {name: "Wizard"}}]`
- Code expects `classes: ["Wizard"]` array
- `extractSpellClassNames()` handles both, but not used consistently

### 2. **Component Duplication**
- SpellbookStep has its own filtering logic
- PreparedSpellsStep has its own filtering logic
- Main SpellSelectionWizard has filtering logic
- All duplicate the same spell filtering code

### 3. **Performance Issues**
- Filtering happens on every render
- No memoization of filtered results
- API called with broad filters, then client-side filters again

### 4. **UX Issues**
- No loading states between wizard steps
- No indication of filter conflicts (0 results)
- Filters reset between steps
- No "back" button preserves previous selections

## Proposed Architecture

### Phase 1: Unified Data Layer (High Priority)

#### 1.1 Create Unified Spell Filter Hook
**File**: `frontend/src/hooks/useSpellFiltering.ts`

```typescript
export interface SpellFilterOptions {
  classId?: string;
  level?: LevelFilter;
  school?: string;
  ritual?: RitualFilter;
  concentration?: ConcentrationFilter;
  searchTerm?: string;
  minLevel?: number;
  maxLevel?: number;
  excludeCantrips?: boolean;
}

export function useSpellFiltering(
  spells: Spell[],
  options: SpellFilterOptions
) {
  return useMemo(() => {
    return spells.filter((spell) => {
      // Class filter
      if (options.classId) {
        const classNames = extractSpellClassNames(spell as any);
        if (!classNames.includes(options.classId.toLowerCase())) {
          return false;
        }
      }

      // Level filter
      if (options.level !== undefined && options.level !== 'all') {
        if (spell.level !== options.level) return false;
      }

      if (options.minLevel !== undefined && spell.level < options.minLevel) {
        return false;
      }

      if (options.maxLevel !== undefined && spell.level > options.maxLevel) {
        return false;
      }

      if (options.excludeCantrips && spell.level === 0) {
        return false;
      }

      // School filter
      if (options.school && options.school !== 'all') {
        if (spell.school?.toLowerCase() !== options.school.toLowerCase()) {
          return false;
        }
      }

      // Search filter
      if (options.searchTerm) {
        const term = options.searchTerm.toLowerCase();
        if (!spell.name.toLowerCase().includes(term)) {
          return false;
        }
      }

      // Ritual filter
      if (options.ritual === 'ritual' && !spell.isRitual) return false;
      if (options.ritual === 'non' && spell.isRitual) return false;

      // Concentration filter
      const isConcentration = spell.miscTags?.includes('Concentration');
      if (options.concentration === 'conc' && !isConcentration) return false;
      if (options.concentration === 'non' && isConcentration) return false;

      return true;
    });
  }, [spells, options]);
}
```

#### 1.2 Create Unified Spell Grid Component
**File**: `frontend/src/components/spells/SpellGrid.tsx`

```typescript
interface SpellGridProps {
  spells: Spell[];
  selectedSpells: string[];
  grantedSpells?: string[];
  maxSelections?: number;
  onToggle: (spell: Spell) => void;
  onViewDetails: (spell: Spell) => void;
  showRitualBadge?: boolean;
  emptyMessage?: string;
  loading?: boolean;
}

export const SpellGrid: React.FC<SpellGridProps> = ({
  spells,
  selectedSpells,
  grantedSpells = [],
  maxSelections,
  onToggle,
  onViewDetails,
  showRitualBadge,
  emptyMessage = 'No spells found.',
  loading = false,
}) => {
  if (loading) {
    return <LoadingSpinner message="Loading spells..." />;
  }

  if (spells.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <Grid>
      {spells.map((spell) => {
        const spellId = normaliseSpellId(spell.id);
        const isSelected = selectedSpells.includes(spellId);
        const isGranted = grantedSpells.includes(spellId);
        const canSelect = maxSelections === undefined ||
                         selectedSpells.length < maxSelections ||
                         isSelected;

        return (
          <SpellCard
            key={spell.id}
            spell={spell}
            isSelected={isSelected}
            isGranted={isGranted}
            canSelect={canSelect}
            onToggle={onToggle}
            onViewDetails={onViewDetails}
            showRitualBadge={showRitualBadge}
          />
        );
      })}
    </Grid>
  );
};
```

#### 1.3 Create Wizard Context for State Sharing
**File**: `frontend/src/contexts/SpellWizardContext.tsx`

```typescript
interface SpellWizardState {
  // Selections
  cantrips: string[];
  spellbook: string[]; // Wizard only
  prepared: string[];

  // Filters (preserved across steps)
  searchTerm: string;
  levelFilter: LevelFilter;
  schoolFilter: string;
  ritualFilter: RitualFilter;
  concentrationFilter: ConcentrationFilter;

  // Metadata
  classId: string;
  level: number;
  abilityMod: number;
}

interface SpellWizardActions {
  setCantrips: (spells: string[]) => void;
  setSpellbook: (spells: string[]) => void;
  setPrepared: (spells: string[]) => void;
  updateFilters: (filters: Partial<SpellWizardState>) => void;
  reset: () => void;
}

export const SpellWizardProvider: React.FC<{
  children: React.ReactNode;
  initialState: Partial<SpellWizardState>;
}> = ({ children, initialState }) => {
  // State management with persistence
};
```

### Phase 2: Component Refactoring (Medium Priority)

#### 2.1 Simplified Step Components

Each step component becomes a simple wrapper:

```typescript
// SpellbookStep.tsx (NEW SIMPLIFIED VERSION)
export const SpellbookStep: React.FC<{
  onComplete: (spells: string[]) => void;
  onBack?: () => void;
}> = ({ onComplete, onBack }) => {
  const { spellbook, classId, updateFilters, ...filters } = useSpellWizard();
  const { spells, loading } = useSpells(); // Fetches from API

  const filteredSpells = useSpellFiltering(spells, {
    classId,
    minLevel: 1,
    maxLevel: 1,
    excludeCantrips: true,
    ...filters,
  });

  return (
    <WizardStepContainer
      title="Wizard Spellbook - Step 1 of 2"
      subtitle="Choose 6 level 1 spells for your starting spellbook"
    >
      <CounterBar>
        <Counter current={spellbook.length} max={6} label="Spellbook" />
      </CounterBar>

      <InfoPanel>
        <strong>Your Spellbook:</strong>
        <ul>
          <li>Select any 6 level 1 Wizard spells</li>
          <li>You can cast ritual spells from your book without preparing</li>
        </ul>
      </InfoPanel>

      <SpellFiltersBar filters={filters} onChange={updateFilters} />

      <SpellGrid
        spells={filteredSpells}
        selectedSpells={spellbook}
        maxSelections={6}
        onToggle={handleToggle}
        onViewDetails={setSelectedSpell}
        showRitualBadge
        loading={loading}
      />

      <ButtonGroup>
        {onBack && <Button variant="secondary" onClick={onBack}>Back</Button>}
        <Button disabled={spellbook.length !== 6} onClick={() => onComplete(spellbook)}>
          Next: Prepare Spells
        </Button>
      </ButtonGroup>
    </WizardStepContainer>
  );
};
```

#### 2.2 Unified Wizard Container
**File**: `frontend/src/components/wizard-steps/SpellSelectionWizard.tsx` (REFACTORED)

```typescript
export const SpellSelectionWizard: React.FC<Props> = ({ data, onUpdate, onValidityChange }) => {
  const classId = data.selectedClass ?? '';
  const config = CLASS_CONFIG[classId];

  // Early exits
  if (!config || config.casterType === 'none') {
    return <NonCasterMessage classId={classId} />;
  }

  const initialState = {
    cantrips: data.spellbook?.cantrips ?? [],
    spellbook: data.spellbook?.spellbook ?? [],
    prepared: data.spellbook?.prepared ?? [],
    classId,
    level: 1,
    abilityMod: getAbilityMod(data.abilityScores, config.spellcastingAbility),
  };

  return (
    <SpellWizardProvider initialState={initialState}>
      {config.usesSpellbook ? (
        <WizardFlow onUpdate={onUpdate} onValidityChange={onValidityChange} />
      ) : (
        <StandardCasterFlow onUpdate={onUpdate} onValidityChange={onValidityChange} />
      )}
    </SpellWizardProvider>
  );
};
```

### Phase 3: UI/UX Improvements (Low Priority)

#### 3.1 Better Empty States
```typescript
<EmptyState icon="🔍">
  <h3>No spells found</h3>
  <p>Try adjusting your filters or search term.</p>
  <Button onClick={clearFilters}>Clear Filters</Button>
</EmptyState>
```

#### 3.2 Filter Chips (Active Filters Display)
```typescript
<ActiveFilters>
  {searchTerm && <Chip onRemove={() => setSearchTerm('')}>Search: {searchTerm}</Chip>}
  {levelFilter !== 'all' && <Chip onRemove={() => setLevelFilter('all')}>Level: {levelFilter}</Chip>}
  {schoolFilter !== 'all' && <Chip onRemove={() => setSchoolFilter('all')}>School: {schoolLabel}</Chip>}
</ActiveFilters>
```

#### 3.3 Spell Counter with Progress Bar
```typescript
<Counter invalid={count !== max}>
  <Label>Cantrips</Label>
  <Count>{count} / {max}</Count>
  <ProgressBar value={count} max={max} />
</Counter>
```

#### 3.4 Keyboard Navigation
- Arrow keys to navigate spell cards
- Enter to select/deselect
- Escape to close modal
- Tab to cycle through filters

## Implementation Priority

### **Must Have (Sprint 1)** - Fix Current Bugs
1. ✅ Fix `extractSpellClassNames` usage in SpellbookStep
2. ✅ Use unified spell filtering
3. ✅ Fix empty spell lists

### **Should Have (Sprint 2)** - Refactor Architecture
1. Create `useSpellFiltering` hook
2. Create `SpellGrid` component
3. Simplify step components
4. Add `SpellWizardContext`

### **Nice to Have (Sprint 3)** - UX Polish
1. Better empty states
2. Active filter chips
3. Progress bars
4. Keyboard navigation

## Quick Fix (Immediate)

For the current broken spellbook step:

**File**: `frontend/src/components/spells/SpellbookStep.tsx`
**Line**: 142

```typescript
// BEFORE (BROKEN)
const spellClasses = (spell as any).classes || [];
const classNames = extractSpellClassNames(spellClasses);

// AFTER (FIXED)
const classNames = extractSpellClassNames(spell as any);
```

This single change will fix the immediate bug.

## Testing Plan

### Unit Tests
- `useSpellFiltering` with various filter combinations
- `extractSpellClassNames` with different data structures
- Spell selection validation logic

### Integration Tests
- Full Wizard flow (cantrips → spellbook → prepared)
- Full non-Wizard flow (cantrips → prepared)
- Filter persistence across steps
- Back button functionality

### E2E Tests
- Create Wizard character and complete spell selection
- Create Cleric character and complete spell selection
- Create Bard character and complete spell selection
- Verify correct spell counts in final character data

## Success Criteria

✅ All classes can select spells without errors
✅ Filters work correctly and consistently
✅ Empty states show helpful messages
✅ Performance: Filtering <100ms for 500 spells
✅ No duplicate code across components
✅ TypeScript: 0 errors, 0 `any` types in new code
✅ User can complete character creation smoothly

---

**Estimated Effort**:
- Quick Fix: 15 minutes
- Sprint 1 (Must Have): 4-6 hours
- Sprint 2 (Should Have): 8-12 hours
- Sprint 3 (Nice to Have): 4-6 hours

**Total**: ~16-24 hours for full refactor
