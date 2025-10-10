import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Modal Overlay
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
`;

// Main Modal Container
const TraitsModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #ce9016;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 1000px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
`;

const ModalTitle = styled.h2`
  color: #ce9016;
  margin: 0 0 20px 0;
  font-size: 1.4rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid #ce9016;
  padding-bottom: 10px;
`;

// Tabs for different trait categories
const TabContainer = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 20px;
  border-bottom: 2px solid #8b6914;
`;

const Tab = styled.button<{ active?: boolean }>`
  padding: 10px 20px;
  background: ${props => props.active ? 'linear-gradient(145deg, #ce9016, #b8860b)' : 'rgba(139, 105, 20, 0.2)'};
  color: ${props => props.active ? '#2c1810' : '#f4e7d1'};
  border: none;
  border-radius: 6px 6px 0 0;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: ${props => props.active ? 'linear-gradient(145deg, #b8860b, #a0801b)' : 'rgba(206, 144, 22, 0.2)'};
  }
`;

// Traits Container
const TraitsContainer = styled.div`
  margin-bottom: 20px;
`;

const TraitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const TraitCard = styled.div<{ editing?: boolean }>`
  background: ${props => props.editing ? 'rgba(206, 144, 22, 0.15)' : 'rgba(139, 105, 20, 0.1)'};
  border: 2px solid ${props => props.editing ? '#ce9016' : 'rgba(139, 105, 20, 0.3)'};
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
  cursor: ${props => props.editing ? 'default' : 'pointer'};

  &:hover {
    background: ${props => props.editing ? 'rgba(206, 144, 22, 0.15)' : 'rgba(139, 105, 20, 0.15)'};
    border-color: ${props => props.editing ? '#ce9016' : 'rgba(139, 105, 20, 0.5)'};
  }
`;

const TraitHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const TraitName = styled.h3`
  color: #ce9016;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  flex: 1;
`;

const TraitSource = styled.span`
  color: #8b6914;
  font-size: 0.7rem;
  font-weight: 400;
  text-transform: uppercase;
  margin-left: 10px;
`;

const TraitDescription = styled.p`
  color: #c4b49d;
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
  font-family: 'Crimson Text', serif;
`;

const TraitActionButton = styled.button<{ variant?: 'edit' | 'save' | 'cancel' | 'delete' }>`
  background: ${props => {
    switch (props.variant) {
      case 'save': return 'linear-gradient(145deg, #28a745, #20892c)';
      case 'cancel': return 'linear-gradient(145deg, #6c757d, #5a6268)';
      case 'delete': return 'linear-gradient(145deg, #dc3545, #c82333)';
      case 'edit':
      default: return 'linear-gradient(145deg, #17a2b8, #138496)';
    }
  }};
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin-left: 5px;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Add New Trait Section
const AddTraitSection = styled.div`
  background: rgba(206, 144, 22, 0.1);
  border: 2px dashed #ce9016;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const AddTraitTitle = styled.h3`
  color: #ce9016;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  text-align: center;
`;

const AddTraitForm = styled.div`
  display: grid;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: #8b6914;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  background: rgba(139, 105, 20, 0.2);
  border: 2px solid #8b6914;
  border-radius: 6px;
  color: #f4e7d1;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  padding: 10px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
    box-shadow: 0 0 8px rgba(206, 144, 22, 0.3);
  }

  &::placeholder {
    color: rgba(244, 231, 209, 0.5);
  }
`;

const TextArea = styled.textarea`
  background: rgba(139, 105, 20, 0.2);
  border: 2px solid #8b6914;
  border-radius: 6px;
  color: #f4e7d1;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  padding: 10px;
  resize: vertical;
  min-height: 100px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
    box-shadow: 0 0 8px rgba(206, 144, 22, 0.3);
  }

  &::placeholder {
    color: rgba(244, 231, 209, 0.5);
  }
`;

const Select = styled.select`
  background: rgba(139, 105, 20, 0.2);
  border: 2px solid #8b6914;
  border-radius: 6px;
  color: #f4e7d1;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  padding: 10px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
    box-shadow: 0 0 8px rgba(206, 144, 22, 0.3);
  }

  option {
    background: #2a2520;
    color: #f4e7d1;
  }
