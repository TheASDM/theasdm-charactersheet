import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import featsService, { Feat } from '../../services/featsService';
import { processTraitDescriptionWithTables, processTraitDescription } from '../../utils/textProcessor';
import { AbilityScoresHeader } from './AbilityScoresHeader';
import WizardModal from '../wizard/WizardModal';

// Constants for feat choices
const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

const ARTISAN_TOOLS = [
  "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies",
  "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools",
  "Cook's Utensils", "Glassblower's Tools", "Jeweler's Tools",
  "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies",
  "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools",
  "Woodcarver's Tools"
];

const MUSICAL_INSTRUMENTS = [
  "Bagpipes", "Drum", "Dulcimer", "Flute", "Lute", "Lyre",
  "Horn", "Pan Flute", "Shawm", "Viol"
];

const ALL_TOOLS = [
  ...ARTISAN_TOOLS, "Gaming Set (Dice)", "Gaming Set (Cards)",
  "Gaming Set (Chess)", "Thieves' Tools", "Navigator's Tools",
  "Vehicles (Land)", "Vehicles (Water)"
];

const SPELL_CLASSES = ['Cleric', 'Druid', 'Wizard'];

interface Step3DOriginFeatsProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
  onAdvance?: () => void;
}

const FeatsContainer = styled.div`
  .feats-header {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: center;

    .header-title {
      color: #d4af37;
      font-family: 'Cinzel', serif;
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .header-description {
      color: #ccc;
      font-size: 0.9rem;
      line-height: 1.4;
      margin-bottom: 0.75rem;
    }

    .feat-count {
      color: #d4af37;
      font-weight: 600;
      font-size: 1rem;
    }
  }

  .search-section {
    margin-bottom: 1.5rem;

    .search-input {
      width: 100%;
      background: rgba(26, 26, 26, 0.8);
      border: 2px solid #444;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: #f0f0f0;
      font-size: 1rem;
      transition: border-color 0.3s ease;

      &:focus {
        outline: none;
        border-color: #d4af37;
        box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
      }

      &::placeholder {
        color: #888;
      }
    }
  }
`;

const FeatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FeatCard = styled.div<{ selected: boolean }>`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid ${props => props.selected ? '#d4af37' : '#444'};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 180px;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  ${props => props.selected && `
    background: rgba(212, 175, 55, 0.1);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
  `}
`;

const FeatName = styled.h3`
  color: #d4af37;
  margin: 0 0 0.5rem 0;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  text-align: center;
`;

const FeatDescription = styled.div`
  color: #ccc;
  font-size: 0.85rem;
  line-height: 1.4;
  flex: 1;

  .feat-text {
    margin-bottom: 0.5rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .feat-benefits {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #444;

    .benefit-item {
      margin: 0.25rem 0;
      color: #aaa;
      font-size: 0.75rem;

      .benefit-label {
        color: #d4af37;
        font-weight: 600;
      }
    }
  }
`;

const FeatPrerequisite = styled.div`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: #ff6b6b;
  text-align: center;
`;

