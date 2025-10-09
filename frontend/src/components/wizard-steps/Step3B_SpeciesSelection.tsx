import React, { useEffect, useState } from 'react';
import type { JSX } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { listSpecies } from '@/services/speciesService';
import { Species as ApiSpecies } from '@/types/api';
import { processTraitDescriptionWithTables, processTraitDescription } from '@/utils/textProcessor';
import { useApiCall } from '@/hooks/useApiCall';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AbilityScoresHeader } from './AbilityScoresHeader';
import WizardModal from '../wizard/WizardModal';
import { logger } from '../../utils/logger';

// Species choice constants (from Step3C)
const DRAGONBORN_ANCESTRY = [
  { type: 'Black', damage: 'Acid', area: '15-foot line (5 feet wide)' },
  { type: 'Blue', damage: 'Lightning', area: '15-foot line (5 feet wide)' },
  { type: 'Brass', damage: 'Fire', area: '15-foot line (5 feet wide)' },
  { type: 'Bronze', damage: 'Lightning', area: '15-foot line (5 feet wide)' },
  { type: 'Copper', damage: 'Acid', area: '15-foot line (5 feet wide)' },
  { type: 'Gold', damage: 'Fire', area: '15-foot cone' },
  { type: 'Green', damage: 'Poison', area: '15-foot cone' },
  { type: 'Red', damage: 'Fire', area: '15-foot cone' },
  { type: 'Silver', damage: 'Cold', area: '15-foot cone' },
  { type: 'White', damage: 'Cold', area: '15-foot cone' },
];

const ELF_LINEAGES = [
  { name: 'Drow', description: 'The range of your Darkvision increases to 120 feet. You also know the Dancing Lights cantrip.', level3: 'Faerie Fire', level5: 'Darkness' },
  { name: 'High Elf', description: 'You know the Prestidigitation cantrip. Whenever you finish a Long Rest, you can replace that cantrip with a different cantrip from the Wizard spell list.', level3: 'Detect Magic', level5: 'Misty Step' },
  { name: 'Wood Elf', description: 'Your Speed increases to 35 feet. You also know the Druidcraft cantrip.', level3: 'Longstrider', level5: 'Pass without Trace' }
];

const GNOME_LINEAGES = [
  { name: 'Forest Gnome', description: 'You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared.' },
  { name: 'Rock Gnome', description: 'You know the Mending and Prestidigitation cantrips. You can create tiny clockwork devices using Prestidigitation.' }
];

const GOLIATH_GIANT_ANCESTRY = [
  { name: "Cloud's Jaunt (Cloud Giant)", description: 'As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see.' },
  { name: "Fire's Burn (Fire Giant)", description: 'When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target.' },
  { name: "Frost's Chill (Frost Giant)", description: 'When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to that target and reduce its Speed by 10 feet until the start of your next turn.' },
  { name: "Hill's Tumble (Hill Giant)", description: 'When you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition.' },
  { name: "Stone's Endurance (Stone Giant)", description: 'When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce the damage by that total.' },
  { name: "Storm's Thunder (Storm Giant)", description: 'When you take damage from a creature within 60 feet of you, you can take a Reaction to deal 1d8 Thunder damage to that creature.' }
];

const TIEFLING_FIENDISH_LEGACIES = [
  { name: 'Abyssal', description: 'You have Resistance to Poison damage. You also know the Poison Spray cantrip.', level3: 'Ray of Sickness', level5: 'Hold Person' },
  { name: 'Chthonic', description: 'You have Resistance to Necrotic damage. You also know the Chill Touch cantrip.', level3: 'False Life', level5: 'Ray of Enfeeblement' },
  { name: 'Infernal', description: 'You have Resistance to Fire damage. You also know the Fire Bolt cantrip.', level3: 'Hellish Rebuke', level5: 'Darkness' }
];

const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

interface Step3BSpeciesSelectionProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