`;

// Button Container
const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AddButton = styled(Button)`
  background: linear-gradient(145deg, #28a745, #20892c);
  color: white;

  &:hover {
    background: linear-gradient(145deg, #20892c, #1e7e34);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
  }

  &:disabled {
    background: linear-gradient(145deg, #6c757d, #5a6268);
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const CancelButton = styled(Button)`
  background: rgba(139, 69, 19, 0.8);
  color: #f4e7d1;

  &:hover {
    background: rgba(139, 69, 19, 1);
    transform: translateY(-2px);
  }
`;

const SaveButton = styled(Button)`
  background: linear-gradient(145deg, #ce9016, #b8860b);
  color: #2c1810;

  &:hover {
    background: linear-gradient(145deg, #b8860b, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #8b6914;
  font-style: italic;
  padding: 40px;
  font-size: 1.1rem;
`;

// Types
type TraitType = 'classFeatures' | 'speciesTraits' | 'customTraits';

interface TraitData {
  name: string;
  description: string;
  source: string;
  type: TraitType;
}

interface TraitsManagementModalProps {
  isOpen: boolean;
  classFeatures: string[];
  speciesTraits: string[];
  customTraits?: TraitData[];
  onSave: (traits: {
    classFeatures: string[];
    speciesTraits: string[];
    customTraits: TraitData[];
  }) => void;
  onCancel: () => void;
}

const TraitsManagementModal: React.FC<TraitsManagementModalProps> = ({
  isOpen,
  classFeatures,
  speciesTraits,
  customTraits = [],
  onSave,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<TraitType>('classFeatures');
  const [currentTraits, setCurrentTraits] = useState({
    classFeatures: [...classFeatures],
    speciesTraits: [...speciesTraits],
    customTraits: [...customTraits]
  });

  const [newTrait, setNewTrait] = useState({
    name: '',
    description: '',
    source: 'Custom',
    type: 'customTraits' as TraitType
  });

  // Editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<TraitType | null>(null);
  const [editingTrait, setEditingTrait] = useState({ name: '', description: '' });

  // Initialize with provided traits when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentTraits({
        classFeatures: [...classFeatures],
        speciesTraits: [...speciesTraits],
        customTraits: [...customTraits]
      });
      setNewTrait({
        name: '',
        description: '',
        source: 'Custom',
        type: 'customTraits'
      });
      setActiveTab('classFeatures');
      setEditingIndex(null);
      setEditingType(null);
      setEditingTrait({ name: '', description: '' });
    }
  }, [isOpen, classFeatures, speciesTraits, customTraits]);

  const parseTraitString = (traitString: string): { name: string; description: string } => {
    const colonIndex = traitString.indexOf(':');
    if (colonIndex > 0 && colonIndex < traitString.length - 1) {
      return {
        name: traitString.substring(0, colonIndex).trim(),
        description: traitString.substring(colonIndex + 1).trim()
      };
    }
    return {
      name: traitString.trim(),
      description: ''
    };
  };

  const formatTraitString = (name: string, description: string): string => {
    if (description.trim()) {
      return `${name.trim()}: ${description.trim()}`;
    }
    return name.trim();
  };

  const getTraitsForTab = (tab: TraitType): TraitData[] => {
    switch (tab) {
      case 'classFeatures':
        return currentTraits.classFeatures.map((feature) => {
          const parsed = parseTraitString(feature);
          return {
            name: parsed.name || feature,
            description: parsed.description || 'Class feature',
            source: 'Class',
            type: 'classFeatures' as TraitType
          };
        });
      case 'speciesTraits':
        return currentTraits.speciesTraits.map((trait) => {
          const parsed = parseTraitString(trait);
          return {
            name: parsed.name || trait,
            description: parsed.description || 'Species trait',
            source: 'Species',
            type: 'speciesTraits' as TraitType
          };
        });
      case 'customTraits':
        return currentTraits.customTraits;
      default:
        return [];
    }
  };

  const handleAddTrait = () => {
    if (!newTrait.name.trim()) return;

    if (newTrait.type === 'customTraits') {
      setCurrentTraits(prev => ({
        ...prev,
        customTraits: [...prev.customTraits, { ...newTrait }]
      }));
    } else {
      const traitString = formatTraitString(newTrait.name, newTrait.description);
      setCurrentTraits(prev => ({
        ...prev,
        [newTrait.type]: [...prev[newTrait.type], traitString]
      }));
    }

    setNewTrait({
      name: '',
      description: '',
      source: 'Custom',
      type: activeTab === 'customTraits' ? 'customTraits' : 'customTraits'
    });
  };

  const handleRemoveTrait = (index: number, type: TraitType) => {
    setCurrentTraits(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleStartEdit = (index: number, type: TraitType) => {
    const traits = getTraitsForTab(type);
    const trait = traits[index];
    setEditingIndex(index);
    setEditingType(type);
    setEditingTrait({ name: trait.name, description: trait.description });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || editingType === null) return;

    if (editingType === 'customTraits') {
      setCurrentTraits(prev => ({
        ...prev,
        customTraits: prev.customTraits.map((trait, i) =>
          i === editingIndex ? { ...trait, name: editingTrait.name, description: editingTrait.description } : trait
        )
      }));
    } else {
      const traitString = formatTraitString(editingTrait.name, editingTrait.description);
      setCurrentTraits(prev => ({
        ...prev,
        [editingType]: prev[editingType].map((trait, i) => i === editingIndex ? traitString : trait)
      }));
    }

    setEditingIndex(null);
    setEditingType(null);
    setEditingTrait({ name: '', description: '' });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingType(null);
    setEditingTrait({ name: '', description: '' });
  };

  const handleSave = () => {
    onSave(currentTraits);
  };

  const getTabDisplayName = (tab: TraitType): string => {
    switch (tab) {
      case 'classFeatures': return 'Class Features';
      case 'speciesTraits': return 'Species Traits';
      case 'customTraits': return 'Custom Traits';
      default: return '';
    }
  };

  const currentTabTraits = getTraitsForTab(activeTab);

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <TraitsModal>
        <ModalTitle>🌟 Manage Features & Traits</ModalTitle>

        {/* Tab Navigation */}
        <TabContainer>
          {(['classFeatures', 'speciesTraits', 'customTraits'] as TraitType[]).map(tab => (
            <Tab
              key={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {getTabDisplayName(tab)}
            </Tab>
          ))}
        </TabContainer>

        {/* Traits Display */}
        <TraitsContainer>
          {currentTabTraits.length === 0 ? (
            <EmptyState>
              No {getTabDisplayName(activeTab).toLowerCase()} yet.
              {activeTab === 'customTraits' && ' Add your first custom trait below!'}
            </EmptyState>
          ) : (
            <TraitsGrid>
              {currentTabTraits.map((trait, index) => {
                const isEditing = editingIndex === index && editingType === activeTab;
                return (
                  <TraitCard
                    key={`${activeTab}-${index}`}
                    editing={isEditing}
                    onClick={() => !isEditing && handleStartEdit(index, activeTab)}
                  >
                    <TraitHeader>
                      <div style={{ flex: 1 }}>
                        {isEditing ? (
                          <div>
                            <Input
                              type="text"
                              value={editingTrait.name}
                              onChange={(e) => setEditingTrait(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Trait name"
                              style={{ marginBottom: '8px', fontSize: '1rem' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <TraitSource>{trait.source}</TraitSource>
                          </div>
                        ) : (
                          <div>
                            <TraitName>{trait.name}</TraitName>
                            <TraitSource>{trait.source}</TraitSource>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {isEditing ? (
                          <>
                            <TraitActionButton
                              variant="save"
                              onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                              title="Save changes"
                            >
                              ✓
                            </TraitActionButton>
                            <TraitActionButton
                              variant="cancel"
                              onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                              title="Cancel editing"
                            >
                              ✕
                            </TraitActionButton>
                          </>
                        ) : (
                          <>
                            <TraitActionButton
                              variant="edit"
                              onClick={(e) => { e.stopPropagation(); handleStartEdit(index, activeTab); }}
                              title="Edit trait"
                            >
                              ✎
                            </TraitActionButton>
                            {activeTab === 'customTraits' && (
                              <TraitActionButton
                                variant="delete"
                                onClick={(e) => { e.stopPropagation(); handleRemoveTrait(index, activeTab); }}
                                title="Remove trait"
                              >
                                🗑
                              </TraitActionButton>
                            )}
                          </>
                        )}
                      </div>
                    </TraitHeader>
                    {isEditing ? (
                      <TextArea
                        value={editingTrait.description}
                        onChange={(e) => setEditingTrait(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Trait description"
                        style={{ minHeight: '80px', marginTop: '8px' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <TraitDescription>{trait.description}</TraitDescription>
                    )}
                  </TraitCard>
                );
              })}
            </TraitsGrid>
          )}
        </TraitsContainer>

        {/* Add New Trait Section - Only show if not editing */}
        {editingIndex === null && (
        <AddTraitSection>
          <AddTraitTitle>
            ➕ Add New {getTabDisplayName(activeTab === 'customTraits' ? 'customTraits' : activeTab).slice(0, -1)}
          </AddTraitTitle>
          <AddTraitForm>
            <FormGroup>
              <Label>Trait/Feature Name</Label>
              <Input
                type="text"
                value={newTrait.name}
                placeholder="e.g., Darkvision, Second Wind, Lucky"
                onChange={(e) => setNewTrait({...newTrait, name: e.target.value})}
              />
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <TextArea
                value={newTrait.description}
                placeholder="Describe the trait or feature effects..."
                onChange={(e) => setNewTrait({...newTrait, description: e.target.value})}
              />
            </FormGroup>

            {activeTab === 'customTraits' && (
              <FormGroup>
                <Label>Source</Label>
                <Select
                  value={newTrait.source}
                  onChange={(e) => setNewTrait({...newTrait, source: e.target.value})}
                >
                  <option value="Custom">Custom</option>
                  <option value="Homebrew">Homebrew</option>
                  <option value="Magic Item">Magic Item</option>
                  <option value="Blessing">Blessing</option>
                  <option value="Curse">Curse</option>
                  <option value="Other">Other</option>
                </Select>
              </FormGroup>
            )}

            <ButtonContainer>
              <AddButton
                onClick={handleAddTrait}
                disabled={!newTrait.name.trim()}
              >
                Add {activeTab === 'customTraits' ? 'Trait' : 'Feature'}
              </AddButton>
            </ButtonContainer>
          </AddTraitForm>
        </AddTraitSection>
        )}

        {/* Modal Actions */}
        <ButtonContainer>
          <CancelButton onClick={onCancel}>
            Cancel
          </CancelButton>
          <SaveButton onClick={handleSave}>
            Save Changes
          </SaveButton>
        </ButtonContainer>
      </TraitsModal>
    </ModalOverlay>
  );
};

export default TraitsManagementModal;