const SelectedFeatsSection = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;

  .section-title {
    color: #d4af37;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.75rem;
    text-align: center;
  }

  .selected-feats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;

    .selected-feat {
      background: rgba(26, 26, 26, 0.6);
      border: 1px solid #444;
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      color: #d4af37;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .remove-btn {
        background: none;
        border: none;
        color: #ff6b6b;
        cursor: pointer;
        font-size: 1rem;
        padding: 0;
        line-height: 1;

        &:hover {
          color: #ff4444;
        }
      }
    }
  }

  .no-feats {
    color: #888;
    text-align: center;
    font-style: italic;
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  color: #d4af37;
  padding: 3rem;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: #ff6b6b;
  padding: 2rem;
  font-size: 1rem;
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

export const Step3DOriginFeats: React.FC<Step3DOriginFeatsProps> = ({
  data,
  onUpdate,
  onAdvance
}) => {
  const [feats, setFeats] = useState<Feat[]>([]);
  const [filteredFeats, setFilteredFeats] = useState<Feat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeatForModal, setSelectedFeatForModal] = useState<Feat | null>(null);
  const [modalPage, setModalPage] = useState<'details' | 'choices'>('details');
  const [currentFeatChoices, setCurrentFeatChoices] = useState<any>({});

  useEffect(() => {
    fetchOriginFeats();
  }, []);

  useEffect(() => {
    // Filter feats based on search term
    if (searchTerm.trim() === '') {
      setFilteredFeats(feats);
    } else {
      const filtered = feats.filter(feat => {
        const nameMatch = feat.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Check in feat description and benefits
        let contentMatch = false;
        if (feat.entries.description) {
          contentMatch = feat.entries.description.some((entry: any) =>
            typeof entry === 'string' && entry.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        if (!contentMatch && feat.entries.benefits) {
          contentMatch = feat.entries.benefits.some((entry: any) =>
            typeof entry === 'string' && entry.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        return nameMatch || contentMatch;
      });
      setFilteredFeats(filtered);
    }
  }, [feats, searchTerm]);

  const fetchOriginFeats = async () => {
    try {
      setIsLoading(true);
      const response = await featsService.getAll();
      if (response.data) {
        // Filter for Origin feats (category "O")
        const originFeats = response.data.filter(feat => feat.category === 'O');
        setFeats(originFeats);
        setFilteredFeats(originFeats);
      } else {
        setError(response.error || 'Failed to load origin feats');
      }
    } catch (err) {
      console.error('Error fetching origin feats:', err);
      setError('Failed to load origin feats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatClick = (feat: Feat) => {
    setSelectedFeatForModal(feat);
  };

  const handleFeatSelect = (featName: string) => {
    const currentFeats = data.selectedOriginFeats || [];
    const isAlreadySelected = currentFeats.includes(featName);

    // Find the full feat data
    const featData = feats.find(feat => feat.name === featName);

    if (isAlreadySelected) {
      // Remove feat
      const updatedFeats = currentFeats.filter(name => name !== featName);

      // Remove feat data
      const updatedFeatFeatures = { ...data.featFeatures };
      const updatedFeatSpells = { ...data.featSpells };
      delete updatedFeatFeatures[featName];
      delete updatedFeatSpells[featName];

      onUpdate({
        selectedOriginFeats: updatedFeats,
        featFeatures: updatedFeatFeatures,
        featSpells: updatedFeatSpells
      });
    } else {
      // Extract feat features
      const extractFeatFeatures = (entries: any): any[] => {
        if (!entries) return [];
        if (Array.isArray(entries)) return entries;
        if (typeof entries === 'object') {
          const features = [];
          if (entries.description) features.push(...(Array.isArray(entries.description) ? entries.description : [entries.description]));
          if (entries.benefits) features.push(...(Array.isArray(entries.benefits) ? entries.benefits : [entries.benefits]));
          return features;
        }
        return [];
      };

      // Extract feat spells
      const extractFeatSpells = (additionalSpells: any): string[] => {
        if (!additionalSpells) return [];
        const spells: string[] = [];

        if (Array.isArray(additionalSpells)) {
          additionalSpells.forEach(spell => {
            if (typeof spell === 'string') {
              spells.push(spell);
            } else if (spell.spells) {
              spells.push(...(Array.isArray(spell.spells) ? spell.spells : [spell.spells]));
            }
          });
        }

        return spells;
      };

      // Add feat - if at limit, replace the first selected feat
      let updatedFeats: string[];
      if (currentFeats.length < data.requiredFeatCount) {
        // Under limit - just add the feat
        updatedFeats = [...currentFeats, featName];
      } else {
        // At limit - replace the last selected feat with the new one
        updatedFeats = [...currentFeats];
        updatedFeats[updatedFeats.length - 1] = featName; // Replace the last feat
      }

      // Store feat data
      const updatedFeatFeatures = {
        ...data.featFeatures,
        [featName]: featData ? extractFeatFeatures(featData.entries) : []
      };

      const updatedFeatSpells = {
        ...data.featSpells,
        [featName]: featData ? extractFeatSpells(featData.additionalSpells) : []
      };

      onUpdate({
        selectedOriginFeats: updatedFeats,
        featFeatures: updatedFeatFeatures,
        featSpells: updatedFeatSpells
      });
    }
  };

  // Check if a feat needs choices
  const featNeedsChoices = (featName: string): boolean => {
    return ['Magic Initiate', 'Skilled', 'Crafter', 'Musician'].includes(featName);
  };

  const confirmFeatSelection = () => {
    if (!selectedFeatForModal) return;

    const featName = selectedFeatForModal.name;
    const isAlreadySelected = (data.selectedOriginFeats || []).includes(featName);

    if (isAlreadySelected) {
      // Remove feat
      handleFeatSelect(featName);
      closeModal();
    } else {
      // Add feat
      handleFeatSelect(featName);

      // Check if this feat needs choices
      if (featNeedsChoices(featName)) {
        // Initialize choices for this feat
        setCurrentFeatChoices(data.featChoices?.[featName] || {});
        setModalPage('choices');
      } else {
        // No choices needed, check if we should advance
        const newFeatCount = (data.selectedOriginFeats || []).length + 1;
        closeModal();

        // If we've selected all required feats and none need choices, advance
        if (newFeatCount >= data.requiredFeatCount && onAdvance) {
          setTimeout(() => onAdvance(), 300);
        }
      }
    }
  };

  const closeModal = () => {
    setSelectedFeatForModal(null);
    setModalPage('details');
    setCurrentFeatChoices({});
  };

  // Update feat choice and persist to data
  const updateFeatChoice = (choiceKey: string, value: any) => {
    if (!selectedFeatForModal) return;

    const newChoices = {
      ...currentFeatChoices,
      [choiceKey]: value
    };
    setCurrentFeatChoices(newChoices);

    // Update in parent data
    const newFeatChoices = {
      ...data.featChoices,
      [selectedFeatForModal.name]: newChoices
    };
    onUpdate({ featChoices: newFeatChoices });
  };

  // Check if current feat choices are complete
  const areChoicesComplete = (): boolean => {
    if (!selectedFeatForModal) return false;

    const featName = selectedFeatForModal.name;
    const choices = currentFeatChoices;

    switch (featName) {
      case 'Magic Initiate':
        return !!choices.spellClass;
      case 'Skilled':
        return choices.skills?.length === 3;
      case 'Crafter':
        return choices.tools?.length === 3;
      case 'Musician':
        return choices.instruments?.length === 3;
      default:
        return true;
    }
  };

  // Complete choices and move forward
  const confirmChoices = () => {
    if (!areChoicesComplete()) return;

    const allFeatsSelected = data.selectedOriginFeats.length >= data.requiredFeatCount;
    const allFeatChoicesComplete = data.selectedOriginFeats.every(featName => {
      if (!featNeedsChoices(featName)) return true;
      return !!data.featChoices?.[featName];
    });

    closeModal();

    // If all feats selected and all choices made, advance
    if (allFeatsSelected && allFeatChoicesComplete && onAdvance) {
      setTimeout(() => onAdvance(), 300);
    }
  };

  const removeFeat = (featName: string) => {
    const updatedFeats = (data.selectedOriginFeats || []).filter(name => name !== featName);

    // Remove feat data
    const updatedFeatFeatures = { ...data.featFeatures };
    const updatedFeatSpells = { ...data.featSpells };
    delete updatedFeatFeatures[featName];
    delete updatedFeatSpells[featName];

    onUpdate({
      selectedOriginFeats: updatedFeats,
      featFeatures: updatedFeatFeatures,
      featSpells: updatedFeatSpells
    });
  };

  const formatFeatDescription = (entries: any): string => {
    if (Array.isArray(entries)) {
      return processTraitDescription(entries);
    } else if (typeof entries === 'object' && entries) {
      // Handle the API format: { description: [], benefits: [] }
      // Skip generic "You gain the following benefits." and show actual benefits
      const parts = [];

      if (entries.benefits && entries.benefits.length > 0) {
        // Show benefits first as they're more descriptive
        parts.push(...entries.benefits);
      }

      if (entries.description && entries.description.length > 0) {
        // Filter out generic description text
        const filteredDescription = entries.description.filter((desc: string) =>
          desc && !desc.includes('You gain the following benefits') && desc.trim().length > 10
        );
        parts.push(...filteredDescription);
      }

      return processTraitDescription(parts);
    }
    return '';
  };

  // Render choice UI for Magic Initiate
  const renderMagicInitiateChoices = () => {
    const choices = currentFeatChoices;
    const SPELLCASTING_ABILITIES: Record<string, string> = { 'Cleric': 'WIS', 'Druid': 'WIS', 'Wizard': 'INT' };

    return (
      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem' }}>Choose Spell Class</h3>
        <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Select which spell class you want to learn spells from.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {SPELL_CLASSES.map((spellClass) => (
            <div
              key={spellClass}
              onClick={() => updateFeatChoice('spellClass', spellClass)}
              style={{
                background: choices.spellClass === spellClass ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
                border: `2px solid ${choices.spellClass === spellClass ? '#d4af37' : '#444'}`,
                borderRadius: '8px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
            >
              <div style={{ color: '#d4af37', fontWeight: 600, marginBottom: '0.25rem' }}>{spellClass}</div>
              <div style={{ color: '#ccc', fontSize: '0.8rem' }}>
                Ability: {SPELLCASTING_ABILITIES[spellClass]}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render choice UI for Skilled
  const renderSkilledChoices = () => {
    const choices = currentFeatChoices;
    const selectedItems = choices.skills || [];
    const SKILLS_AND_TOOLS = [
      ...ALL_SKILLS.map(skill => ({ name: skill, type: 'skill' })),
      ...ALL_TOOLS.map(tool => ({ name: tool, type: 'tool' }))
    ];

    return (
      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem' }}>Choose Skills or Tools</h3>
        <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Select any combination of 3 skills or tools. Selected: {selectedItems.length}/3
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
          {SKILLS_AND_TOOLS.map((item) => {
            const isSelected = selectedItems.includes(item.name);
            const canSelect = selectedItems.length < 3 || isSelected;

            return (
              <div
                key={item.name}
                onClick={() => {
                  if (isSelected) {
                    updateFeatChoice('skills', selectedItems.filter((s: string) => s !== item.name));
                  } else if (canSelect) {
                    updateFeatChoice('skills', [...selectedItems, item.name]);
                  }
                }}
                style={{
                  background: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
                  border: `2px solid ${isSelected ? '#d4af37' : '#444'}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  cursor: canSelect ? 'pointer' : 'not-allowed',
                  opacity: canSelect ? 1 : 0.5,
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{ color: '#d4af37', fontSize: '0.85rem' }}>{item.name}</div>
                <div style={{ color: '#888', fontSize: '0.7rem', textTransform: 'capitalize', marginTop: '0.25rem' }}>
                  {item.type}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render choice UI for Crafter
  const renderCrafterChoices = () => {
    const choices = currentFeatChoices;
    const selectedTools = choices.tools || [];

    return (
      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem' }}>Choose Artisan's Tools</h3>
        <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Choose 3 different Artisan's Tools. Selected: {selectedTools.length}/3
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {ARTISAN_TOOLS.map((tool) => {
            const isSelected = selectedTools.includes(tool);
            const canSelect = selectedTools.length < 3 || isSelected;

            return (
              <div
                key={tool}
                onClick={() => {
                  if (isSelected) {
                    updateFeatChoice('tools', selectedTools.filter((t: string) => t !== tool));
                  } else if (canSelect) {
                    updateFeatChoice('tools', [...selectedTools, tool]);
                  }
                }}
                style={{
                  background: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
                  border: `2px solid ${isSelected ? '#d4af37' : '#444'}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  cursor: canSelect ? 'pointer' : 'not-allowed',
                  opacity: canSelect ? 1 : 0.5,
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{ color: '#d4af37', fontSize: '0.85rem' }}>{tool}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render choice UI for Musician
  const renderMusicianChoices = () => {
    const choices = currentFeatChoices;
    const selectedInstruments = choices.instruments || [];

    return (
      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '0.75rem' }}>Choose Musical Instruments</h3>
        <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Choose 3 different Musical Instruments. Selected: {selectedInstruments.length}/3
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
          {MUSICAL_INSTRUMENTS.map((instrument) => {
            const isSelected = selectedInstruments.includes(instrument);
            const canSelect = selectedInstruments.length < 3 || isSelected;

            return (
              <div
                key={instrument}
                onClick={() => {
                  if (isSelected) {
                    updateFeatChoice('instruments', selectedInstruments.filter((i: string) => i !== instrument));
                  } else if (canSelect) {
                    updateFeatChoice('instruments', [...selectedInstruments, instrument]);
                  }
                }}
                style={{
                  background: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'rgba(26, 26, 26, 0.8)',
                  border: `2px solid ${isSelected ? '#d4af37' : '#444'}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  cursor: canSelect ? 'pointer' : 'not-allowed',
                  opacity: canSelect ? 1 : 0.5,
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{ color: '#d4af37', fontSize: '0.85rem' }}>{instrument}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFeatDetails = (feat: Feat) => {
    const entries = feat.entries;
    let content = [];

    if (entries.description) content.push(...entries.description);
    if (entries.benefits) content.push(...entries.benefits);

    const { text } = processTraitDescriptionWithTables(content);
    return text;
  };

  const renderFeatDetailsContent = (feat: Feat) => (
    <>
      {feat.prerequisites && (
        <FeatPrerequisite>
          Prerequisite: {JSON.stringify(feat.prerequisites)}
        </FeatPrerequisite>
      )}

      <div
        className="feat-details"
        dangerouslySetInnerHTML={{ __html: renderFeatDetails(feat) }}
      />

      <div
        style={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#888',
          marginTop: '1rem',
        }}
      >
        <strong>Source:</strong> {feat.sourceBook}
      </div>
    </>
  );

  const renderFeatChoicesContent = (feat: Feat) => {
    const featName = feat.name.toLowerCase();

    switch (featName) {
      case 'magic initiate':
        return renderMagicInitiateChoices();
      case 'skilled':
        return renderSkilledChoices();
      case 'crafter':
        return renderCrafterChoices();
      case 'musician':
        return renderMusicianChoices();
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <StepContainer>
        <div className="step-title">Origin Feats</div>
        <LoadingSpinner>Loading origin feats...</LoadingSpinner>
      </StepContainer>
    );
  }

  if (error) {
    return (
      <StepContainer>
        <div className="step-title">Origin Feats</div>
        <ErrorMessage>Error: {error}</ErrorMessage>
      </StepContainer>
    );
  }

  const selectedFeats = data.selectedOriginFeats || [];
  const remainingFeats = data.requiredFeatCount - selectedFeats.length;

  return (
    <StepContainer>
      <div className="step-title">Origin Feats</div>
      <div className="step-description">
        Choose {data.requiredFeatCount} Origin Feat{data.requiredFeatCount > 1 ? 's' : ''} to customize your character's abilities.
        {data.isHuman && (
          <span style={{ color: '#d4af37', marginLeft: '0.5rem' }}>
            🌟 Humans get 2 Origin Feats!
          </span>
        )}
      </div>

      <AbilityScoresHeader data={data} />

      <div className="step-content">
        <FeatsContainer>
          <div className="feats-header">
            <div className="header-title">Origin Feats Selection</div>
            <div className="header-description">
              Origin feats are special abilities that define your character's background and training.
              These feats are available to all characters at 1st level.
            </div>
            <div className="feat-count">
              Selected: {selectedFeats.length} / {data.requiredFeatCount}
              {remainingFeats > 0 && (
                <span style={{ color: '#ff6b6b', marginLeft: '1rem' }}>
                  ({remainingFeats} remaining)
                </span>
              )}
            </div>
          </div>

          <div className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder="Search feats by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <FeatsGrid>
            {filteredFeats.map((feat) => (
              <FeatCard
                key={feat.id}
                selected={selectedFeats.includes(feat.name)}
                onClick={() => handleFeatClick(feat)}
              >
                <FeatName>{feat.name}</FeatName>

                {feat.prerequisites && (
                  <FeatPrerequisite>
                    Prerequisite: {JSON.stringify(feat.prerequisites)}
                  </FeatPrerequisite>
                )}

                <FeatDescription>
                  <div
                    className="feat-text"
                    dangerouslySetInnerHTML={{
                      __html: formatFeatDescription(feat.entries).substring(0, 200) +
                              (formatFeatDescription(feat.entries).length > 200 ? '...' : '')
                    }}
                  />

                  {feat.abilityScoreIncrease && (
                    <div className="feat-benefits">
                      <div className="benefit-item">
                        <span className="benefit-label">Ability Score Increase</span>
                      </div>
                    </div>
                  )}
                </FeatDescription>
              </FeatCard>
            ))}
          </FeatsGrid>

          {filteredFeats.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#888',
              padding: '2rem',
              fontStyle: 'italic'
            }}>
              No feats found matching your search.
            </div>
          )}

          <SelectedFeatsSection>
            <div className="section-title">Selected Origin Feats</div>
            {selectedFeats.length > 0 ? (
              <div className="selected-feats">
                {selectedFeats.map((featName) => (
                  <div key={featName} className="selected-feat">
                    {featName}
                    <button
                      className="remove-btn"
                      onClick={() => removeFeat(featName)}
                      title="Remove feat"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-feats">
                No feats selected yet. Choose {data.requiredFeatCount} feat{data.requiredFeatCount > 1 ? 's' : ''} from the list above.
              </div>
            )}
          </SelectedFeatsSection>

          {selectedFeats.length !== data.requiredFeatCount && (
            <div style={{
              textAlign: 'center',
              color: '#ff6b6b',
              marginTop: '1rem',
              fontSize: '0.9rem'
            }}>
              ⚠️ Please select exactly {data.requiredFeatCount} feat{data.requiredFeatCount > 1 ? 's' : ''} before proceeding.
            </div>
          )}
        </FeatsContainer>
      </div>

      {selectedFeatForModal && (
        <WizardModal
          isOpen={Boolean(selectedFeatForModal)}
          onClose={closeModal}
          title={
            modalPage === 'details'
              ? selectedFeatForModal.name
              : `${selectedFeatForModal.name} - Make Choices`
          }
          maxWidth="800px"
          footer={
            modalPage === 'details' ? (
              <ModalButtons>
                <button className="btn-cancel" onClick={closeModal}>
                  Close
                </button>
                <button
                  className="btn-confirm"
                  onClick={confirmFeatSelection}
                >
                  {selectedFeats.includes(selectedFeatForModal.name)
                    ? 'Remove Feat'
                    : 'Select Feat'}
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
            ? renderFeatDetailsContent(selectedFeatForModal)
            : renderFeatChoicesContent(selectedFeatForModal)}
        </WizardModal>
      )}
    </StepContainer>
  );
};
