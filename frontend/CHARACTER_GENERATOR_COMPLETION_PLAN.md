# Character Generator Completion Plan

## Current Status Assessment (Accurate)

### ✅ FULLY IMPLEMENTED SYSTEMS

#### Background System
- **Location**: `Step3A_BackgroundSelection.tsx`
- **API Integration**: `backgroundService` with full background data
- **Data Extraction**:
  - `backgroundSkillProficiencies` - Array of skill names
  - `backgroundStartingEquipment` - Array of equipment items
  - `backgroundFeatures` - Array of background-specific features
  - Language selection with proper choices
  - Ability score allocations (+1/+1 or +2 system)
- **Data Storage**: All background data stored in `CharacterBuilderData`

#### Feat System
- **Origin Feats**: `Step3D_OriginFeats.tsx` - Category "O" feats
- **Feat Choices**: `Step3E_FeatChoices.tsx` - Complex feat option selection
- **Feat Selection**: Full feat modal, prerequisites checking, selection limits
- **Complex Features**: Skilled (skill/tool selection), Crafter (tool selection), Musician (instrument selection)
- **Data Storage**: `selectedOriginFeats` array, `featChoices` object with selections

#### Equipment System
- **Location**: `Step4_EquipmentSelection.tsx`
- **Features**: Full equipment database browsing, filtering, search, selection
- **Integration**: Equipment modal with complete item details
- **Data Storage**: Selected equipment stored in builder data

### ❌ MISSING IMPLEMENTATIONS

#### Feature Generation Gap
- **Background Features**: `generateBackgroundFeatures()` returns `[]`
- **Feat Features**: `generateFeatFeatures()` returns `[]`
- **Issue**: Data exists in wizard, but not converted to character sheet features

#### Class System Limitations
- **Missing Choices**: Fighting Style, Divine Order, Warlock Patron, etc.
- **API Features**: Using simple placeholders instead of real 5etools data
- **Complex Features**: Multi-option class features not handled

#### Final Integration
- **Character Creation**: No API call to save character
- **Data Mapping**: Incomplete mapping from wizard → character sheet
- **Validation**: Missing comprehensive validation

---

## PHASE 1: Feature Generation Integration (High Impact, Low Effort)

### 1.1 Background Feature Generation

**File**: `/src/utils/simpleFeatureGenerator.ts`

**Implementation**:
```typescript
function generateBackgroundFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  // Get background features from character data
  // Note: backgroundFeatures comes from characterDataMapper
  if (character.backgroundFeatures) {
    character.backgroundFeatures.forEach(bgFeature => {
      features.push({
        name: bgFeature.name || 'Background Feature',
        description: extractFeatureDescription(bgFeature),
        category: 'Background Feature'
      });
    });
  }

  return features;
}
```

**Data Source**:
- Background features stored in `CharacterBuilderData.backgroundFeatures`
- Mapped via `characterDataMapper.ts` from wizard data
- Need to add `backgroundFeatures` field to `CharacterSheetData` type

**Testing**: Add background features to test page alongside species/class features

### 1.2 Feat Feature Generation

**File**: `/src/utils/simpleFeatureGenerator.ts`

**Implementation**:
```typescript
function generateFeatFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  // Get feat data from character
  if (character.selectedFeats) {
    character.selectedFeats.forEach(featName => {
      // Look up feat details from API or stored data
      const featData = getFeatByName(featName);
      if (featData) {
        features.push({
          name: featData.name,
          description: parseFeatDescription(featData),
          category: 'Feat'
        });
      }
    });
  }

  return features;
}
```

**Challenges**:
- Need access to feat data in feature generator
- Could store full feat objects in character data instead of just names
- Or create feat lookup service for feature generation

**Data Source**:
- Origin feats from `CharacterBuilderData.selectedOriginFeats`
- Feat choices from `CharacterBuilderData.featChoices`
- Need to map these to `CharacterSheetData`

### 1.3 Data Type Extensions

**File**: `/src/types/characterSheet.ts`

**Add Fields**:
```typescript
export interface CharacterSheetData {
  // ... existing fields

  // Background data
  backgroundFeatures?: any[];
  backgroundEquipment?: string[];
  selectedLanguages?: string[];

  // Feat data
  selectedFeats?: string[];
  featChoices?: { [featName: string]: any };
}
```

