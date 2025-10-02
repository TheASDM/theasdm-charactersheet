# New Data Structure Mapping Guide

## Overview
The processed class data has been updated with new properties to handle choices, scaling, and granted features. This document maps OLD → NEW patterns and explains how to handle each.

---

## 1. CHOICE FEATURES (User Selection Required)

### Pattern Recognition
```json
{
  "isChoice": true,
  "requiresSelection": true,
  "choiceGroup": "choice-name-level"
}
```

### Examples from Data

#### Cleric Level 1 - Divine Order
```json
// Option 1
{
  "id": "divine-order-protector-1",
  "name": "Divine Order: Protector",
  "choiceGroup": "divine-order-1",
  "isChoice": true,
  "requiresSelection": true,
  "description": "Trained for battle, you gain proficiency with Martial weapons and training with Heavy armor."
}

// Option 2
{
  "id": "divine-order-thaumaturge-1",
  "name": "Divine Order: Thaumaturge",
  "choiceGroup": "divine-order-1",
  "isChoice": true,
  "requiresSelection": true,
  "description": "You know one extra cantrip from the Cleric spell list..."
}
```

#### Cleric Level 7 - Blessed Strikes
```json
// Option 1
{
  "id": "blessed-strikes-divine-strike-7",
  "name": "Blessed Strikes: Divine Strike",
  "choiceGroup": "blessed-strikes-7",
  "isChoice": true,
  "requiresSelection": true
}

// Option 2
{
  "id": "blessed-strikes-potent-spellcasting-7",
  "name": "Blessed Strikes: Potent Spellcasting",
  "choiceGroup": "blessed-strikes-7",
  "isChoice": true,
  "requiresSelection": true
}
```

#### Rogue Level 5 - Cunning Strike Options
```json
// 3 options, character chooses which ones to learn
{
  "id": "cunning-strike-poison-cost-1d6-5",
  "name": "Cunning Strike: Poison (Cost: 1d6)",
  "choiceGroup": "cunning-strike-5",
  "isChoice": true,
  "requiresSelection": true
}
// ... Trip and Withdraw options follow same pattern
```

### Implementation Strategy

**Detection:**
- When processing features at a level, group by `choiceGroup`
- If any feature in the level has `isChoice: true` and `requiresSelection: true`, trigger choice UI

**Storage:**
```typescript
// On character object
selectedClassChoices: {
  "divine-order-1": ["Divine Order: Protector"],  // Single choice
  "cunning-strike-5": ["Cunning Strike: Poison", "Cunning Strike: Trip"]  // Multiple allowed
}
```

