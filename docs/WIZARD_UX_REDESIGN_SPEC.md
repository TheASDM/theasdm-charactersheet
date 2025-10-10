# Character Generator Wizard UX Redesign - Technical Specification

## Executive Summary

This document outlines the technical implementation plan for redesigning the D&D 2024 Character Generator wizard with a streamlined UX focused on:
- Persistent bottom navigation
- Two-action pattern (Details/Select) for all choices
- Auto-scroll behavior on completion
- Compact modals for configuration
- Removal of equipment step (auto-derived)
- Unified Review step with edit capabilities

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Global Infrastructure](#global-infrastructure)
3. [Component Specifications](#component-specifications)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [State Management](#state-management)
6. [Accessibility Requirements](#accessibility-requirements)
7. [Migration Strategy](#migration-strategy)
8. [Testing Plan](#testing-plan)

---

## Architecture Overview

### Current Architecture
```
CharacterGeneratorWizard (main container)
├── Step components (0-5, spell wizard, equipment, review)
├── WizardControls (bottom nav - currently inline per step)
├── WizardProgress (top progress bar)
└── Zustand store (characterBuilderStore)
```

### New Architecture
```
CharacterGeneratorWizard (main container)
├── WizardHeader (progress indicator)
├── WizardContent (step content)
├── PersistentBottomNav (sticky, always visible)
│   ├── BackButton
│   ├── NextButton
│   └── ReviewButton (shows when eligible)
├── Step components (refactored)
│   ├── CompactList/Grid/Table
│   ├── DetailsModal (read-only)
│   └── SelectModal (config inputs)
└── Zustand store (enhanced with draft state)
```

---

## Global Infrastructure

### 1. Persistent Bottom Navigation

**File:** `frontend/src/components/wizard/PersistentBottomNav.tsx`

**Purpose:** Sticky bottom navigation that persists across all wizard steps

**Props:**
```typescript
interface PersistentBottomNavProps {
  canGoBack: boolean;
  canGoNext: boolean;
  canReview: boolean;
  onBack: () => void;
  onNext: () => void;
  onReview: () => void;
  currentStepLabel: string;
  isNextDisabled?: boolean;
  nextLabel?: string; // Default: "Next"
}
```

**Behavior:**
- Always visible at bottom of viewport (position: sticky or fixed)
- On mobile: full width, minimal padding
- On desktop: centered, max-width constraint
- Back button: disabled on first step
- Next button: disabled until step requirements met
- Review button: only shows when all required steps complete

**Styling Requirements:**
- z-index: 1000 (above content, below modals)
- Background: semi-transparent dark with backdrop-blur
- Border-top: 1px solid theme border
- Box-shadow for elevation
- Smooth transitions on disable state

**Accessibility:**
- Skip link from top to bottom nav
- Focus indicator clearly visible
- Keyboard shortcuts: Alt+Left (back), Alt+Right (next), Alt+R (review)

---

### 2. Auto-Scroll Utility

**File:** `frontend/src/utils/autoScroll.ts`

**Purpose:** Smoothly scroll to bottom nav when step requirements met

```typescript
interface AutoScrollOptions {
  behavior?: ScrollBehavior; // 'smooth' | 'auto'
  offset?: number; // pixels above target
  onComplete?: () => void;
  shouldStealFocus?: boolean; // default: false
}

export function scrollToBottomNav(options?: AutoScrollOptions): void;

// Hook version for React components
export function useAutoScroll(): {
  scrollToBottom: (options?: AutoScrollOptions) => void;
  isScrolling: boolean;
};
```

**Implementation:**
```typescript
// Scroll to bottom nav without stealing focus
export function scrollToBottomNav(options: AutoScrollOptions = {}) {
  const {
    behavior = 'smooth',
    offset = 20,
    onComplete,
    shouldStealFocus = false,
  } = options;

  const bottomNav = document.getElementById('persistent-bottom-nav');
  if (!bottomNav) return;

  const targetY = bottomNav.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: targetY,
    behavior,
  });

  if (onComplete) {
    // Wait for scroll animation to complete
    setTimeout(onComplete, behavior === 'smooth' ? 500 : 0);
  }

  if (!shouldStealFocus) {
    // Preserve current focus
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      setTimeout(() => activeElement?.focus(), 100);
    }
  }
}
```

**Trigger Conditions:**
- When selection count reaches maximum required
- When all required fields in a step are filled
- NOT triggered on every selection, only on completion

---

### 3. Two-Action Modal System

**Files:**
- `frontend/src/components/wizard/DetailsModal.tsx` (read-only)
- `frontend/src/components/wizard/SelectModal.tsx` (config)

#### DetailsModal (Read-Only)

**Purpose:** Show full information about a choice (class, background, species, feat, spell)

```typescript
interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Behavior:**
- Read-only content display
- No form inputs
- Single "Close" button in footer
- Escape key closes
- Focus returns to trigger button on close

#### SelectModal (Configuration)

**Purpose:** Compact modal with ONLY the inputs needed for a specific choice

```typescript
interface SelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string; // Default: "Confirm"
  isConfirmDisabled?: boolean;
  showCancel?: boolean; // Default: true
}
```

**Behavior:**
- Shows only necessary configuration inputs
- Confirm button triggers onConfirm callback
- On confirm: close modal, trigger auto-scroll if step complete
- Cancel button (optional) discards changes
- Escape key = cancel
- Focus management: returns to trigger on close

**Standard Pattern:**
```tsx
<SelectModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={(data) => {
    handleSelection(data);
    setIsOpen(false);
    // Auto-scroll triggered by parent if step complete
  }}
  title="Configure Wizard"
>
  {/* Only required inputs */}
  <SubclassSelector />
  <SkillProficiencyPicker count={2} />
</SelectModal>
```

---

### 4. Compact List/Grid/Table Components

**Files:**
- `frontend/src/components/wizard/CompactList.tsx`
- `frontend/src/components/wizard/CompactGrid.tsx`
- `frontend/src/components/wizard/CompactTable.tsx`

#### Common Props
```typescript
interface CompactItemProps<T> {
  item: T;
  isSelected?: boolean;
  onDetails: (item: T) => void;
  onSelect: (item: T) => void;
  detailsLabel?: string; // Default: "Details"
  selectLabel?: string; // Default: "Select"
  renderSummary?: (item: T) => React.ReactNode;
}
```

**Visual Pattern:**
```
┌────────────────────────────────────────────┐
│ Item Name               [Details] [Select] │
│ Brief one-line summary                     │
│ ✓ Selected indicator (if selected)        │
└────────────────────────────────────────────┘
```

**Interaction:**
- Details button: Opens DetailsModal
- Select button: Opens SelectModal OR immediately selects (if no config needed)
- Two actions per row ensures consistent UX
- Keyboard: Tab between items, Enter/Space activates focused button

---

## Component Specifications

### CharacterGeneratorWizard (Main Container)

**File:** `frontend/src/components/CharacterGeneratorWizard.tsx`

**Major Changes:**
1. Remove `WizardControls` from each step
2. Add `<PersistentBottomNav>` at root level
3. Update step rendering to use new compact components
4. Add auto-scroll hooks to trigger on step completion
5. Track "canReview" state (all required steps complete)

**New State:**
```typescript
const [canReview, setCanReview] = useState(false);
const [isStepComplete, setIsStepComplete] = useState<Record<WizardStep, boolean>>({});

// Update on every step change
useEffect(() => {
  const allRequiredComplete = REQUIRED_STEPS.every(step => isStepComplete[step]);
  setCanReview(allRequiredComplete);
}, [isStepComplete]);
```

**Bottom Nav Integration:**
```tsx
<PersistentBottomNav
  canGoBack={canGoBack()}
  canGoNext={canGoNext()}
  canReview={canReview}
  onBack={goBack}
  onNext={goNext}
  onReview={() => setCurrentStep('review-create')}
  currentStepLabel={STEP_LABELS[currentStep]}
  isNextDisabled={!isCurrentStepComplete()}
/>
```

---

## Step-by-Step Implementation

### Step 1: Ability Scores (Home)

**File:** `frontend/src/components/wizard-steps/Step1_AbilityScores.tsx`

**Current State:**
- Player name field
- Ability score method selector
- Inline assignment UI

**New Design:**

**UI Structure:**
```
┌──────────────────────────────────────────────────┐
│ Ability Scores                                   │
│                                                  │
│ Choose your method:                              │
│                                                  │
│ ┌─────────────────┐  ┌──────────────────┐      │
│ │ Standard Array  │  │ Roll Custom      │       │
│ │ [✓ Selected]    │  │                  │       │
│ └─────────────────┘  └──────────────────┘      │
│                                                  │
│ Assign your scores:                              │
│ ┌──────────────────────────────────────────┐   │
│ │ STR [15▼] DEX [14▼] CON [13▼]           │   │
│ │ INT [12▼] WIS [10▼] CHA [ 8▼]           │   │
│ │ ✓ All scores assigned                    │   │
│ └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Changes:**
1. **Remove:** Player name field (not needed for character creation)
2. **Add:** Two-card toggle for method selection
3. **Inline Assignment:** Shows immediately when method selected
4. **Validation:** Prevent duplicates in Standard Array
5. **Auto-scroll:** Triggers when all 6 scores assigned

**Component Structure:**
```tsx
<StepContainer>
  <h2>Ability Scores</h2>

  {/* Method Toggle */}
  <MethodToggle>
    <MethodCard
      isSelected={method === 'standard-array'}
      onClick={() => handleMethodChange('standard-array')}
    >
      <h3>Standard Array</h3>
      <p>15, 14, 13, 12, 10, 8</p>
    </MethodCard>
    <MethodCard
      isSelected={method === 'custom'}
      onClick={() => handleMethodChange('custom')}
    >
      <h3>Roll Custom</h3>
      <p>Enter or roll your scores</p>
    </MethodCard>
  </MethodToggle>

  {/* Assignment UI (conditional) */}
  {method && (
    <AssignmentUI
      method={method}
      scores={scores}
      onScoresChange={handleScoresChange}
      onComplete={() => triggerAutoScroll()}
    />
  )}
</StepContainer>
```

**State Changes:**
```typescript
// Remove from CharacterBuilderData
- playerName: string; // REMOVED

// Keep existing
abilityScoreMethod: 'standard-array' | 'custom';
abilityScores: { str: number, dex: number, ... };
```

**Auto-scroll Trigger:**
```typescript
useEffect(() => {
  const allAssigned = Object.values(scores).every(s => s > 0);
  if (allAssigned && method) {
    scrollToBottomNav({ offset: 20 });
  }
}, [scores, method]);
```

**Invalidation Rules:**
- Switching methods: Confirm dialog → Clear all scores
- Standard Array: Prevent duplicate selections via dropdown logic

---

### Step 2: Class Selection

**File:** `frontend/src/components/wizard-steps/Step2_ClassSelection.tsx`

**Current State:**
- Large class cards in grid
- Modal with tabs for class info, skills, features
- Complex multi-step process

**New Design:**

**UI Structure:**
```
┌──────────────────────────────────────────────────┐
│ Class Selection                                  │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Barbarian    [Details] [Select]          │   │
│ │ Primal warrior with unmatched rage       │   │
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐   │
│ │ Wizard       [Details] [Select]          │   │
│ │ ✓ Selected                                │   │
│ │ Scholar of arcane arts                   │   │
│ └──────────────────────────────────────────┘   │
│ ... (more classes)                               │
└──────────────────────────────────────────────────┘
```

**Details Modal:**
```
┌────────────────────────────────────────────┐
│ Wizard                             [Close] │
├────────────────────────────────────────────┤
│ [Full class description]                   │
│ Hit Die: d6                                │
│ Primary Ability: Intelligence              │
│ Saving Throws: Int, Wis                    │
│ Proficiencies: ...                         │
│ Starting Equipment: ...                    │
│ [Class Features section]                   │
│ [Spellcasting section]                     │
└────────────────────────────────────────────┘
```

**Select Modal (Compact):**
```
┌────────────────────────────────────────────┐
│ Configure Wizard                 [Cancel]  │
├────────────────────────────────────────────┤
│ Choose 2 skill proficiencies:              │
│ ☐ Arcana                                   │
│ ☑ History                                  │
│ ☑ Investigation                            │
│ ☐ Medicine                                 │
│ ... (only available skills)                │
│                                             │
│         [Confirm] (disabled until 2 picked)│
└────────────────────────────────────────────┘
```

**Component Structure:**
```tsx
<StepContainer>
  <h2>Class Selection</h2>
  <CompactList
    items={classes}
    isSelected={(cls) => cls.name === selectedClass}
    onDetails={(cls) => setDetailsModal(cls)}
    onSelect={(cls) => setSelectModal(cls)}
    renderSummary={(cls) => cls.description}
  />

  {/* Details Modal */}
  <DetailsModal
    isOpen={!!detailsModal}
    onClose={() => setDetailsModal(null)}
    title={detailsModal?.name}
    content={<ClassDetailsContent class={detailsModal} />}
  />

  {/* Select Modal */}
  <SelectModal
    isOpen={!!selectModal}
    onClose={() => setSelectModal(null)}
    onConfirm={(data) => handleClassSelection(selectModal, data)}
    title={`Configure ${selectModal?.name}`}
  >
    <SkillProficiencyPicker
      available={selectModal?.availableSkills}
      count={selectModal?.skillCount}
      selected={selectedSkills}
      onChange={setSelectedSkills}
    />
    {/* Additional class-specific choices */}
  </SelectModal>
</StepContainer>
```

**State Updates:**
```typescript
// Store selection + config in one shot
const handleClassSelection = (classData, config) => {
  onUpdate({
    selectedClass: classData.name,
    selectedClassSkills: config.skills,
    selectedClassChoices: config.choices,
    classProficiencies: classData.proficiencies,
    classFeatures: classData.features,
    // ... other derived data
  });

  // Auto-scroll if step complete
  scrollToBottomNav();
};
```

**Invalidation Rules:**
- Changing class: Confirm dialog → Clear skills, choices, spellbook
- Downstream: Clear prepared spells if switching from/to non-caster

---

### Step 3: Background Selection

**File:** `frontend/src/components/wizard-steps/Step3A_BackgroundSelection.tsx`

**Current State:**
- Grid of background cards
- Modal with description and config

**New Design:**

**UI Structure (Table):**
```
┌─────────────────────────────────────────────────────────────────┐
│ Background Selection                                            │
│                                                                 │
│ ┌─────────┬──────────────┬────────────┬─────────────────────┐ │
│ │ Name    │ Skills       │ ASI        │ Actions             │ │
│ ├─────────┼──────────────┼────────────┼─────────────────────┤ │
│ │ Acolyte │ Insight,     │ +2 Int     │ [Details] [Select]  │ │
│ │ ⓘ       │ Religion     │ +1 Wis     │                     │ │
│ ├─────────┼──────────────┼────────────┼─────────────────────┤ │
│ │ Sage    │ Arcana,      │ +2 Int     │ [Details] [Select]  │ │
│ │ ⓘ       │ History      │ +1 Wis     │ ✓ Selected          │ │
│ └─────────┴──────────────┴────────────┴─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Details Modal:**
- Full background description
- Feature details
- Suggested equipment

**Select Modal (Compact):**
```
┌────────────────────────────────────────────┐
│ Configure Sage                   [Cancel]  │
├────────────────────────────────────────────┤
│ Assign Ability Score Increases:            │
│ +2: [Intelligence ▼]                       │
│ +1: [Wisdom ▼]                             │
│                                             │
│ Choose 2 languages:                        │
│ ☑ Draconic                                 │
│ ☑ Elvish                                   │
│ ☐ Dwarvish                                 │
│ ... (available languages)                  │
│                                             │
│                            [Confirm]        │
└────────────────────────────────────────────┘
```

**Component Structure:**
```tsx
<StepContainer>
  <h2>Background Selection</h2>
  <CompactTable
    columns={[
      { key: 'name', label: 'Background', render: (bg) => (
        <>
          {bg.name}
          <IconButton onClick={() => setDetailsModal(bg)}>ⓘ</IconButton>
        </>
      )},
      { key: 'skills', label: 'Skills', render: (bg) => bg.skills.join(', ') },
      { key: 'asi', label: 'ASI', render: (bg) => formatASI(bg.asi) },
      { key: 'actions', label: '', render: (bg) => (
        <>
          <Button onClick={() => setDetailsModal(bg)}>Details</Button>
          <Button onClick={() => setSelectModal(bg)}>Select</Button>
        </>
      )},
    ]}
    data={backgrounds}
    selectedRow={(bg) => bg.name === selectedBackground}
  />
</StepContainer>
```

**Invalidation Rules:**
- Changing background: Confirm → Clear languages, ASI allocations
- Conflict handling: If skill already proficient (from class), offer alternative

---

### Step 4: Species Selection

**File:** `frontend/src/components/wizard-steps/Step3B_SpeciesSelection.tsx`

**Current State:**
- Grid of species cards
- Modal with traits and choices

**New Design:**

**UI Structure:**
```
┌──────────────────────────────────────────────────┐
│ Species Selection                                │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Dragonborn   [Details] [Select]          │   │
│ │ Draconic heritage grants breath weapon   │   │
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐   │
│ │ Human        [Details] [Select]          │   │
│ │ ✓ Selected                                │   │
│ │ Versatile and adaptable                  │   │
│ └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Select Modal (if species has choices):**
```
┌────────────────────────────────────────────┐
│ Configure Dragonborn             [Cancel]  │
├────────────────────────────────────────────┤
│ Choose Draconic Ancestry:                  │
│ ○ Black (Acid, 15-ft line)                 │
│ ● Blue (Lightning, 15-ft line)             │
│ ○ Brass (Fire, 15-ft line)                 │
│ ... (more ancestries)                      │
│                                             │
│                            [Confirm]        │
└────────────────────────────────────────────┘
```

**No Choices Example (Human):**
- Click Select → immediately marks as selected
- Auto-scroll triggered
- No modal opens

**Logic:**
```typescript
const handleSpeciesSelect = (species) => {
  if (species.hasChoices) {
    setSelectModal(species);
  } else {
    // Instant select
    onUpdate({
      selectedSpecies: species.name,
      isHuman: species.name === 'Human',
      speciesTraits: species.traits,
      // ... other data
    });
    scrollToBottomNav();
  }
};
```

**Invalidation Rules:**
- Changing species: Confirm → Clear origin feats if count changes (Human vs non-Human)
- Update feat eligibility based on new species

---

### Step 5: Origin Feats

**File:** `frontend/src/components/wizard-steps/Step3D_OriginFeats.tsx`

**Current State:**
- Searchable grid of feats
- Modal with full feat description

**New Design:**

**UI Structure:**
```
┌──────────────────────────────────────────────────┐
│ Origin Feats                                     │
│ Select 1 feat (2 if Human)                       │
│ ────────────────────────────────────────────┐   │
│ ┌──────────────────────────────────────────┐   │
│ │ Alert          [Details] [Select]        │   │
│ │ Always on the lookout for danger         │   │
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐   │
│ │ Magic Initiate [Details] [Select]        │   │
│ │ ✓ Selected                                │   │
│ │ Learn spells from another class          │   │
│ └──────────────────────────────────────────┘   │
│ ... (more feats)                                 │
│                                                  │
│ Selected: 1 / 2                                  │
└──────────────────────────────────────────────────┘
```

**Select Modal (if feat has choices):**
```
┌────────────────────────────────────────────┐
│ Configure Magic Initiate        [Cancel]   │
├────────────────────────────────────────────┤
│ Choose a class:                            │
│ ○ Cleric                                   │
│ ● Wizard                                   │
│ ○ Druid                                    │
│                                             │
│                            [Confirm]        │
└────────────────────────────────────────────┘
```

**Auto-scroll Logic:**
```typescript
useEffect(() => {
  if (selectedFeats.length === requiredFeatCount) {
    scrollToBottomNav();
  }
}, [selectedFeats, requiredFeatCount]);
```

**Invalidation Rules:**
- Prevent selecting more than required count
- Allow deselect to drop below max
- Validate prerequisites (if any future feats have them)

---

### Steps 6-8: Spell Selection (Unified Pattern)

**Files:**
- `frontend/src/components/wizard-steps/SpellSelectionWizard.tsx` (refactor)

**Current State:**
- Multi-step wizard within wizard
- Different UI for cantrips, spellbook, prepared

**New Design:**
All three spell selection steps use the same pattern:

**UI Structure:**
```
┌──────────────────────────────────────────────────┐
│ Cantrips                                         │
│ Selected: 3 / 4                                  │
│                                                  │
│ [Search: ___________] [School ▼] [Filters...]   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ ☑ Fire Bolt                              │   │
│ │   Evocation • Ranged attack • 1d10 fire  │   │
│ ├──────────────────────────────────────────┤   │
│ │ ☑ Mage Hand                              │   │
│ │   Conjuration • Create spectral hand     │   │
│ ├──────────────────────────────────────────┤   │
│ │ ☐ Prestidigitation                       │   │
│ │   Transmutation • Minor magical tricks   │   │
│ └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Behavior:**
- Click spell row to toggle selection
- Click spell name to open DetailsModal
- Counter updates live
- Auto-scroll when hitting max
- Allow deselect to drop below max

**Unified Component:**
```tsx
<SpellSelectionStep
  title="Cantrips"
  maxSelections={cantripMax}
  availableSpells={cantrips}
  selectedSpells={selectedCantrips}
  onToggle={handleToggleCantrip}
  onComplete={() => scrollToBottomNav()}
/>
```

**Step Flow:**
1. **Cantrips** (if class has them)
2. **Spellbook** (Wizards only - shows after cantrips)
3. **Prepared Spells** (all casters - shows after spellbook or cantrips)

**Navigation:**
- Keep the ref-based handlers we just implemented
- Auto-scroll only when a sub-step is complete
- Next button advances through sub-steps

---

### Equipment Step: REMOVED

**Rationale:** Equipment is auto-derived from class + background

**Implementation:**
1. Remove `Step4_EquipmentSelection.tsx`
2. Remove 'equipment-selection' from WIZARD_STEPS
3. Create `deriveEquipment()` utility function

**File:** `frontend/src/utils/deriveEquipment.ts`

```typescript
export function deriveEquipment(data: CharacterBuilderData): string[] {
  const equipment: string[] = [];

  // From class
  if (data.classStartingEquipment) {
    equipment.push(...data.classStartingEquipment);
  }

  // From background
  if (data.backgroundStartingEquipment) {
    equipment.push(...data.backgroundStartingEquipment);
  }

  // TODO: Handle class/background choice branches
  // TODO: Filter by proficiency prerequisites

  return equipment;
}
```

**Review Step Integration:**
```tsx
<SectionCard title="Equipment">
  <EquipmentList items={deriveEquipment(builderData)} />
  <Note>Equipment can be adjusted after character creation</Note>
</SectionCard>
```

---

### Review Step (Final)

**File:** `frontend/src/components/wizard-steps/Step5_ReviewCreate.tsx`

**Current State:**
- Shows character summary
- Create button generates character

**New Design:**

**UI Structure:**
```
┌──────────────────────────────────────────────────┐
│ Review Your Character                            │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ Ability Scores                  [Edit]  │    │
│ │ STR 15, DEX 14, CON 13, INT 12, ...     │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ Species                         [Edit]  │    │
│ │ Human                                   │    │
│ │ • Resourceful (feat)                    │    │
│ │ • Versatile (skill proficiency)         │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ Class                           [Edit]  │    │
│ │ Wizard (Evoker)                         │    │
│ │ • Skills: Arcana, History               │    │
│ │ • HP: 8 + CON mod                       │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ ... (more sections)                              │
│                                                  │
│ [Save Draft] [Generate Character Sheet]         │
└──────────────────────────────────────────────────┘
```

**Section Cards:**
1. Ability Scores
2. Species
3. Class
4. Background
5. Origin Feats
6. Cantrips (if applicable)
7. Spellbook (Wizards only)
8. Prepared Spells (if applicable)
9. Equipment (derived)

**Edit Links:**
```typescript
const handleEdit = (step: WizardStep) => {
  // Jump back to that step
  setCurrentStep(step);
  // State is preserved
};
```

**Generate Button:**
```typescript
const handleGenerate = async () => {
  // Validate all required fields
  if (!isFullyComplete()) {
    toast.error('Please complete all required steps');
    return;
  }

  // Call backend to create character
  const character = await createCharacter(builderData);

  // Navigate to character sheet
  navigate(`/characters/${character.id}`);
};
```

---

## State Management

### CharacterBuilderData Type Updates

**Remove:**
```typescript
// Step 0 removed
- playerName: string;

// Equipment step removed (derived instead)
- selectedEquipment: { armor?: string; ... };
```

**Keep All Other Fields**

### New Store Helpers

**File:** `frontend/src/store/characterBuilderHelpers.ts`

```typescript
// Check if a step is complete
export function isStepComplete(
  step: WizardStep,
  data: CharacterBuilderData
): boolean {
  switch (step) {
    case 'ability-scores':
      return Object.values(data.abilityScores).every(s => s > 0);
    case 'class-selection':
      return !!data.selectedClass && data.selectedClassSkills.length > 0;
    // ... etc
  }
}

// Check if can proceed to review
export function canReview(data: CharacterBuilderData): boolean {
  const required: WizardStep[] = [
    'ability-scores',
    'class-selection',
    'background-selection',
    'species-selection',
    'origin-feats',
  ];
  return required.every(step => isStepComplete(step, data));
}

// Invalidate dependent fields when a step changes
export function invalidateDependentFields(
  changed: WizardStep,
  updates: Partial<CharacterBuilderData>
): Partial<CharacterBuilderData> {
  const result = { ...updates };

  if (changed === 'class-selection') {
    // Clear spells if switching from/to non-caster
    result.spellbook = { known: [], prepared: [] };
  }

  if (changed === 'species-selection') {
    // Clear feats if Human status changed
    if (updates.isHuman !== undefined) {
      result.selectedOriginFeats = [];
    }
  }

  // ... more invalidation rules

  return result;
}
```

---

## Accessibility Requirements

### Focus Management

**After Modal Close:**
```typescript
const modalTriggerRef = useRef<HTMLButtonElement>(null);

const handleModalClose = () => {
  setIsModalOpen(false);
  // Return focus to trigger button
  setTimeout(() => modalTriggerRef.current?.focus(), 100);
};
```

**Modal Tab Trap:**
```typescript
// In modal component
useEffect(() => {
  if (!isOpen) return;

  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  document.addEventListener('keydown', handleTab);
  firstElement?.focus();

  return () => document.removeEventListener('keydown', handleTab);
}, [isOpen]);
```

### Keyboard Shortcuts

**Global Shortcuts:**
- Alt+Left: Back
- Alt+Right: Next
- Alt+R: Review (when available)
- Escape: Close modal

**Announce to Screen Readers:**
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>
```

### ARIA Labels

**All Buttons:**
```tsx
<button aria-label="View Wizard class details">Details</button>
<button aria-label="Select Wizard as your class">Select</button>
<button aria-label="Go to previous step">Back</button>
```

**Progress Indicator:**
```tsx
<nav aria-label="Character creation progress">
  <ol>
    <li aria-current={currentStep === 'ability-scores' ? 'step' : undefined}>
      Ability Scores
    </li>
    ...
  </ol>
</nav>
```

---

## Migration Strategy

### Phase 1: Infrastructure (Week 1)
- [ ] Create PersistentBottomNav component
- [ ] Create auto-scroll utility + hook
- [ ] Create DetailsModal and SelectModal components
- [ ] Create CompactList, CompactGrid, CompactTable components
- [ ] Add accessibility utilities (focus trap, keyboard handler)

### Phase 2: Step Refactoring (Week 2-3)
- [ ] Refactor Step 1 (Ability Scores)
- [ ] Refactor Step 2 (Class)
- [ ] Refactor Step 3 (Background)
- [ ] Refactor Step 4 (Species)
- [ ] Refactor Step 5 (Origin Feats)
- [ ] Refactor Steps 6-8 (Spells)
- [ ] Remove Equipment step
- [ ] Update Review step

### Phase 3: Integration & Testing (Week 4)
- [ ] Integrate PersistentBottomNav
- [ ] Wire up all auto-scroll triggers
- [ ] Test invalidation rules
- [ ] Accessibility audit
- [ ] Mobile responsive testing
- [ ] End-to-end character creation flow

### Rollout Strategy
- Feature flag: `ENABLE_NEW_WIZARD_UX`
- Beta test with small group
- Collect feedback
- Full release

---

## Testing Plan

### Unit Tests
- [ ] Auto-scroll utility
- [ ] Modal focus management
- [ ] Step completion validation
- [ ] Equipment derivation logic
- [ ] Invalidation helpers

### Integration Tests
- [ ] Full wizard flow (Ability → Review)
- [ ] Back/Next navigation
- [ ] Modal open/close
- [ ] Auto-scroll triggers

### Accessibility Tests
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Focus management
- [ ] ARIA label coverage

### Manual Testing Checklist
- [ ] Mobile (iOS Safari, Android Chrome)
- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Tablet
- [ ] High contrast mode
- [ ] Zoom to 200%
- [ ] Keyboard-only navigation

---

## File Structure

```
frontend/src/
├── components/
│   ├── wizard/
│   │   ├── PersistentBottomNav.tsx          [NEW]
│   │   ├── DetailsModal.tsx                 [NEW]
│   │   ├── SelectModal.tsx                  [NEW]
│   │   ├── CompactList.tsx                  [NEW]
│   │   ├── CompactGrid.tsx                  [NEW]
│   │   ├── CompactTable.tsx                 [NEW]
│   │   └── WizardModal.tsx                  [KEEP - for other uses]
│   ├── wizard-steps/
│   │   ├── Step0_CharacterInfo.tsx          [REMOVE - merged into Step1]
│   │   ├── Step1_AbilityScores.tsx          [REFACTOR]
│   │   ├── Step2_ClassSelection.tsx         [REFACTOR]
│   │   ├── Step3A_BackgroundSelection.tsx   [REFACTOR]
│   │   ├── Step3B_SpeciesSelection.tsx      [REFACTOR]
│   │   ├── Step3D_OriginFeats.tsx           [REFACTOR]
│   │   ├── Step4_EquipmentSelection.tsx     [REMOVE]
│   │   ├── Step5_ReviewCreate.tsx           [REFACTOR]
│   │   └── SpellSelectionWizard.tsx         [REFACTOR]
│   └── CharacterGeneratorWizard.tsx         [REFACTOR]
├── utils/
│   ├── autoScroll.ts                        [NEW]
│   ├── deriveEquipment.ts                   [NEW]
│   ├── focusManagement.ts                   [NEW]
│   └── keyboardShortcuts.ts                 [NEW]
├── store/
│   └── characterBuilderHelpers.ts           [NEW]
└── hooks/
    ├── useAutoScroll.ts                     [NEW]
    ├── useFocusTrap.ts                      [NEW]
    └── useKeyboardShortcut.ts               [NEW]
```

---

## Open Questions / Decisions Needed

1. **Confirmation dialogs:** Should method/class/species changes always confirm, or only if data will be lost?

2. **Auto-scroll timing:** Should we scroll immediately on completion, or wait 300ms to show success state?

3. **Mobile bottom nav:** Fixed position or sticky? (Fixed stays on screen during scroll, sticky only at bottom)

4. **Equipment derivation:** How detailed should we get with choice branches (e.g., "leather armor OR scale mail")?

5. **Save Draft:** Should we auto-save to localStorage, or only save on explicit button click?

6. **Review step position:** Should Review be reachable at any time via bottom nav, or only after all required steps?

---

## Success Metrics

### User Experience
- Time to create character: < 5 minutes (target)
- Number of clicks reduced by ~40%
- Modal open/close interactions feel smooth
- Zero accessibility violations (WCAG 2.1 AA)

### Technical
- Build passes with no warnings
- 90%+ test coverage on new components
- No console errors in production
- Mobile responsive on all target devices

---

## Appendix: Component API Reference

### PersistentBottomNav

```typescript
interface PersistentBottomNavProps {
  canGoBack: boolean;
  canGoNext: boolean;
  canReview: boolean;
  onBack: () => void;
  onNext: () => void;
  onReview: () => void;
  currentStepLabel: string;
  isNextDisabled?: boolean;
  nextLabel?: string;
}
```

### DetailsModal

```typescript
interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
}
```

### SelectModal

```typescript
interface SelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  isConfirmDisabled?: boolean;
  showCancel?: boolean;
}
```

### CompactList

```typescript
interface CompactListProps<T> {
  items: T[];
  isSelected?: (item: T) => boolean;
  onDetails: (item: T) => void;
  onSelect: (item: T) => void;
  renderSummary?: (item: T) => React.ReactNode;
  detailsLabel?: string;
  selectLabel?: string;
}
```

### useAutoScroll

```typescript
function useAutoScroll(): {
  scrollToBottom: (options?: AutoScrollOptions) => void;
  isScrolling: boolean;
}

interface AutoScrollOptions {
  behavior?: ScrollBehavior;
  offset?: number;
  onComplete?: () => void;
  shouldStealFocus?: boolean;
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-10
**Author:** Claude (Anthropic)
**Status:** Ready for Review
