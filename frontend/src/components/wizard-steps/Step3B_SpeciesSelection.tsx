import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import speciesService from '../../services/speciesService';
import { Species as ApiSpecies } from '../../types/api';
import { processTraitDescriptionWithTables, processTraitDescription } from '../../utils/textProcessor';
import { AbilityScoresHeader } from './AbilityScoresHeader';

interface Step3BSpeciesSelectionProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
  onAdvance?: () => void;
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

const LoadingSpinner = styled.div`
  text-align: center;
  color: #d4af37;
  padding: 2rem;
  font-size: 1.1rem;
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
  max-width: 900px;
  width: 100%;
  color: #f0f0f0;

  h2 {
    font-family: 'Cinzel', serif;
    color: #d4af37;
    font-size: 1.8rem;
    margin: 0 0 1rem 0;
    text-align: center;
  }

  .species-description {
    color: #ccc;
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 1rem;
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
  onAdvance
}) => {
  const [species, setSpecies] = useState<Species[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpeciesForModal, setSelectedSpeciesForModal] = useState<Species | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    fetchSpecies();
  }, []);

  const fetchSpecies = async () => {
    try {
      setIsLoading(true);
      const response = await speciesService.getAll();
      if (response.data) {
        setSpecies(response.data);
      } else {
        setError(response.error || 'Failed to load species');
      }
    } catch (err) {
      console.error('Error fetching species:', err);
      setError('Failed to load species');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeciesClick = (speciesData: Species) => {
    setSelectedSpeciesForModal(speciesData);
  };

  const handleSpeciesSelect = (speciesData: Species) => {
    try {
      console.log('Selecting species:', speciesData.name);
      console.log('Species data:', speciesData);

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
          console.error('Error extracting traits:', error);
          return [];
        }
      };

      const safeGetSize = (size: string | string[]): string => {
        try {
          if (Array.isArray(size)) return size[0] || 'Medium';
          return size || 'Medium';
        } catch (error) {
          console.error('Error getting size:', error);
          return 'Medium';
        }
      };

      const safeGetSpeed = (speed: any): number => {
        try {
          if (typeof speed === 'number') return speed;
          if (typeof speed === 'object' && speed.walk) return speed.walk;
          return 30; // Default speed
        } catch (error) {
          console.error('Error getting speed:', error);
          return 30;
        }
      };

      const updateData = {
        selectedSpecies: speciesData.name,
        isHuman: isHuman,
        requiredFeatCount: isHuman ? 2 : 1, // Humans get an extra feat

        // Extract and store basic species data
        speciesTraits: safeExtractTraits(speciesData.traits),
        speciesSize: safeGetSize(speciesData.size),
        speciesSpeed: safeGetSpeed(speciesData.speed),

        // Simplified placeholders for now
        speciesSpells: { cantrips: [], level1: [], level3: [], level5: [] },
        speciesDarkvision: 0, // TODO: Extract from traits
        speciesResistances: [], // TODO: Extract from traits
        speciesImmunities: [] // TODO: Extract immunities
      };

      console.log('Updating with data:', updateData);
      onUpdate(updateData);
      console.log('Species selection completed successfully');

    } catch (error) {
      console.error('Error in handleSpeciesSelect:', error);
      // Fallback to basic update
      onUpdate({
        selectedSpecies: speciesData.name,
        isHuman: speciesData.name.toLowerCase() === 'human',
        requiredFeatCount: speciesData.name.toLowerCase() === 'human' ? 2 : 1
      });
    }
  };

  const confirmSpeciesSelection = () => {
    if (selectedSpeciesForModal && onAdvance) {
      // Start transition
      setIsTransitioning(true);
      closeModal();

      // Small delay for transition effect
      setTimeout(() => {
        handleSpeciesSelect(selectedSpeciesForModal);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Trigger advance to next step
        setTimeout(() => {
          setIsTransitioning(false);
          onAdvance();
        }, 500);
      }, 300);
    }
  };

  const closeModal = () => {
    setSelectedSpeciesForModal(null);
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

  const renderTraitContent = (trait: any) => {
    const { text, tables, lists } = processTraitDescriptionWithTables(trait.description);

    // Debug logging
    if (trait.name === 'Celestial Revelation') {
      console.log('Celestial Revelation trait:', trait);
      console.log('Processed text:', text);
      console.log('Extracted tables:', tables);
      console.log('Extracted lists:', lists);
    }

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

  if (isLoading) {
    return (
      <StepContainer>
        <div className="step-title">Species</div>
        <LoadingSpinner>Loading species...</LoadingSpinner>
      </StepContainer>
    );
  }

  if (error) {
    return (
      <StepContainer>
        <div className="step-title">Species</div>
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '2rem' }}>
          Error: {error}
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer style={{
      opacity: isTransitioning ? 0.3 : 1,
      transition: 'opacity 0.3s ease',
      position: 'relative'
    }}>
      {/* Transition Screen */}
      {isTransitioning && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 999,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2520 100%)',
          border: '3px solid #d4af37',
          borderRadius: '12px',
          padding: '2rem 3rem',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
          animation: 'fadeInScale 0.3s ease',
        }}>
          <h2 style={{
            color: '#d4af37',
            fontFamily: 'Cinzel, serif',
            fontSize: '1.8rem',
            margin: 0,
            textAlign: 'center',
          }}>
            Configuring {selectedSpeciesForModal?.name}...
          </h2>
          <p style={{
            color: '#ccc',
            marginTop: '0.5rem',
            textAlign: 'center',
          }}>
            Setting up species choices and traits
          </p>
        </div>
      )}

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

      {/* Species Detail Modal */}
      {selectedSpeciesForModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>{selectedSpeciesForModal.name}</h2>

            <div className="species-description">
              {getSpeciesSize(selectedSpeciesForModal.size)} {selectedSpeciesForModal.creatureType} • {selectedSpeciesForModal.speed} ft Speed
            </div>

            <TraitsSection>
              <h3>Species Traits</h3>
              <div className="traits-grid">
                {getTraitList(selectedSpeciesForModal.traits).map((trait, index) => (
                  <div key={index} className="trait-item">
                    <div className="trait-name">{trait.name || `Trait ${index + 1}`}</div>
                    {renderTraitContent(trait)}
                  </div>
                ))}
              </div>
            </TraitsSection>

            {selectedSpeciesForModal.skillProficiencies && (
              <ModalSection>
                <h3>Skill Proficiencies</h3>
                <div className="section-content">
                  {Array.isArray(selectedSpeciesForModal.skillProficiencies)
                    ? selectedSpeciesForModal.skillProficiencies.map((prof: any, idx: number) => {
                        if (typeof prof === 'string') return <div key={idx}>{prof}</div>;
                        if (prof.choose) return <div key={idx}>Choose {prof.choose.count || 1} from: {prof.choose.from?.join(', ') || 'various skills'}</div>;
                        if (prof.any) return <div key={idx}>Choose {prof.any} skill from any skill list</div>;
                        return <div key={idx}>{JSON.stringify(prof)}</div>;
                      })
                    : (
                      <div dangerouslySetInnerHTML={{
                        __html: processTraitDescription(selectedSpeciesForModal.skillProficiencies)
                      }} />
                    )}
                </div>
              </ModalSection>
            )}

            {/* Small info at bottom */}
            <div style={{
              textAlign: 'center',
              fontSize: '0.7rem',
              color: '#888',
              marginTop: '1rem',
              marginBottom: '1rem'
            }}>
              <strong>Source:</strong> {selectedSpeciesForModal.contentVersion} Player's Handbook
              {selectedSpeciesForModal.name.toLowerCase() === 'human' && (
                <div style={{ color: '#d4af37', marginTop: '0.25rem' }}>
                  🌟 Humans receive 2 Origin Feats instead of 1
                </div>
              )}
            </div>

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
          </ModalContent>
        </ModalOverlay>
      )}
    </StepContainer>
  );
};