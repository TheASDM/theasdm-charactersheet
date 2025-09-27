import { useCallback, useMemo, useState } from 'react';
import {
  CharacterSheetData,
  CharacterSheetProps,
} from '../types/characterSheet';
import { getCharacterResources } from '../utils/resourceDetection';
import {
  calculateDerivedValues,
  getSkillModifiers,
} from '../services/characterCalculations';
import {
  // Layout
  FontImport, SheetContainer, MainLayout, LeftColumn, ThreeColumnContainer, TwoColumnLayout,
  // Character Header
  // Combat/Stats
  // Actions & Traits
} from '../styles/components';
import {
  useInventoryManagement,
  useActionsManagement,
  useSkillsManagement,
  useTraitsManagement,
  useResourceTracking,
  useSelectionModals,
  useAbilityScores,
} from '../hooks/characterSheet';

// Modal imports
import SpeciesSelectionModal from './SpeciesSelectionModal';
import ClassSelectionModal from './ClassSelectionModal';
import BackgroundSelectionModal from './BackgroundSelectionModal';
import {
  AddItemModal,
  ItemDetailsModalComponent,
  DeleteConfirmationModal,
} from './ItemManagementModals';
import FeatSelectionModal from './FeatSelectionModal';
import ActionsManagementModal from './ActionsManagementModal';
import SkillsManagementModal from './SkillsManagementModal';
import TraitsManagementModal from './TraitsManagementModal';
import CharacterHeader from './CharacterHeader';
import CharacterInventory from './InventorySection';
import CharacterAbilityScores from './AbilityScoresSection';
import CharacterSkillsSection from './CharacterSkillsSection';
import ResourcesAndManaSection from './ResourcesAndManaSection';
import CharacterActionsSection from './CharacterActionsSection';
import { CharacterTraitsSection } from './CharacterTraitsSection';
import { CharacterStatsSection } from './CharacterStatsSection';


