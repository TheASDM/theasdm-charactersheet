import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import featsService, { Feat } from '../../services/featsService';
import { processTraitDescriptionWithTables, processTraitDescription } from '../../utils/textProcessor';
import { AbilityScoresHeader } from './AbilityScoresHeader';

interface Step3DOriginFeatsProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid #d4af37;
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  color: #f0f0f0;
  max-height: 80vh;
  overflow-y: auto;

  h2 {
    font-family: 'Cinzel', serif;
    color: #d4af37;
    font-size: 1.8rem;
    margin: 0 0 1rem 0;
    text-align: center;
  }

  .feat-details {
    color: #ccc;
    font-size: 0.9rem;
    line-height: 1.4;
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

export const Step3DOriginFeats: React.FC<Step3DOriginFeatsProps> = ({
  data,
  onUpdate
}) => {
  const [feats, setFeats] = useState<Feat[]>([]);
  const [filteredFeats, setFilteredFeats] = useState<Feat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeatForModal, setSelectedFeatForModal] = useState<Feat | null>(null);

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

  const confirmFeatSelection = () => {
    if (selectedFeatForModal) {
      handleFeatSelect(selectedFeatForModal.name);
      closeModal();
    }
  };

  const closeModal = () => {
    setSelectedFeatForModal(null);
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

  const renderFeatDetails = (feat: Feat) => {
    const entries = feat.entries;
    let content = [];

    if (entries.description) content.push(...entries.description);
    if (entries.benefits) content.push(...entries.benefits);

    const { text } = processTraitDescriptionWithTables(content);
    return text;
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

      {/* Feat Detail Modal */}
      {selectedFeatForModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>{selectedFeatForModal.name}</h2>

            {selectedFeatForModal.prerequisites && (
              <FeatPrerequisite>
                Prerequisite: {JSON.stringify(selectedFeatForModal.prerequisites)}
              </FeatPrerequisite>
            )}

            <div
              className="feat-details"
              dangerouslySetInnerHTML={{ __html: renderFeatDetails(selectedFeatForModal) }}
            />

            <div style={{
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#888',
              marginTop: '1rem',
              marginBottom: '1rem'
            }}>
              <strong>Source:</strong> {selectedFeatForModal.sourceBook}
            </div>

            <ModalButtons>
              <button className="btn-cancel" onClick={closeModal}>
                Close
              </button>
              <button
                className="btn-confirm"
                onClick={confirmFeatSelection}
              >
                {selectedFeats.includes(selectedFeatForModal.name) ? 'Remove Feat' : 'Select Feat'}
              </button>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </StepContainer>
  );
};