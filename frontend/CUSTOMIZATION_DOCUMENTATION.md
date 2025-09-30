# Character Sheet Customization Documentation

## Current System Overview

The D&D character sheet application currently supports several levels of customization for character data. This document outlines the existing capabilities and provides guidance for improvements.

## 🎯 Current Customization Features

### 1. **Editable Sections System**
The character sheet uses an `editingSections` state system that allows inline editing of various character components:

```typescript
editingSections: {
  characterInfo: boolean  // Name, race, class, level
  abilities: boolean      // Ability scores
  stats: boolean         // HP, AC, speed, initiative
  skills: boolean        // Skill proficiencies
  spells: boolean        // Spell list
  mana: boolean          // Mana points
  actions: boolean       // Combat actions
  inventory: boolean     // Equipment
}
```

**How it works:**
- Each section has an edit button (✎) that toggles edit mode
- In edit mode, fields become input elements
- Changes are saved with ✓ or cancelled with ✕
- Uses `toggleSectionEdit()` and `cancelSectionEdit()` functions

### 2. **Custom Inventory Items**
Users can add completely custom items to their inventory:

**Features:**
- Add custom item button (✏️ Add Custom)
- Custom properties support:
  - Name (required)
  - Quantity
  - Custom damage values
  - Custom AC values
  - Custom weight
  - Equipped/attuned status

**Structure:**
```typescript
InventoryItem {
  id: string
  name: string
  quantity: number
  equipped: boolean
  attuned: boolean
  itemId?: number  // Only for official items
  customProperties?: {
    damage?: string
    ac?: number
    weight?: number
    [key: string]: any
  }
}
```

### 3. **Custom Actions & Combat Options**
The Actions Management Modal allows full customization:

**Features:**
- Add/edit/remove actions
- Custom attack bonuses
- Custom damage formulas
- "Populate from Equipped Items" feature
- Supports any action type (attacks, abilities, etc.)

**Structure:**
```typescript
Action {
  name: string       // e.g., "Fireball", "Sneak Attack"
  atkBonus: string   // e.g., "+7", "DC 15"
  damage: string     // e.g., "8d6 fire", "2d6+3 slashing"
}
```

### 4. **Features & Traits System**
The most advanced customization system with structured features:

**Categories:**
- Class Features
- Species Traits
- Custom Features (fully user-defined)
- Background Features
- Feats
- Magic Item Features

**Custom Traits Management Modal Features:**
- Three tabs: Class Features, Species Traits, Custom Traits
- Add/edit/delete functionality
- Rich text descriptions
- Source tracking

**Structure:**
```typescript
CharacterFeature {
  id: string
  name: string
  description: string
  source: 'class' | 'species' | 'feat' | 'custom' | ...
  type: 'passive' | 'active' | 'reaction' | ...
  // Template variables for dynamic resolution
  variables?: {
    damageByLevel?: { [level: string]: string }
    saveDC?: string | number
    [key: string]: any
  }
}
```

### 5. **Skills Customization**
Skills Management Modal allows:
- Toggle proficiency
- Add expertise
- Custom skill modifiers
- All 18 D&D skills supported

### 6. **Dynamic Feature Templates**
Recently implemented system for dynamic feature resolution:

**Features:**
- Template variables like `${draconicAncestry.damageType}`
- Character context-aware resolution
- Level-based scaling
- Automatic calculation of DCs and modifiers

**Example:**
```typescript
// Template
description: "Deal ${currentDamage} ${damageType} damage"

// Resolves to
"Deal 2d10 fire damage"  // Based on character's draconic ancestry and level
```

## 📝 Current Limitations

1. **No Custom Spell Creation** - Can only select from official spell list
2. **Limited Character Info Editing** - Basic fields only (name, race, class, level)
3. **No Custom Proficiencies** - Cannot add custom tool/weapon/armor proficiencies
4. **No Custom Resources** - Cannot add new resource pools (only HP/Mana)
5. **No Feat Creation** - Can only select from predefined feats
6. **No Notes/Journal Section** - No freeform text area for character notes
7. **No Custom Ability Scores** - Cannot add new abilities beyond the standard 6

## 🚀 Recommended Improvements

### Priority 1: Enhanced Custom Features
- **Rich Text Editor** for feature descriptions (markdown support)
- **Feature Categories** - Allow custom categories beyond existing ones
- **Feature Prerequisites** - Add level/class/ability requirements
- **Feature Resources** - Track uses per rest (short/long)
- **Feature Effects** - Automated bonuses to stats/skills/saves

### Priority 2: Custom Resources System
```typescript
CustomResource {
  id: string
  name: string           // e.g., "Ki Points", "Superiority Dice"
  current: number
  maximum: number | string  // Can be formula like "level * 2"
  recoveryType: 'short' | 'long' | 'daily' | 'never'
  diceSize?: string      // For resources like superiority dice
  color?: string         // Visual customization
}
```

### Priority 3: Notes & Backstory
- **Character Journal** tab with rich text editor
- **Session Notes** - Date-stamped entries
- **NPC Tracker** - Remember important NPCs
- **Quest Log** - Track active quests
- **Backstory Template** - Guided character creation

### Priority 4: Custom Calculations
- **Formula Editor** for custom bonuses
- **Conditional Modifiers** (e.g., "+2 AC when wielding shield")
- **Situational Bonuses** (e.g., "Advantage on saves vs fear")
- **Custom Dice Expressions** for damage/healing

### Priority 5: Visual Customization
- **Theme Selection** - Different color schemes
- **Custom Character Portrait** upload
- **Section Reordering** - Drag and drop layout
- **Hide/Show Sections** - Toggle visibility of unused sections

## 🔧 Implementation Path

### Phase 1: Extend Current Systems
1. Add markdown support to existing description fields
2. Create unified "Custom Content" modal
3. Add import/export for custom content

### Phase 2: New Features
1. Implement Custom Resources system
2. Add Notes/Journal section
3. Create formula parser for calculations

### Phase 3: Polish & UX
1. Add visual customization options
2. Improve mobile responsiveness
3. Add keyboard shortcuts for power users

## 💡 Quick Win Improvements

1. **Add "Custom" tab to every modal** - Consistent place for user content
2. **Copy/Paste buttons** - Duplicate existing items/features
3. **Templates Library** - Save custom content as reusable templates
4. **Bulk Operations** - Edit multiple items at once
5. **Search/Filter** - Find content quickly in large lists

## 🎮 Usage Examples

### Creating a Custom Feature
```javascript
// User creates a custom monk ability
{
  name: "Way of the Shadow Strike",
  description: "Once per turn, when you hit with an unarmed strike, add 1d6 necrotic damage",
  source: "custom",
  type: "passive",
  variables: {
    damageByLevel: {
      "3": "1d6",
      "11": "2d6",
      "17": "3d6"
    }
  }
}
```

### Adding a Custom Resource
```javascript
// User adds a homebrew resource
{
  name: "Spell Slots (Pact Magic)",
  current: 2,
  maximum: "2",
  recoveryType: "short",
  color: "#9c27b0"
}
```

## 🏁 Conclusion

The current system provides solid foundational customization through:
- Editable sections for core stats
- Custom items, actions, and traits
- Dynamic feature templates

The main opportunities for improvement are:
1. Richer content creation tools (markdown, formulas)
2. More types of custom content (resources, notes, calculations)
3. Better organization and management of custom content
4. Visual customization options

The architecture is well-suited for these enhancements, with clear separation between data models and UI components.