type Species = ApiSpecies;

const SpeciesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SpeciesCard = styled.div<{ selected: boolean }>`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid ${props => props.selected ? '#d4af37' : '#444'};
  border-radius: 6px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 140px;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(212, 175, 55, 0.3);
  }

  ${props => props.selected && `
    background: rgba(212, 175, 55, 0.1);
    box-shadow: 0 3px 8px rgba(212, 175, 55, 0.4);
  `}
`;

const SpeciesName = styled.h3`
  color: #d4af37;
  margin: 0 0 0.25rem 0;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  text-align: center;
`;

const SpeciesDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .species-info {
    color: #ccc;
    font-size: 0.75rem;
    text-align: center;
    margin-bottom: 0.5rem;
  }

  .species-traits {
    .trait-title {
      color: #d4af37;
      font-weight: 600;
      font-size: 0.7rem;
      margin-bottom: 0.1rem;
    }

    .trait-list {
      color: #aaa;
      font-size: 0.65rem;
      line-height: 1.2;
    }
  }
`;

const SpeciesSelectionInfo = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;

  h4 {
    color: #d4af37;
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
  }

  p {
    color: #ccc;
    margin: 0;
    font-size: 0.85rem;
  }
`;

const ModalSection = styled.div`
  margin-bottom: 1.5rem;

  h3 {
    color: #d4af37;
    font-size: 1.1rem;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }

  .section-content {
    color: #ccc;
    font-size: 0.9rem;
    line-height: 1.4;
  }
`;

const TraitsSection = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;

  h3 {
    color: #d4af37;
    font-size: 1.1rem;
    margin: 0 0 0.75rem 0;
    text-align: center;
  }

  .traits-grid {
    display: grid;
    gap: 0.75rem;
  }

  .trait-item {
    background: rgba(26, 26, 26, 0.8);
    border: 1px solid #444;
    border-radius: 6px;
    padding: 0.75rem;

    .trait-name {
      color: #d4af37;
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }

    .trait-description {
      color: #ccc;
      font-size: 0.8rem;
      line-height: 1.3;
    }
  }
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;

  button {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &.btn-cancel {
      background: linear-gradient(145deg, #4a4a4a, #3a3a3a);
      color: #f0f0f0;
      flex: 1;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }
    }

    &.btn-confirm {
      background: linear-gradient(145deg, #d4af37, #b8941f);
      color: #1a1a1a;
      flex: 2;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
      }
    }
  }
`;

const ChoiceWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(145deg, rgba(127, 29, 29, 0.85), rgba(239, 68, 68, 0.12));
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 10px;
  padding: 0.85rem 1.1rem;
  color: #fecaca;
  font-size: 0.9rem;
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.15);
  margin-bottom: 1.25rem;

  span {
    font-size: 1.25rem;
    line-height: 1;
  }
`;

const TraitTable = styled.table`
  width: 100%;
  margin: 0.75rem 0;
  border-collapse: collapse;
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid #444;
  border-radius: 6px;
  overflow: hidden;

  caption {
    color: #d4af37;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  th {
    background: rgba(212, 175, 55, 0.2);
    color: #d4af37;
    font-weight: 600;
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid #555;

    &:not(:last-child) {
      border-right: 1px solid #555;
    }
  }

  td {
    color: #ccc;
    font-size: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #333;

    &:not(:last-child) {
      border-right: 1px solid #333;
    }

    &:last-child {
      border-bottom: none;
    }
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const TraitList = styled.div`
  margin: 0.75rem 0;

  .list-items {
    margin: 0.5rem 0;

    .list-item {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid #333;
      border-radius: 4px;
      margin: 0.5rem 0;
      padding: 0.75rem;

      .item-name {
        color: #d4af37;
        font-weight: 600;
        font-size: 0.85rem;
        margin-bottom: 0.25rem;
      }

      .item-description {
        color: #ccc;
        font-size: 0.75rem;
        line-height: 1.3;
      }
    }
  }
