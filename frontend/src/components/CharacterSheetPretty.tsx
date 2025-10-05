import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
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
import ConsolidatedInventorySection from './ConsolidatedInventorySection';
import CharacterAbilityScores from './AbilityScoresSection';
import CharacterSkillsSection from './CharacterSkillsSection';
import CompactResourcesBar from './CompactResourcesBar';
import CharacterActionsSection from './CharacterActionsSection';
import { CharacterTraitsSection } from './CharacterTraitsSection';
import { CharacterProficienciesSection } from './CharacterProficienciesSection';
import { CharacterStatsSection } from './CharacterStatsSection';
import WeaponMasterySection from './WeaponMasterySection';
import SpellcastingBar from './SpellcastingBar';
import { SimpleFeature } from '../utils/simpleFeatureGenerator';
import CharacterSpellsSection from './CharacterSpellsSection';

const TabBar = styled.div`
  margin: 1.75rem 0 1.25rem;
  display: inline-flex;
  gap: 0.75rem;
  padding: 0.35rem;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 999px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: 999px;
  padding: 0.45rem 1.35rem;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $active }) =>
    $active ? 'rgba(212, 175, 55, 0.18)' : 'transparent'};
  color: ${({ $active }) => ($active ? '#f8f4e1' : 'rgba(248, 244, 225, 0.75)')};
  border: ${({ $active }) =>
    $active ? '1px solid rgba(212, 175, 55, 0.55)' : '1px solid transparent'};

  &:hover {
    background: rgba(212, 175, 55, 0.15);
    color: #f8f4e1;
  }
`;


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

      if (onSave) {
        void onSave(updatedCharacter, { silent: true });
      }
    },
    [character, onUpdate, onSave]
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
  const abilities = useAbilityScores(character, onUpdate, onSave);

  // State to hold extracted spellcasting feature
  const [spellcastingFeature, setSpellcastingFeature] = useState<SimpleFeature | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'spells'>('overview');

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
      void onSave?.(character);
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
      void onSave(updatedCharacter, { silent: true });
    }
  };

  // Check if character has weapon mastery
  const hasWeaponMastery = useMemo(() => {
    const masteryClasses = ['barbarian', 'fighter', 'paladin', 'ranger', 'rogue'];
    const className = character.class.toLowerCase().replace(/\s+/g, '');
    return masteryClasses.some(c => className.includes(c));
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

        {/* Compact Resources Bar */}
        <CompactResourcesBar
          characterResources={characterResources}
          resources={resources}
        />

        {/* Spellcasting Bar - only shown for casters */}
        {spellcastingFeature && (
          <SpellcastingBar
            spellcastingFeature={spellcastingFeature}
            character={character}
            editingSections={{ mana: editingSections.mana }}
            updateCharacter={updateCharacter}
            resources={resources}
          />
        )}

        <TabBar role="tablist" aria-label="Character Sheet Sections">
          <TabButton
            type="button"
            $active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </TabButton>
          <TabButton
            type="button"
            $active={activeTab === 'spells'}
            onClick={() => setActiveTab('spells')}
          >
            Spells
          </TabButton>
        </TabBar>

        {activeTab === 'overview' ? (
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

              {/* Actions Section - Conditional Layout */}
              {hasWeaponMastery ? (
                <TwoColumnLayout style={{ gridTemplateColumns: '2fr 1fr' }}>
                  <CharacterActionsSection
                    character={character}
                    editingSections={{ actions: editingSections.actions }}
                    toggleSectionEdit={toggleSectionEdit}
                    cancelSectionEdit={cancelSectionEdit}
                    actions={actions}
                  />
                  <WeaponMasterySection
                    character={character}
                    onUpdateCharacter={updateCharacter}
                  />
                </TwoColumnLayout>
              ) : (
                <CharacterActionsSection
                  character={character}
                  editingSections={{ actions: editingSections.actions }}
                  toggleSectionEdit={toggleSectionEdit}
                  cancelSectionEdit={cancelSectionEdit}
                  actions={actions}
                />
              )}

              {/* Inventory/Proficiencies and Traits Side-by-Side Layout */}
              <TwoColumnLayout>
                {/* Left Column: Inventory and Proficiencies stacked */}
                <div>
                  <ConsolidatedInventorySection
                    inventory={inventory}
                    mode="scroll"
                    maxHeight="900px"
                    showEquipToggle={true}
                  />
                  <CharacterProficienciesSection character={character} />
                </div>

                {/* Right Column: Features & Traits */}
                <CharacterTraitsSection
                  character={character}
                  traits={traits}
                  onUpdateCharacter={updateCharacter}
                  onSpellcastingFeatureExtracted={setSpellcastingFeature}
                />
              </TwoColumnLayout>
            </LeftColumn>
          </MainLayout>
        ) : (
          <CharacterSpellsSection character={character} />
        )}

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
          onSpeciesSelect={(_species) => {
            // TODO: Update to handle API species object
            selection.handleSpeciesCancel();
          }}
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
          onBackgroundSelect={(_background) => {
            // TODO: Update to handle API background object
            selection.handleBackgroundCancel();
          }}
          onCancel={selection.handleBackgroundCancel}
        />
      </SheetContainer>
    </>
  );
}