### 1.4 Character Data Mapper Updates

**File**: `/src/utils/characterDataMapper.ts`

**Add Mappings**:
```typescript
// Map background data
backgroundFeatures: builderData.backgroundFeatures || [],
backgroundEquipment: builderData.backgroundStartingEquipment || [],
selectedLanguages: builderData.selectedLanguages || [],

// Map feat data
selectedFeats: [
  ...(builderData.selectedOriginFeats || []),
  // Add other feat types as implemented
],
featChoices: builderData.featChoices || {},
```

---

## PHASE 2: Class System Enhancement

### 2.1 Class-Specific Choices

**Approach**: Extend `Step3C_SpeciesChoices.tsx` pattern to classes

**Implementation Strategy**:
1. Add class choice rendering to `Step2_ClassSelection.tsx`
2. Store choices in `CharacterBuilderData.classChoices`
3. Use choices in feature generation

**Classes Needing Choices**:

#### Fighter & Paladin - Fighting Style
```typescript
const FIGHTING_STYLES = [
  'Archery', 'Defense', 'Dueling', 'Great Weapon Fighting',
  'Protection', 'Two-Weapon Fighting'
];
```

#### Cleric - Divine Order
```typescript
const DIVINE_ORDERS = ['Protector', 'Thaumaturge'];
```

#### Warlock - Otherworldly Patron
```typescript
const WARLOCK_PATRONS = [
  'Archfey', 'Celestial', 'Fiend', 'Great Old One'
];
```

#### Sorcerer - Sorcerous Origin
```typescript
const SORCEROUS_ORIGINS = [
  'Aberrant Mind', 'Clockwork Soul', 'Divine Soul', 'Storm Sorcery'
];
```

**Implementation Pattern**:
```typescript
// In Step2_ClassSelection.tsx
const renderClassChoices = () => {
  if (selectedClass === 'Fighter' || selectedClass === 'Paladin') {
    return renderFightingStyleChoice();
  }
  if (selectedClass === 'Cleric') {
    return renderDivineOrderChoice();
  }
  // etc.
};
```

### 2.2 Real API Class Features

**Current Issue**: Using placeholder class features instead of rich API data

**API Data Structure** (from analysis):
```typescript
// Class API returns:
{
  classFeatures: {
    "1": [
      {
        name: "Rage",
        entries: ["Complex 5etools format"],
        page: 51
      }
    ]
  }
}
```

**Implementation Strategy**:
1. Create 5etools format parser
2. Extract level 1 features from API data
3. Convert to `SimpleFeature` format
4. Handle feature choices within entries

**Parser Function**:
```typescript
function parse5eToolsClassFeatures(classData: CharacterClass, level: number = 1): SimpleFeature[] {
  const features: SimpleFeature[] = [];
  const levelFeatures = classData.classFeatures?.[level.toString()];

  if (levelFeatures) {
    levelFeatures.forEach(feature => {
      features.push({
        name: feature.name,
        description: parse5eToolsEntries(feature.entries),
        category: 'Class Feature'
      });
    });
  }

  return features;
}

function parse5eToolsEntries(entries: any[]): string {
  // Convert 5etools complex format to simple description
  // Handle {@variantrule Bonus Action|XPHB} → "Bonus Action"
  // Handle nested objects and arrays
  // Return clean, readable description
}
```

### 2.3 Enhanced Class Feature Generation

**File**: `/src/utils/simpleFeatureGenerator.ts`

**Replace Placeholder Implementation**:
```typescript
function generateClassFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  // Get class data from API
  const classData = getClassByName(character.class);
  if (classData) {
    // Parse real API features
    features.push(...parse5eToolsClassFeatures(classData, character.level));

    // Apply class choices to features
    features.forEach(feature => {
      applyClassChoicesToFeature(feature, character.classChoices);
    });
  }

  return features;
}
```

---

## PHASE 3: Final Integration & Polish

### 3.1 Character Creation API

**File**: `/src/services/characterService.ts`

**Add Character Creation**:
```typescript
export const characterService = {
  create: async (characterData: CharacterSheetData): Promise<ApiResponse<Character>> => {
    return apiClient.post<Character>('/characters', characterData);
  }
};
```

**Integration Point**: `Step5_ReviewCreate.tsx`