export default function CharacterSheetPretty({
  character,
  onUpdate,
  onSave,
  initialEditMode,
}: CharacterSheetProps) {
  // Custom updateCharacter function
  const updateCharacter = useCallback(
    (updates: Partial<CharacterSheetData>) => {
      const updatedCharacter = { ...character, ...updates };
      onUpdate(updatedCharacter);
    },
    [character, onUpdate]
  );

  const [editingSections, setEditingSections] = useState<{
    abilities: boolean;
    stats: boolean;
    skills: boolean;
    spells: boolean;
    mana: boolean;
    characterInfo: boolean;
    actions: boolean;
    inventory: boolean;
  }>({
    abilities: initialEditMode?.abilities || false,
    stats: initialEditMode?.stats || false,
    skills: initialEditMode?.skills || false,
    spells: initialEditMode?.spells || false,
    mana: initialEditMode?.mana || false,
    characterInfo: initialEditMode?.characterInfo || false,
    actions: initialEditMode?.actions || false,
    inventory: initialEditMode?.inventory || false,
  });

  // Store original values for cancel functionality
  const [originalValues, setOriginalValues] = useState<{
    [K in keyof typeof editingSections]?: Partial<CharacterSheetData>;
  }>({});

  // All hooks for different sections
  const inventory = useInventoryManagement(character, onUpdate, onSave);
  const actions = useActionsManagement(character, updateCharacter);
  const skills = useSkillsManagement(updateCharacter);
  const traits = useTraitsManagement(updateCharacter);
  const resources = useResourceTracking(character, updateCharacter, onSave);
  const selection = useSelectionModals(character, updateCharacter, onSave);
  const abilities = useAbilityScores(character, onUpdate);

  // Get dynamic resources based on character
  const characterResources = useMemo(
    () => getCharacterResources(character),
    [
      character.class,
      character.subclass,
      character.species,
      character.level,
      character.abilityScores,
      character.feats,
      character.resources,
      character.wounds,
    ]
  );

  // Section editing functions
  const toggleSectionEdit = (section: keyof typeof editingSections) => {
    const isCurrentlyEditing = editingSections[section];

    if (isCurrentlyEditing) {
      // Exiting edit mode - auto-save
      if (onSave) {
        onSave(character);
      }
      // Clear stored original values for this section
      setOriginalValues((prev) => ({
        ...prev,
        [section]: undefined,
      }));
    } else {
      // Entering edit mode - store original values
      const originalData = getOriginalDataForSection(section);
      setOriginalValues((prev) => ({
        ...prev,
        [section]: originalData,
      }));
    }

    setEditingSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const cancelSectionEdit = (section: keyof typeof editingSections) => {
    // Revert to original values
    const originalData = originalValues[section];
    if (originalData) {
      onUpdate({ ...character, ...originalData });
    }

    // Clear stored original values
    setOriginalValues((prev) => ({
      ...prev,
      [section]: undefined,
    }));

    // Exit edit mode
    setEditingSections((prev) => ({
      ...prev,
      [section]: false,
    }));
  };

  const getOriginalDataForSection = (
    section: keyof typeof editingSections
  ): Partial<CharacterSheetData> => {
    switch (section) {
      case 'characterInfo':
        return {
          name: character.name,
          species: character.species,
          class: character.class,
          background: character.background,
          level: character.level,
        };
      case 'abilities':
        return {
          abilityScores: { ...character.abilityScores },
        };
      case 'stats':
        return {
          hitPoints: { ...character.hitPoints },
          armorClass: character.armorClass,
          initiative: character.initiative,
        };
      case 'mana':
        return {
          mana: { ...character.mana },
        };
      case 'actions':
        return {
          actions: [...character.actions],
        };
      case 'skills':
        return {
          skills: { ...character.skills },
        };
      case 'inventory':
        return {
          inventory: [...character.inventory],
        };
      default:
        return {};
    }
  };

  // Combat stats adjustment
  const adjustStat = (
    stat: 'currentHP' | 'maxHP' | 'armorClass',
    direction: 'up' | 'down'
  ) => {
    let updatedCharacter;

    if (stat === 'currentHP') {
      const currentValue = character.hitPoints.current;
      const newValue =
        direction === 'up' ? currentValue + 1 : Math.max(0, currentValue - 1);
      updatedCharacter = {
        ...character,
        hitPoints: {
          ...character.hitPoints,
          current: newValue,
        },
      };
      onUpdate(updatedCharacter);
    } else if (stat === 'maxHP') {
      const currentValue = character.hitPoints.max;
      const newValue =
        direction === 'up' ? currentValue + 1 : Math.max(1, currentValue - 1);
      updatedCharacter = {
        ...character,
        hitPoints: {
          ...character.hitPoints,
          max: newValue,
        },
      };
      onUpdate(updatedCharacter);
    } else if (stat === 'armorClass') {
      const currentValue = character.armorClass;
      const newValue =
        direction === 'up'
          ? Math.min(30, currentValue + 1)
          : Math.max(1, currentValue - 1);
      updatedCharacter = {
        ...character,
        armorClass: newValue,
      };
      onUpdate(updatedCharacter);
    }

    // Silent auto-save the changes (no notification)
    if (onSave && updatedCharacter) {
      setTimeout(() => {
        onSave(updatedCharacter, { silent: true });
      }, 100);
    }
  };

  // Check if character needs mana tracking
  const needsManaTracking = useMemo(() => {
    const spellcastingClasses = [
      'bard',
      'cleric',
      'druid',
      'paladin',
      'ranger',
      'sorcerer',
      'warlock',
      'wizard',
    ];
    const className = character.class.toLowerCase().replace(/\s+/g, '');
    return spellcastingClasses.includes(className);
  }, [character.class]);

  // Calculate derived values using service
  const derivedValues = useMemo(() => {
    const calculations = calculateDerivedValues(character);
    const skillModifiers = getSkillModifiers(
      character,
      calculations.proficiencyBonus
    );

    // Convert skill modifiers to the expected format
    const skills: Record<string, { proficient: boolean; modifier: number }> =
      {};
    Object.entries(skillModifiers).forEach(([skill, modifier]) => {
      const isProficient = character.skills[skill]?.proficient || false;
      skills[skill] = {
        proficient: isProficient,
        modifier: modifier,
      };
    });

    return {
      ...calculations,
      skills,
    };
  }, [character]);

  return (
    <>
      <FontImport />
      <SheetContainer>
        <CharacterHeader
          character={character}
          editingSections={{ characterInfo: editingSections.characterInfo }}
          updateCharacter={updateCharacter}
          onSave={onSave}
          toggleSectionEdit={toggleSectionEdit}
          cancelSectionEdit={cancelSectionEdit}
          selection={selection}
        />

        <MainLayout>
          <LeftColumn>
            <ThreeColumnContainer>
              {/* Ability Scores */}
              <CharacterAbilityScores
                character={character}
                editingSections={{ abilities: editingSections.abilities }}
                toggleSectionEdit={toggleSectionEdit}
                cancelSectionEdit={cancelSectionEdit}
                abilities={abilities}
              />

              {/* HP/AC Stats Container */}
              <CharacterStatsSection
                character={character}
                isEditing={editingSections.stats}
                updateCharacter={updateCharacter}
                adjustStat={adjustStat}
                toggleSectionEdit={() => toggleSectionEdit('stats')}
                cancelSectionEdit={() => cancelSectionEdit('stats')}
              />

              {/* Skills Section */}
              <CharacterSkillsSection
                character={character}
                editingSections={{ skills: editingSections.skills }}
                updateCharacter={updateCharacter}
                toggleSectionEdit={toggleSectionEdit}
                cancelSectionEdit={cancelSectionEdit}
                skills={skills}
              />
            </ThreeColumnContainer>

            {/* Two-column layout for Character Resources and Mana */}
            <ResourcesAndManaSection
              character={character}
              characterResources={characterResources}
              needsManaTracking={needsManaTracking}
              editingSections={{ mana: editingSections.mana }}
              updateCharacter={updateCharacter}
              toggleSectionEdit={toggleSectionEdit}
              cancelSectionEdit={cancelSectionEdit}
              resources={resources}
            />

            {/* Actions and Inventory Layout */}
            <TwoColumnLayout>
              {/* Actions Section */}
              <CharacterActionsSection
                character={character}
                editingSections={{ actions: editingSections.actions }}
                toggleSectionEdit={toggleSectionEdit}
                cancelSectionEdit={cancelSectionEdit}
                actions={actions}
              />

              {/* Inventory Section */}
              <CharacterInventory inventory={inventory} />
            </TwoColumnLayout>
          </LeftColumn>
        </MainLayout>

        {/* Traits and Abilities Section */}
        <CharacterTraitsSection character={character} traits={traits} />

        {/* All Modals */}
        <AddItemModal
          isOpen={inventory.showItemModal}
          modalType={inventory.itemModalType}
          searchTerm={inventory.searchTerm}
          searchResults={inventory.searchResults}
          isSearching={inventory.isSearching}
          onSearchChange={(value) => {
            inventory.setSearchTerm(value);
            inventory.handleItemSearch(value);
          }}
          onItemSelect={inventory.handleItemSelect}
          onCustomItemAdd={inventory.handleCustomItemAdd}
          onShowItemDetails={inventory.handleShowItemDetails}
          onClose={() => inventory.setShowItemModal(false)}
        />

        <ItemDetailsModalComponent
          isOpen={inventory.showItemDetails}
          item={inventory.selectedItemForDetails}
          isItemInInventory={inventory.isItemInInventory}
          onAddToInventory={(item) => {
            inventory.handleItemSelect(item);
            inventory.setShowItemDetails(false);
          }}
          onClose={() => inventory.setShowItemDetails(false)}
        />

        <DeleteConfirmationModal
          isOpen={inventory.showDeleteConfirmation}
          itemName={inventory.itemToDelete?.itemName || ''}
          onConfirm={inventory.handleConfirmDelete}
          onCancel={inventory.handleCancelDelete}
        />

        <ActionsManagementModal
          isOpen={actions.isActionsModalOpen}
          actions={character.actions}
          onSave={actions.handleSaveActions}
          onCancel={actions.handleCancelActionsModal}
        />

        <SkillsManagementModal
          isOpen={skills.isSkillsModalOpen}
          skills={character.skills || {}}
          abilityScores={character.abilityScores}
          proficiencyBonus={derivedValues.proficiencyBonus}
          onSave={skills.handleSaveSkills}
          onCancel={skills.handleCancelSkillsModal}
        />

        <TraitsManagementModal
          isOpen={traits.isTraitsModalOpen}
          classFeatures={character.classFeatures || []}
          speciesTraits={character.speciesTraits || []}
          customTraits={[]}
          onSave={traits.handleSaveTraits}
          onCancel={traits.handleCancelTraitsModal}
        />

        {selection.isManageFeatModalOpen && (
          <FeatSelectionModal
            isOpen={selection.isManageFeatModalOpen}
            selectedFeats={selection.selectedFeats}
            maxFeats={3}
            onFeatToggle={selection.handleFeatToggle}
            onConfirm={selection.handleFeatSelectionConfirm}
            onCancel={selection.handleFeatSelectionCancel}
            level={character.level}
          />
        )}

        <SpeciesSelectionModal
          isOpen={selection.showSpeciesPopup}
          selectedSpecies={selection.selectedSpecies}
          selectedSpeciesChoices={selection.selectedSpeciesChoices}
          onSpeciesSelect={selection.handleSpeciesSelect}
          onChoiceSelect={selection.handleSpeciesChoiceSelect}
          onConfirm={selection.handleSpeciesConfirm}
          onCancel={selection.handleSpeciesCancel}
        />

        <ClassSelectionModal
          isOpen={selection.showClassPopup}
          selectedClass={selection.selectedClass}
          selectedClassSkills={selection.selectedClassSkills}
          classChoicesStep={selection.classChoicesStep}
          selectedClassChoices={selection.selectedClassChoices}
          currentClassData={selection.currentClassData}
          onClassSelect={selection.handleClassSelect}
          onSkillToggle={selection.handleClassSkillToggle}
          onChoiceToggle={selection.handleClassChoiceToggle}
          onNextStep={selection.handleClassNextStep}
          onPrevStep={selection.handleClassPrevStep}
          onConfirm={selection.handleClassConfirm}
          onCancel={selection.handleClassCancel}
        />

        <BackgroundSelectionModal
          isOpen={selection.showBackgroundPopup}
          selectedBackground={selection.selectedBackground}
          onBackgroundSelect={selection.handleBackgroundSelect}
          onConfirm={selection.handleBackgroundConfirm}
          onCancel={selection.handleBackgroundCancel}
        />
      </SheetContainer>
    </>
  );
}