**Display Rules:**
- ONLY show selected options in the character's feature list
- DO NOT show the "parent" feature (e.g., don't show generic "Divine Order")
- DO NOT show non-selected options

---

## 2. GRANTED OPTIONS (Automatic Sub-Features)

### Pattern Recognition
```json
{
  "grantedOptions": ["option-id-1", "option-id-2"],
  // Sub-features have:
  "parentFeature": "parent-feature-id",
  "usageType": "granted-option"
}
```

### Examples from Data

#### Cleric Level 2 - Channel Divinity
```json
// Parent feature
{
  "id": "channel-divinity-2",
  "name": "Channel Divinity",
  "grantedOptions": ["divine-spark-2", "turn-undead-2"],
  "mechanics": {
    "uses": 2,
    "rechargeOn": ["short-rest", "long-rest"]
  },
  "scalingProgression": [
    { "level": 6, "changes": { "uses": 3 } },
    { "level": 18, "changes": { "uses": 4 } }
  ]
}

// Sub-feature 1
{
  "id": "divine-spark-2",
  "name": "Divine Spark",
  "parentFeature": "channel-divinity-2",
  "usageType": "granted-option"
}

// Sub-feature 2
{
  "id": "turn-undead-2",
  "name": "Turn Undead",
  "parentFeature": "channel-divinity-2",
  "usageType": "granted-option"
}
```

### Implementation Strategy

**Detection:**
- When processing a feature with `grantedOptions` array
- Automatically include ALL listed sub-features

**Display Rules:**
- Show the parent feature with its description
- Show all granted sub-features as separate features
- Track uses/recharge on the parent, but document effects in sub-features

---

## 3. SCALING FEATURES (Level-Based Changes)

### Pattern Recognition
```json
{
  "scales": true,
  "scalingProgression": [
    {
      "level": 3,
      "changes": {
        "damage": "2d6",
        "diceRolls": ["2d6"]
      }
    }
  ]
}
```

### Examples from Data

#### Rogue - Sneak Attack
```json
{
  "id": "sneak-attack-1",
  "name": "Sneak Attack",
  "scales": true,
  "mechanics": {
    "damage": "1d6"
  },
  "scalingProgression": [
    { "level": 3, "changes": { "damage": "2d6" } },
    { "level": 5, "changes": { "damage": "3d6" } },
    { "level": 7, "changes": { "damage": "4d6" } },
    // ... continues to level 19
  ]
}
```

#### Cleric - Divine Spark (sub-feature of Channel Divinity)
```json
{
  "id": "divine-spark-2",
  "mechanics": {
    "diceRolls": ["1d8"]
  },
  "scalingProgression": [
    { "level": 7, "changes": { "damage": "2d8" } },
    { "level": 13, "changes": { "damage": "3d8" } },
    { "level": 18, "changes": { "damage": "4d8" } }
  ]
}
```

### Implementation Strategy

**Detection:**
- Check `scales: true`
- Iterate through `scalingProgression` array
- Apply changes for all levels ≤ character's current level

**Application:**
```typescript
function applyScaling(feature: Feature, characterLevel: number): Feature {
  if (!feature.scales || !feature.scalingProgression) return feature;

  const appliedFeature = { ...feature };

  for (const progression of feature.scalingProgression) {
    if (characterLevel >= progression.level) {
      // Apply changes
      Object.assign(appliedFeature.mechanics, progression.changes);
    }
  }

  return appliedFeature;
}
```

---

## 4. SUBCLASS FEATURES

### Pattern Recognition
```json
{
  "featureType": "subclass",
  "subclass": "Life Domain"
}
```

### Examples from Data

#### Cleric - Life Domain Spells (Level 3)
```json
{
  "id": "life-domain-spells-3",
  "name": "Life Domain Spells",
  "featureType": "subclass",
  "subclass": "Life Domain",
  "mechanics": {
    "spellsByLevel": {
      "3": ["Aid", "Bless", "Cure Wounds", "Lesser Restoration"],
      "5": ["Mass Healing Word", "Revivify"],
      "7": ["Aura of Life", "Death Ward"],
      "9": ["Greater Restoration", "Mass Cure Wounds"]
    }
  }
}
```

### Implementation Strategy

**Detection:**
- Filter features by `featureType: "subclass"`
- Match `subclass` property to character's chosen subclass

**Display Rules:**
- Only show subclass features for the character's chosen subclass
- For spell-granting features with `spellsByLevel`, show spells for current level and below

---

## 5. COMPLETE CLASS EXAMPLES

### Rogue Level 1 Processing

**Features at Level 1:**
- Expertise (no choice) ✓ Show
- Sneak Attack (scaling, no choice) ✓ Show with current damage
- Thieves' Cant (no choice) ✓ Show
- Weapon Mastery (no choice) ✓ Show

**No choices at level 1 for Rogue**

### Rogue Level 5 Processing

**New features:**
- Cunning Strike options (3 choices, character picks some)
  - ⚠️ **REQUIRES USER CHOICE**
  - Show selection UI with Poison, Trip, Withdraw
  - Store selections in `selectedClassChoices["cunning-strike-5"]`
- Uncanny Dodge (no choice) ✓ Show

### Cleric Level 1 Processing

**Features at Level 1:**
- Spellcasting (no choice) ✓ Show
- Divine Order (2 choices, character picks 1)
  - ⚠️ **REQUIRES USER CHOICE**
  - Show selection UI with Protector vs Thaumaturge
  - Store selection in `selectedClassChoices["divine-order-1"]`

---

## 6. DATA ACCESS PATTERNS

### OLD Code (current simpleFeatureGenerator.ts)
```typescript
// Assumes flat feature array, no choice detection
character.classFeatures.forEach((feature: any) => {
  features.push({
    name: feature.name,
    description: parseComplexDnDEntry(feature),
    category: 'Class Feature'
  });
});
```

### NEW Code (needed)
```typescript
function processClassFeatures(character: CharacterSheetData, classData: ClassData) {
  const level = character.level || 1;
  const features: SimpleFeature[] = [];

  // 1. Get all base features for current level and below
  const availableFeatures = classData.features.filter(f =>
    f.level <= level && f.featureType === 'base'
  );

  // 2. Group features by choiceGroup
  const choiceGroups = groupBy(
    availableFeatures.filter(f => f.isChoice && f.requiresSelection),
    'choiceGroup'
  );

  // 3. For each choice group, check if user has made selection
  for (const [choiceGroup, options] of Object.entries(choiceGroups)) {
    const selection = character.selectedClassChoices?.[choiceGroup];

    if (!selection || selection.length === 0) {
      // NO CHOICE MADE - need to prompt user
      return { needsChoice: true, choiceGroup, options };
    }

    // Add only selected features
    selection.forEach(selectedName => {
      const feature = options.find(o => o.name === selectedName);
      if (feature) {
        features.push(formatFeature(feature, level));
      }
    });
  }

  // 4. Add non-choice features
  const nonChoiceFeatures = availableFeatures.filter(f =>
    !f.isChoice || !f.requiresSelection
  );

  nonChoiceFeatures.forEach(feature => {
    // Handle grantedOptions
    if (feature.grantedOptions) {
      features.push(formatFeature(feature, level));

      // Add all granted sub-features
      feature.grantedOptions.forEach(optionId => {
        const subFeature = classData.features.find(f => f.id === optionId);
        if (subFeature) {
          features.push(formatFeature(subFeature, level));
        }
      });
    } else {
      features.push(formatFeature(feature, level));
    }
  });

  return { needsChoice: false, features };
}

function formatFeature(feature: Feature, characterLevel: number): SimpleFeature {
  // Apply scaling
  const scaledFeature = applyScaling(feature, characterLevel);

  return {
    name: scaledFeature.name,
    description: parseComplexDnDEntry(scaledFeature.description),
    category: 'Class Feature'
  };
}
```

---

## 7. UI REQUIREMENTS

### Choice Selection Modal

**When to trigger:**
- During character creation
- During level-up
- When accessing a character with incomplete choices

**UI Elements:**
```typescript
interface ChoiceModal {
  title: string;           // "Choose Divine Order"
  description: string;     // Feature group description
  options: FeatureOption[];  // List of choices
  selectionMode: 'single' | 'multiple';  // How many can be picked
  minSelections?: number;  // e.g., "choose 2"
  maxSelections?: number;  // e.g., "choose up to 3"
}

interface FeatureOption {
  id: string;
  name: string;
  description: string;
  mechanics: FeatureMechanics;
}
```

**Example Rogue Level 5:**
```
Title: "Choose Cunning Strike Options"
Description: "You gain the ability to use Cunning Strike effects. Choose which effects you know."
Selection Mode: multiple (choose any/all)
Options:
  [ ] Poison (Cost: 1d6) - "You add a toxin to your strike..."
  [ ] Trip (Cost: 1d6) - "If the target is Large or smaller..."
  [ ] Withdraw (Cost: 1d6) - "Immediately after the attack..."
```

**Example Cleric Level 1:**
```
Title: "Choose Divine Order"
Description: "You have dedicated yourself to one of the following sacred roles."
Selection Mode: single (choose 1)
Options:
  ( ) Protector - "Trained for battle, you gain proficiency with Martial weapons..."
  ( ) Thaumaturge - "You know one extra cantrip from the Cleric spell list..."
```

---

## 8. CHARACTER DATA SCHEMA UPDATES

### Add to CharacterSheetData type:

```typescript
interface CharacterSheetData {
  // ... existing properties

  // NEW: Store all class choices
  selectedClassChoices?: {
    [choiceGroup: string]: string[];  // Array of selected feature names
  };

  // NEW: Track incomplete choices (for UI prompts)
  incompleteChoices?: {
    level: number;
    choiceGroup: string;
    options: string[];  // Available option IDs
  }[];
}
```

### Example populated data:

```json
{
  "name": "Brother Cadfael",
  "class": "Cleric",
  "level": 7,
  "selectedClassChoices": {
    "divine-order-1": ["Divine Order: Protector"],
    "blessed-strikes-7": ["Blessed Strikes: Divine Strike"]
  }
}
```

---

## 9. COMMON CHOICE PATTERNS BY CLASS

### Cleric
- **Level 1:** Divine Order (Protector vs Thaumaturge) - **REQUIRED, 1 choice**
- **Level 7:** Blessed Strikes (Divine Strike vs Potent Spellcasting) - **REQUIRED, 1 choice**

### Rogue
- **Level 5:** Cunning Strike (Poison, Trip, Withdraw) - **Choose any/all**
- **Level 14:** Devious Strikes (Daze, Knock Out, Obscure) - **Choose any/all**

### Fighter
- **Level 2:** Fighting Style (10 options) - **REQUIRED, 1 choice**

### Druid
- **Level 1:** Primal Order (Magician vs Warden) - **REQUIRED, 1 choice**
- **Level 7:** Elemental Fury (Potent Spellcasting vs Primal Strike) - **REQUIRED, 1 choice**

### Warlock
- **Levels 2, 5, 7, 9, 12, 15, 18:** Eldritch Invocations - **Choose X based on level**

### Sorcerer
- **Levels 3, 10, 17:** Metamagic - **Choose 2 at level 3, +1 at 10, +1 at 17**

---

## 10. TESTING CHECKLIST

### For Each Class:

- [ ] Level 1 features display correctly
- [ ] Level 1 choices (if any) prompt for selection
- [ ] Non-choice features appear immediately
- [ ] Granted options (like Channel Divinity sub-features) all appear
- [ ] Scaling features show correct values at different levels
- [ ] Subclass features only appear for chosen subclass
- [ ] Choice selections persist after save/reload
- [ ] Unselected choice options don't appear in feature list
- [ ] Template tags in descriptions are parsed correctly

### Specific Rogue Tests:

- [ ] Level 1: Expertise, Sneak Attack (1d6), Thieves' Cant, Weapon Mastery
- [ ] Level 3: Sneak Attack increases to 2d6
- [ ] Level 5: Prompts for Cunning Strike selection
- [ ] Level 5: Shows Uncanny Dodge (non-choice)
- [ ] Level 5: Sneak Attack increases to 3d6
- [ ] Level 14: Prompts for Devious Strikes selection
- [ ] Level 19: Sneak Attack shows 10d6

---

## SUMMARY

The new data structure introduces:

1. **`isChoice` + `requiresSelection` + `choiceGroup`**: Mutually exclusive or multi-select features
2. **`grantedOptions`**: Parent features that automatically grant sub-features
3. **`scalingProgression`**: Level-based numeric changes to feature mechanics
4. **`parentFeature` + `usageType`**: Link sub-features to their parents

**Critical implementation rule**: NEVER show features where `isChoice: true` and `requiresSelection: true` unless they've been selected by the user. These must trigger a selection UI.