**Implementation**:
```typescript
const handleCreateCharacter = async () => {
  try {
    setIsCreating(true);

    // Final data validation
    const validatedData = validateCharacterData(finalCharacterData);

    // Create character via API
    const response = await characterService.create(validatedData);

    if (response.data) {
      // Success - redirect to character sheet
      navigate(`/characters/${response.data.id}`);
    } else {
      setError(response.error || 'Failed to create character');
    }
  } catch (error) {
    setError('Failed to create character');
  } finally {
    setIsCreating(false);
  }
};
```

### 3.2 Complete Data Mapping Validation

**File**: `/src/utils/characterDataMapper.ts`

**Validation Function**:
```typescript
export function validateCharacterData(data: CharacterSheetData): CharacterSheetData {
  // Ensure all required fields are present
  // Validate ability scores sum correctly
  // Ensure proficiencies are valid
  // Check equipment constraints
  // Validate feature data integrity

  return data;
}
```

**Missing Mappings Checklist**:
- [ ] Background features → character.backgroundFeatures
- [ ] Feat data → character.selectedFeats, character.featChoices
- [ ] Equipment selections → character.equipment, character.startingEquipment
- [ ] Class choices → character.classChoices
- [ ] Language selections → character.languages

### 3.3 Character Sheet Feature Display

**File**: `/src/components/CharacterTraitsSection.tsx`

**Ensure All Feature Types Display**:
```typescript
const allFeatures = useMemo(() => {
  const generated = generateFeaturesForCharacter(character);

  // Group by category for better display
  const groupedFeatures = groupBy(generated, 'category');

  return {
    species: groupedFeatures['Species Trait'] || [],
    class: groupedFeatures['Class Feature'] || [],
    background: groupedFeatures['Background Feature'] || [],
    feats: groupedFeatures['Feat'] || [],
  };
}, [character]);
```

### 3.4 Test Page Enhancement

**File**: `/src/pages/SpeciesFeaturesTestPage.tsx`

**Add Missing Feature Types**:
```typescript
// Add background feature examples
const backgroundTestCases = [
  { name: 'Acolyte', background: 'Acolyte' },
  { name: 'Criminal', background: 'Criminal' },
  // etc.
];

// Add feat feature examples
const featTestCases = [
  { name: 'Alert', feats: ['Alert'] },
  { name: 'Skilled', feats: ['Skilled'], featChoices: { Skilled: ['Stealth', 'Perception'] }},
  // etc.
];
```

---

## PHASE 4: Advanced Features (Future)

### 4.1 Subclass Integration
- Level 3 subclass selection
- Subclass feature generation
- Subclass-specific choices

### 4.2 Equipment Constraints
- AC calculation from equipped armor
- Weapon proficiency validation
- Encumbrance calculation
- Magic item attunement limits

### 4.3 Advanced Validation
- Multiclass requirements
- Feat prerequisites
- Equipment conflicts
- Ability score minimums

---

## Implementation Priority Queue

### Week 1: Feature Generation (High Impact)
1. Background feature generation
2. Feat feature generation
3. Data type extensions
4. Character data mapper updates
5. Test page enhancement

### Week 2: Class Enhancement
1. Class choice selection UI
2. 5etools format parser
3. Real API class feature integration
4. Class choice application to features

### Week 3: Final Integration
1. Character creation API
2. Complete data mapping validation
3. Character sheet display verification
4. Error handling and edge cases

### Week 4: Polish & Testing
1. Comprehensive testing of full flow
2. UI/UX improvements
3. Performance optimization
4. Documentation updates

---

## Technical Notes

### Data Flow Summary
```
Wizard Steps → CharacterBuilderData → characterDataMapper → CharacterSheetData → generateFeaturesForCharacter → Character Sheet Display
```

### Key Integration Points
1. **CharacterBuilderData**: All wizard selections stored here
2. **characterDataMapper**: Converts wizard data to character sheet format
3. **generateFeaturesForCharacter**: Converts character data to displayable features
4. **CharacterTraitsSection**: Displays all generated features

### Testing Strategy
- Test page for all feature types
- Manual testing of full character creation flow
- API integration testing
- Character sheet display verification

### Risk Mitigation
- Incremental implementation with working fallbacks
- Comprehensive error handling at each integration point
- Data validation at mapper boundaries
- Graceful degradation for missing data