`;

export const Step3BSpeciesSelection: React.FC<Step3BSpeciesSelectionProps> = ({
  data,
  onUpdate,
}) => {
  const [selectedSpeciesForModal, setSelectedSpeciesForModal] = useState<Species | null>(null);
  const [modalPage, setModalPage] = useState<'details' | 'choices'>('details');
  const [currentSpeciesChoices, setCurrentSpeciesChoices] = useState<any>({});
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const {
    data: speciesData,
    error,
    isLoading,
    execute: loadSpecies,
  } = useApiCall(listSpecies);
  const species = speciesData ?? [];

  useEffect(() => {
    loadSpecies();
  }, [loadSpecies]);

  const handleSpeciesClick = (speciesData: Species) => {
    setSelectedSpeciesForModal(speciesData);
  };

  const handleSpeciesSelect = (speciesData: Species) => {
    try {

      // Check if Human for Origin Feat calculation
      const isHuman = speciesData.name.toLowerCase() === 'human';

      // Extract traits with safe string descriptions for React rendering
      const safeExtractTraits = (traits?: any): any[] => {
        try {
          if (!traits) return [];
          if (!Array.isArray(traits)) traits = [traits];

          return traits.map((trait: any) => {
            // Helper function to extract text from complex description structures
            const extractTextFromDescription = (desc: any): string => {
              if (typeof desc === 'string') return desc;
              if (Array.isArray(desc)) {
                return desc.map(item => {
                  if (typeof item === 'string') return item;
                  if (typeof item === 'object') {
                    // Handle table objects and other complex structures
                    if (item.type === 'table') {
                      return `[Table: ${item.caption || 'Data table'}]`;
                    }
                    // Handle other object types
                    return item.text || item.entry || JSON.stringify(item);
                  }
                  return '';
                }).filter(Boolean).join(' ');
              }
              if (typeof desc === 'object') {
                if (desc.type === 'table') {
                  return `[Table: ${desc.caption || 'Data table'}]`;
                }
                return desc.text || desc.entry || 'Complex trait data';
              }
              return 'No description available';
            };

            return {
              name: trait.name || 'Unknown Trait',
              description: extractTextFromDescription(trait.description),
              type: trait.type || 'entries',
              // Keep the original entries for potential future use, but don't spread them
              originalEntries: trait.entries
            };
          });
        } catch (error) {
          logger.error('Error extracting traits:', error);
          return [];
        }
      };

      const safeGetSize = (size: string | string[]): string => {
        try {
          if (Array.isArray(size)) return size[0] || 'Medium';
          return size || 'Medium';
        } catch (error) {
          logger.error('Error getting size:', error);
          return 'Medium';
        }
      };

      const safeGetSpeed = (speed: any): number => {
        try {
          if (typeof speed === 'number') return speed;
          if (typeof speed === 'object' && speed.walk) return speed.walk;
          return 30; // Default speed
        } catch (error) {
          logger.error('Error getting speed:', error);
          return 30;
        }
      };

      const extractDarkvision = (speciesData: any): number => {
        try {
          logger.debug('🔍 Extracting darkvision for:', speciesData.name);

          if (speciesData.name && speciesData.name.toLowerCase() === 'orc') {
            logger.debug('⚙️ Forcing orc darkvision to 60 feet to match 2024 rules.');
            return 60;
          }

          // Check if darkvision is a direct property
          if (speciesData.darkvision && typeof speciesData.darkvision === 'number') {
            logger.debug('✅ Found direct darkvision property:', speciesData.darkvision);
            return speciesData.darkvision;
          }

          // Check in traits for darkvision
          if (speciesData.traits) {
            const traits = Array.isArray(speciesData.traits) ? speciesData.traits : [speciesData.traits];
            for (const trait of traits) {
              if (trait.name && trait.name.toLowerCase().includes('darkvision')) {
                logger.debug('✅ Found darkvision trait:', trait);

                // Convert description to string (it might be an array or object)
                let desc = '';
                if (typeof trait.description === 'string') {
                  desc = trait.description;
                } else if (Array.isArray(trait.description)) {
                  desc = trait.description.join(' ');
                } else if (trait.description) {
                  desc = JSON.stringify(trait.description);
                }

                // Try to extract the range from the description
                const match = desc.match(/(\d+)\s*feet?/i);
                if (match) {
                  logger.debug('✅ Extracted darkvision range:', parseInt(match[1]));
                  return parseInt(match[1]);
                }
                // Default darkvision is usually 60 feet
                logger.debug('✅ Using default darkvision: 60');
                return 60;
              }
            }
          }

          logger.debug('❌ No darkvision found');
          return 0; // No darkvision
        } catch (error) {
          logger.error('Error extracting darkvision:', error);
          return 0;
        }
      };

      const extractResistances = (speciesData: any): string[] => {
        try {
          // Check if resist is a direct property
          if (speciesData.resist) {
            if (Array.isArray(speciesData.resist)) {
              return speciesData.resist;
            }
            if (typeof speciesData.resist === 'string') {
              return [speciesData.resist];
            }
          }

          // Check in traits for resistances
          const resistances: string[] = [];
          if (speciesData.traits) {
            const traits = Array.isArray(speciesData.traits) ? speciesData.traits : [speciesData.traits];
            for (const trait of traits) {
              // Convert description to string (it might be an array or object)
              let desc = '';
              if (typeof trait.description === 'string') {
                desc = trait.description.toLowerCase();
              } else if (Array.isArray(trait.description)) {
                desc = trait.description.join(' ').toLowerCase();
              } else if (trait.description) {
                desc = JSON.stringify(trait.description).toLowerCase();
              }

              if (desc.includes('resistance to')) {
                // Try to extract resistance types
                const resistanceTypes = ['fire', 'cold', 'lightning', 'poison', 'acid', 'necrotic', 'radiant', 'psychic', 'thunder', 'force'];
                for (const type of resistanceTypes) {
                  if (desc.includes(type)) {
                    resistances.push(type.charAt(0).toUpperCase() + type.slice(1));
                  }
                }
              }
            }
          }

          return resistances;
        } catch (error) {
          logger.error('Error extracting resistances:', error);
          return [];
        }
      };

      const darkvision = extractDarkvision(speciesData);
      const resistances = extractResistances(speciesData);

      const updateData = {
        selectedSpecies: speciesData.name,
        isHuman: isHuman,
        requiredFeatCount: isHuman ? 2 : 1, // Humans get an extra feat

        // Extract and store basic species data
        speciesTraits: safeExtractTraits(speciesData.traits),
        speciesSize: safeGetSize(speciesData.size),
        speciesSpeed: safeGetSpeed(speciesData.speed),

        // Extract special abilities
        speciesSpells: { cantrips: [], level1: [], level3: [], level5: [] },
        speciesDarkvision: darkvision,
        speciesResistances: resistances,
        speciesImmunities: [] // TODO: Extract immunities if needed
      };

      logger.debug('📦 Update data being sent:', updateData);
      logger.debug('Darkvision value:', darkvision);
      onUpdate(updateData);

    } catch (error) {
      logger.error('Error in handleSpeciesSelect:', error);
      // Fallback to basic update
      onUpdate({
        selectedSpecies: speciesData.name,
        isHuman: speciesData.name.toLowerCase() === 'human',
        requiredFeatCount: speciesData.name.toLowerCase() === 'human' ? 2 : 1
      });
    }
  };

  // Check if species needs choices
  const speciesNeedsChoices = (speciesName: string): boolean => {
    return ['dragonborn', 'elf', 'gnome', 'goliath', 'tiefling', 'human'].includes(speciesName.toLowerCase());
  };

  const confirmSpeciesSelection = () => {
    if (!selectedSpeciesForModal) return;

    // Select the species
    handleSpeciesSelect(selectedSpeciesForModal);

      // Check if this species needs choices
      if (speciesNeedsChoices(selectedSpeciesForModal.name)) {
        // Initialize choices for this species
        setCurrentSpeciesChoices(data.speciesChoices || {});
        setShowValidationWarning(false); // Reset warning when entering choices page
        setModalPage('choices');
      } else {
        // No choices needed
        closeModal();
    }
  };

  const closeModal = () => {
    setSelectedSpeciesForModal(null);
    setModalPage('details');
    setCurrentSpeciesChoices({});
    setShowValidationWarning(false);
  };

  // Update species choice
  const updateSpeciesChoice = (choiceKey: string, value: any) => {
    const newChoices = {
      ...currentSpeciesChoices,
      [choiceKey]: value
    };
    setCurrentSpeciesChoices(newChoices);
    setShowValidationWarning(false); // Hide warning when user makes a selection

    // Update in parent data
    onUpdate({ speciesChoices: newChoices });
  };

  // Check if current species choices are complete
  const areChoicesComplete = (): boolean => {
    if (!selectedSpeciesForModal) return false;

    const speciesName = selectedSpeciesForModal.name.toLowerCase();
    const choices = currentSpeciesChoices;

    switch (speciesName) {
      case 'dragonborn':
        return !!choices.draconicAncestry;
      case 'elf':
        return !!choices.elfLineage && !!choices.elfSkill;
      case 'gnome':
        return !!choices.gnomeLineage;
      case 'goliath':
        return !!choices.giantAncestry;
      case 'tiefling':
        return !!choices.fiendishLegacy;
      case 'human':
        return !!choices.humanSkill;
      default:
        return true;
    }
  };

  // Confirm choices
  const confirmChoices = () => {
    if (!areChoicesComplete()) {
      setShowValidationWarning(true); // Show warning only when user tries to confirm
      return;
    }

    closeModal();
  };

  const getMainTraits = (traits?: any[]): string[] => {
    if (!traits) return [];
    return traits.slice(0, 3).map(trait => trait.name || 'Unknown Trait');
  };

  const getSpeciesSize = (size: string | string[]): string => {
    if (Array.isArray(size)) {
      return size.join(' or ');
    }
    return size === 'Medium' ? 'Medium' : 'Small';
  };

  // Species choice rendering functions
  const renderDragonbornChoices = () => (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem' }}>Choose Draconic Ancestry</h3>
      <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Select your dragon ancestor type, which determines your breath weapon damage.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
        {DRAGONBORN_ANCESTRY.map((ancestry) => (
          <div
            key={ancestry.type}
            onClick={() => updateSpeciesChoice('draconicAncestry', ancestry.type)}
            style={{
              background: currentSpeciesChoices.draconicAncestry === ancestry.type ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
              border: `2px solid ${currentSpeciesChoices.draconicAncestry === ancestry.type ? '#d4af37' : '#444'}`,
              borderRadius: '8px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ color: '#d4af37', fontWeight: 600, marginBottom: '0.5rem' }}>{ancestry.type} Dragon</div>
            <div style={{ color: '#ccc', fontSize: '0.85rem' }}>Damage: {ancestry.damage}</div>
            <div style={{ color: '#888', fontSize: '0.75rem' }}>{ancestry.area}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderElfChoices = () => (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem' }}>Choose Elf Lineage</h3>
      <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Select your elf lineage and gain a skill proficiency.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {ELF_LINEAGES.map((lineage) => (
          <div
            key={lineage.name}
            onClick={() => updateSpeciesChoice('elfLineage', lineage.name)}
            style={{
              background: currentSpeciesChoices.elfLineage === lineage.name ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
              border: `2px solid ${currentSpeciesChoices.elfLineage === lineage.name ? '#d4af37' : '#444'}`,
              borderRadius: '8px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ color: '#d4af37', fontWeight: 600, marginBottom: '0.5rem' }}>{lineage.name}</div>
            <div style={{ color: '#ccc', fontSize: '0.85rem' }}>{lineage.description}</div>
          </div>
        ))}
      </div>

      <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem', marginTop: '1rem' }}>Choose Skill Proficiency</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
        {ALL_SKILLS.map((skill) => (
          <div
            key={skill}
            onClick={() => updateSpeciesChoice('elfSkill', skill)}
            style={{
              background: currentSpeciesChoices.elfSkill === skill ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
              border: `2px solid ${currentSpeciesChoices.elfSkill === skill ? '#d4af37' : '#444'}`,
              borderRadius: '8px',
              padding: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ color: '#d4af37', fontSize: '0.85rem' }}>{skill}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGnomeChoices = () => (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem' }}>Choose Gnome Lineage</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
        {GNOME_LINEAGES.map((lineage) => (
          <div
            key={lineage.name}
            onClick={() => updateSpeciesChoice('gnomeLineage', lineage.name)}
            style={{
              background: currentSpeciesChoices.gnomeLineage === lineage.name ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
              border: `2px solid ${currentSpeciesChoices.gnomeLineage === lineage.name ? '#d4af37' : '#444'}`,
              borderRadius: '8px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ color: '#d4af37', fontWeight: 600, marginBottom: '0.5rem' }}>{lineage.name}</div>
            <div style={{ color: '#ccc', fontSize: '0.85rem' }}>{lineage.description}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGoliathChoices = () => (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem' }}>Choose Giant Ancestry</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
        {GOLIATH_GIANT_ANCESTRY.map((ancestry) => (
          <div
            key={ancestry.name}
            onClick={() => updateSpeciesChoice('giantAncestry', ancestry.name)}
            style={{
              background: currentSpeciesChoices.giantAncestry === ancestry.name ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
              border: `2px solid ${currentSpeciesChoices.giantAncestry === ancestry.name ? '#d4af37' : '#444'}`,
              borderRadius: '8px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ color: '#d4af37', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{ancestry.name}</div>
            <div style={{ color: '#ccc', fontSize: '0.85rem' }}>{ancestry.description}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTieflingChoices = () => (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem' }}>Choose Fiendish Legacy</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
        {TIEFLING_FIENDISH_LEGACIES.map((legacy) => (
          <div
            key={legacy.name}
            onClick={() => updateSpeciesChoice('fiendishLegacy', legacy.name)}
            style={{
              background: currentSpeciesChoices.fiendishLegacy === legacy.name ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
              border: `2px solid ${currentSpeciesChoices.fiendishLegacy === legacy.name ? '#d4af37' : '#444'}`,
              borderRadius: '8px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ color: '#d4af37', fontWeight: 600, marginBottom: '0.5rem' }}>{legacy.name}</div>
            <div style={{ color: '#ccc', fontSize: '0.85rem' }}>{legacy.description}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHumanChoices = () => (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem' }}>Choose Skill Proficiency</h3>
      <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Humans gain proficiency in one skill of their choice.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
        {ALL_SKILLS.map((skill) => (
          <div
            key={skill}
            onClick={() => updateSpeciesChoice('humanSkill', skill)}
            style={{
              background: currentSpeciesChoices.humanSkill === skill ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
              border: `2px solid ${currentSpeciesChoices.humanSkill === skill ? '#d4af37' : '#444'}`,
              borderRadius: '8px',
              padding: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ color: '#d4af37', fontSize: '0.85rem' }}>{skill}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTraitContent = (trait: any) => {
    const { text, tables, lists } = processTraitDescriptionWithTables(trait.description);

    const renderListItem = (item: any, index: number) => {
      if (typeof item === 'string') {
        return (
          <div key={index} className="list-item">
            <div
              className="item-description"
              dangerouslySetInnerHTML={{ __html: processTraitDescription(item) }}
            />
          </div>
        );
      } else if (item.name && item.entries) {
        return (
          <div key={index} className="list-item">
            <div className="item-name">{item.name}</div>
            <div
              className="item-description"
              dangerouslySetInnerHTML={{ __html: processTraitDescription(item.entries) }}
            />
          </div>
        );
      }
      return null;
    };

    return (
      <>
        {text && (
          <div
            className="trait-description"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        )}

        {tables.length > 0 && tables.map((table, tableIndex) => (
          <TraitTable key={tableIndex}>
            {table.caption && <caption>{table.caption}</caption>}
            <thead>
              <tr>
                {table.colLabels?.map((label: string, colIndex: number) => (
                  <th key={colIndex}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows?.map((row: string[], rowIndex: number) => (
                <tr key={rowIndex}>
                  {row.map((cell: string, cellIndex: number) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </TraitTable>
        ))}

        {lists.length > 0 && lists.map((list, listIndex) => (
          <TraitList key={listIndex}>
            <div className="list-items">
              {list.items?.map(renderListItem)}
            </div>
          </TraitList>
        ))}
      </>
    );
  };

const getTraitList = (traits?: any[]): any[] => {
  if (!traits) return [];
  return traits.slice(0, 6); // Show first 6 traits in modal
};

const SpeciesDescription = styled.div`
  color: #ccc;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1rem;
`;

const renderSpeciesDetailsContent = (
  speciesData: any,
  getSpeciesSizeFn: (size: string | string[]) => string,
  traitRenderer: (trait: any) => JSX.Element,
  getTraitListFn: (traits?: any[]) => any[],
  processDescription: (desc: string) => string,
) => (
  <>
    <SpeciesDescription>
      {getSpeciesSizeFn(speciesData.size)} {speciesData.creatureType} • {speciesData.speed} ft Speed
    </SpeciesDescription>

    <TraitsSection>
      <h3>Species Traits</h3>
      <div className="traits-grid">
        {getTraitListFn(speciesData.traits).map((trait: any, index: number) => (
          <div key={index} className="trait-item">
            <div className="trait-name">{trait.name || `Trait ${index + 1}`}</div>
            {traitRenderer(trait)}
          </div>
        ))}
      </div>
    </TraitsSection>

    {speciesData.skillProficiencies && (
      <ModalSection>
        <h3>Skill Proficiencies</h3>
        <div className="section-content">
          {Array.isArray(speciesData.skillProficiencies)
            ? speciesData.skillProficiencies.map((prof: any, idx: number) => {
                if (typeof prof === 'string') return <div key={idx}>{prof}</div>;
                if (prof.choose)
                  return (
                    <div key={idx}>
                      Choose {prof.choose.count || 1} from: {prof.choose.from?.join(', ') || 'various skills'}
                    </div>
                  );
                if (prof.any)
                  return (
                    <div key={idx}>Choose {prof.any} skill from any skill list</div>
                  );
                return <div key={idx}>{JSON.stringify(prof)}</div>;
              })
            : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: processDescription(speciesData.skillProficiencies),
                  }}
                />
              )}
        </div>
      </ModalSection>
    )}

    <div
      style={{
        textAlign: 'center',
        fontSize: '0.7rem',
        color: '#888',
        marginTop: '1rem',
        marginBottom: '1rem',
      }}
    >
      <strong>Source:</strong> {speciesData.contentVersion} Player's Handbook
      {speciesData.name?.toLowerCase() === 'human' && (
        <div style={{ color: '#d4af37', marginTop: '0.25rem' }}>
          🌟 Humans receive 2 Origin Feats instead of 1
        </div>
      )}
    </div>
  </>
);

const renderSpeciesChoicesContent = (
  speciesName: string,
  choiceRenderers: Record<string, () => JSX.Element>,
) => {
  const key = speciesName.toLowerCase();
  const renderer = choiceRenderers[key];
  return renderer ? renderer() : null;
};

  if (isLoading) {
    return (
      <StepContainer>
        <div className="step-title">Species</div>
        <LoadingSpinner message="Loading species..." />
      </StepContainer>
    );
  }

  if (error) {
    return (
      <StepContainer>
        <div className="step-title">Species</div>
        <div
          role="alert"
          style={{ textAlign: 'center', color: '#ff6b6b', padding: '2rem' }}
        >
          Unable to load species: {error}
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <div className="step-title">Species</div>
      <div className="step-description">
        Choose your character's species, which determines their physical traits and special abilities.
      </div>

      <AbilityScoresHeader data={data} />

      <div className="step-content">
        <SpeciesSelectionInfo>
          <h4>D&D 2024 Species</h4>
          <p>
            Each species grants unique traits, size, speed, and special abilities.
            Humans get an additional Origin Feat (2 total instead of 1).
          </p>
        </SpeciesSelectionInfo>

        <SpeciesGrid>
          {species.map((speciesOption) => (
            <SpeciesCard
              key={speciesOption.id}
              selected={data.selectedSpecies === speciesOption.name}
              onClick={() => handleSpeciesClick(speciesOption)}
            >
              <SpeciesName>{speciesOption.name}</SpeciesName>

              <SpeciesDetails>
                <div className="species-info">
                  {getSpeciesSize(speciesOption.size)} • {speciesOption.speed} ft Speed
                </div>

                <div className="species-traits">
                  <div className="trait-title">Key Traits:</div>
                  <div className="trait-list">
                    {getMainTraits(speciesOption.traits).join(', ') || 'Special abilities'}
                  </div>
                </div>
              </SpeciesDetails>
            </SpeciesCard>
          ))}
        </SpeciesGrid>


        {!data.selectedSpecies && (
          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            color: '#888',
            fontSize: '0.9rem'
          }}>
            💡 Tip: Each species has unique traits that can complement your class and background choices.
          </div>
        )}
      </div>

      {selectedSpeciesForModal && (
        <WizardModal
          isOpen={Boolean(selectedSpeciesForModal)}
          onClose={closeModal}
          title={
            modalPage === 'details'
              ? selectedSpeciesForModal.name
              : `${selectedSpeciesForModal.name} - Make Choices`
          }
          maxWidth="900px"
          footer={
            modalPage === 'details' ? (
              <ModalButtons>
                <button className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="btn-confirm"
                  onClick={confirmSpeciesSelection}
                >
                  Select Species
                </button>
              </ModalButtons>
            ) : (
              <ModalButtons style={{ marginTop: '1.5rem' }}>
                <button
                  className="btn-cancel"
                  onClick={() => setModalPage('details')}
                >
                  Back
                </button>
                <button
                  className="btn-confirm"
                  onClick={confirmChoices}
                  disabled={!areChoicesComplete()}
                >
                  Confirm Choices
                </button>
              </ModalButtons>
            )
          }
        >
          {modalPage === 'details'
            ? renderSpeciesDetailsContent(
                selectedSpeciesForModal,
                getSpeciesSize,
                renderTraitContent,
                getTraitList,
                processTraitDescription,
              )
            : (
                <>
                  {showValidationWarning && !areChoicesComplete() && (
                    <ChoiceWarning role="status" aria-live="polite">
                      <span>⚠️</span>
                      <div>
                        Complete all required choices below to continue.
                      </div>
                    </ChoiceWarning>
                  )}
                  {renderSpeciesChoicesContent(selectedSpeciesForModal.name, {
                    dragonborn: renderDragonbornChoices,
                    elf: renderElfChoices,
                    gnome: renderGnomeChoices,
                    goliath: renderGoliathChoices,
                    tiefling: renderTieflingChoices,
                    human: renderHumanChoices,
                  })}
                </>
              )}
        </WizardModal>
      )}
    </StepContainer>
  );
};
