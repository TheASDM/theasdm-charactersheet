import React from 'react';
import styled from 'styled-components';
import { CharacterClass } from '../types/api';
import { parseDnDTemplateTag } from '../utils/dndTemplateParser';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ClassModalProps {
  characterClass: CharacterClass | null;
  isOpen: boolean;
  onClose: () => void;
}

// Styled components
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${(props) => (props.isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  /* No overflow - backdrop doesn't scroll */
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1e1e1e 0%, #2b2b2b 100%);
  border: 2px solid #ce9016;
  border-radius: 14px;
  max-width: 960px;
  width: 100%;
  max-height: calc(100vh - clamp(5rem, 12vh, 7rem));
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.68);
  color: #f0f0f0;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem 0 1.5rem;
  flex-shrink: 0;
`;

const HeaderContent = styled.div`
  flex: 1;
  text-align: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ce9016;
  font-size: 1.55rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: #e0a523;
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem 1.5rem 1.35rem;
  overflow-y: auto;
  flex: 1;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(35, 35, 35, 0.5);
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ce9016;
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #b8860b;
  }
`;

const ClassTitle = styled.h2`
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: clamp(1.35rem, 2.4vw, 1.6rem);
  color: #ce9016;
`;

const ClassMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`;

const MetaItem = styled.div`
  background: rgba(35, 35, 35, 0.5);
  padding: 0.85rem;
  border-radius: 6px;
  border-left: 3px solid #ce9016;

  h4 {
    color: #ce9016;
    margin: 0 0 0.35rem 0;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin: 0;
    color: #f4e7d1;
    font-weight: 500;
    font-size: 0.9rem;
  }
`;

const Section = styled.div`
  margin-bottom: 1.25rem;
  background: rgba(35, 35, 35, 0.3);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #444;

  h3 {
    color: #ce9016;
    font-size: 1rem;
    margin: 0 0 0.75rem 0;
    font-family: 'Cinzel', serif;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const FeaturesList = styled.div`
  background: rgba(35, 35, 35, 0.5);
  border-radius: 6px;
  padding: 0.75rem;
`;

const FeatureItem = styled.div`
  margin-bottom: 0.5rem;
  color: #f4e7d1;
  line-height: 1.5;
  font-size: 0.9rem;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: #ce9016;
    font-weight: 600;
  }
`;

const FeatureBlock = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(35, 35, 35, 0.5);
  border-radius: 6px;
  border: 1px solid #444;
`;

const FeatureName = styled.h4`
  color: #ce9016;
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  font-family: 'Cinzel', serif;
`;

const FeatureDescription = styled.div`
  font-size: 0.85rem;
  line-height: 1.5;
  color: #c4b49d;
  font-family: 'Crimson Text', serif;

  p {
    margin-bottom: 0.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: #ce9016;
    font-weight: 600;
  }
`;

const QuickRefTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  background: rgba(35, 35, 35, 0.5);
  border-radius: 6px;
  overflow: hidden;

  th {
    background: rgba(35, 35, 35, 0.9);
    color: #ce9016;
    padding: 0.5rem;
    text-align: left;
    font-weight: 700;
    font-family: 'Cinzel', serif;
    border: 1px solid #444;
    font-size: 0.75rem;
  }

  td {
    padding: 0.5rem;
    border: 1px solid #444;
    color: #f4e7d1;
    vertical-align: top;
    font-size: 0.8rem;
  }

  tr:nth-child(even) td {
    background: rgba(45, 45, 45, 0.3);
  }
`;

const TableHeader = styled.h3`
  color: #ce9016;
  font-size: 1rem;
  margin: 1rem 0 0.5rem 0;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ClassModal: React.FC<ClassModalProps> = ({
  characterClass,
  isOpen,
  onClose,
}) => {
  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen || !characterClass) return null;

  // Helper functions
  const formatPrimaryAbilities = (abilities: string[]): string => {
    if (!abilities || abilities.length === 0) return 'None';
    return abilities.join(' or ');
  };

  const formatSavingThrows = (saves: string[]): string => {
    if (!saves || saves.length === 0) return 'None';
    return saves.join(', ');
  };

  const formatProficiencies = (prof: any): string => {
    if (!prof) return 'None';

    // Clean up template strings and filter syntax
    const cleanText = (text: string): string => {
      return (
        text
          // Remove {@item ItemName|XPHB} syntax and keep just ItemName
          .replace(/\{@item ([^|]+)\|[^}]+\}/g, '$1')
          // Remove {@filter FilterName|...} syntax and keep just FilterName
          .replace(/\{@filter ([^|]+)\|[^}]+\}/g, '$1')
          // Clean up other template syntax
          .replace(/\{@[^}]+\}/g, '')
          // Clean up extra spaces
          .replace(/\s+/g, ' ')
          .trim()
      );
    };

    if (typeof prof === 'string') {
      return cleanText(prof);
    }

    if (Array.isArray(prof)) {
      // Handle array of proficiencies with choice objects
      return prof
        .map((item) => {
          if (typeof item === 'string') {
            return cleanText(item);
          }
          if (typeof item === 'object' && item.choose) {
            const count = item.choose.count || item.choose;
            const from = item.choose.from || [];
            return `Choose ${count} from: ${
              Array.isArray(from) ? from.join(', ') : from
            }`;
          }
          return JSON.stringify(item);
        })
        .join('; ');
    }

    // Handle object-based proficiencies
    if (typeof prof === 'object') {
      // For skills that might be objects with choices
      if (prof.choose && prof.from) {
        return `Choose ${prof.choose} from: ${
          Array.isArray(prof.from) ? prof.from.join(', ') : prof.from
        }`;
      }

      // For other object types, try to extract meaningful info
      const entries = Object.entries(prof);
      if (entries.length > 0) {
        return entries
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${cleanText(String(value))}`;
          })
          .join('; ');
      }
    }

    return 'See class details';
  };

  const getClassFeatures = () => {
    if (!characterClass.classFeatures) return [];
    if (typeof characterClass.classFeatures === 'object') {
      return Object.entries(characterClass.classFeatures)
        .map(([level, features]) => ({
          level: parseInt(level),
          features,
        }))
        .sort((a, b) => a.level - b.level);
    }
    return [];
  };

  const getProficiencyBonus = (level: number): string => {
    if (level >= 17) return '+6';
    if (level >= 13) return '+5';
    if (level >= 9) return '+4';
    if (level >= 5) return '+3';
    return '+2';
  };

  const getFeaturesForLevel = (level: number): string => {
    const classFeatures = getClassFeatures();
    const levelFeatures = classFeatures.find((f) => f.level === level);

    if (!levelFeatures || !levelFeatures.features) {
      return '—';
    }

    if (Array.isArray(levelFeatures.features)) {
      return levelFeatures.features
        .map((feature: any) =>
          typeof feature === 'string'
            ? feature
            : feature.name || feature.title || 'Unknown Feature'
        )
        .join(', ');
    } else if (typeof levelFeatures.features === 'object') {
      return Object.keys(levelFeatures.features).join(', ');
    } else if (typeof levelFeatures.features === 'string') {
      return levelFeatures.features;
    }

    return '—';
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderContent>
            <ClassTitle>{characterClass.name}</ClassTitle>
          </HeaderContent>
          <CloseButton onClick={onClose} type="button" aria-label="Close modal">
            ×
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* Class Meta Information */}
          <ClassMeta>
            <MetaItem>
              <h4>Hit Die</h4>
              <p>d{characterClass.hitDie}</p>
            </MetaItem>

            <MetaItem>
              <h4>Primary Abilities</h4>
              <p>{formatPrimaryAbilities(characterClass.primaryAbility)}</p>
            </MetaItem>

            <MetaItem>
              <h4>Saving Throws</h4>
              <p>
                {formatSavingThrows(characterClass.savingThrowProficiencies)}
              </p>
            </MetaItem>

            {characterClass.spellcastingAbility && (
              <MetaItem>
                <h4>Spellcasting</h4>
                <p>{characterClass.spellcastingAbility} based</p>
              </MetaItem>
            )}

            {characterClass.source && (
              <MetaItem>
                <h4>Source</h4>
                <p>
                  {characterClass.source}
                  {characterClass.page ? `, pg. ${characterClass.page}` : ''}
                </p>
              </MetaItem>
            )}
          </ClassMeta>

          {/* Level Progression Table */}
          <TableHeader>Level Progression</TableHeader>
          <QuickRefTable>
            <thead>
              <tr>
                <th>Level</th>
                <th>Prof. Bonus</th>
                <th>Features</th>
                <th>Hit Points</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }, (_, i) => {
                const level = i + 1;
                const hitPoints =
                  level === 1
                    ? `${characterClass.hitDie} + Con`
                    : `+${Math.floor(characterClass.hitDie / 2) + 1} (or ${characterClass.hitDie}) + Con`;

                return (
                  <tr key={level}>
                    <td>{level}</td>
                    <td>{getProficiencyBonus(level)}</td>
                    <td>{getFeaturesForLevel(level)}</td>
                    <td>{hitPoints}</td>
                  </tr>
                );
              })}
            </tbody>
          </QuickRefTable>

          {/* Proficiencies */}
          <Section>
            <h3>Proficiencies</h3>
            <FeaturesList>
              {characterClass.armorProficiencies && (
                <FeatureItem>
                  <strong>Armor:</strong>{' '}
                  {formatProficiencies(characterClass.armorProficiencies)}
                </FeatureItem>
              )}
              {characterClass.weaponProficiencies && (
                <FeatureItem>
                  <strong>Weapons:</strong>{' '}
                  {formatProficiencies(characterClass.weaponProficiencies)}
                </FeatureItem>
              )}
              {characterClass.toolProficiencies && (
                <FeatureItem>
                  <strong>Tools:</strong>{' '}
                  {formatProficiencies(characterClass.toolProficiencies)}
                </FeatureItem>
              )}
              {characterClass.skillProficiencies && (
                <FeatureItem>
                  <strong>Skills:</strong>{' '}
                  {formatProficiencies(characterClass.skillProficiencies)}
                </FeatureItem>
              )}
            </FeaturesList>
          </Section>

          {/* Detailed Class Features */}
          {getClassFeatures().length > 0 && (
            <Section>
              <h3>Class Features</h3>
              {getClassFeatures().map(({ level, features }) => {
                if (!Array.isArray(features)) return null;

                return features.map((feature: any, index: number) => {
                  if (typeof feature === 'object' && feature.name) {
                    return (
                      <FeatureBlock key={`${level}-${index}`}>
                        <FeatureName>
                          Level {level} - {feature.name}
                        </FeatureName>
                        <FeatureDescription>
                          {feature.entries && Array.isArray(feature.entries) ? (
                            feature.entries.map((entry: any, i: number) => {
                              if (typeof entry === 'string') {
                                const cleanedEntry = parseDnDTemplateTag(entry);
                                if (cleanedEntry.trim()) {
                                  return (
                                    <p
                                      key={i}
                                      dangerouslySetInnerHTML={{
                                        __html: cleanedEntry,
                                      }}
                                    />
                                  );
                                }
                              }
                              return null;
                            })
                          ) : (
                            <p>See {characterClass.source} for details.</p>
                          )}
                        </FeatureDescription>
                      </FeatureBlock>
                    );
                  }
                  return null;
                });
              })}
            </Section>
          )}

          {/* Spellcasting Information */}
          {characterClass.spellcastingAbility && (
            <Section>
              <h3>Spellcasting</h3>
              <FeaturesList>
                <FeatureItem>
                  <strong>Ability:</strong> {characterClass.spellcastingAbility}
                </FeatureItem>
                {characterClass.spellcastingFocus && (
                  <FeatureItem>
                    <strong>Focus:</strong> {characterClass.spellcastingFocus}
                  </FeatureItem>
                )}
                <FeatureItem>
                  <strong>Spell Save DC:</strong> 8 + proficiency bonus + {characterClass.spellcastingAbility} modifier
                </FeatureItem>
                <FeatureItem>
                  <strong>Spell Attack:</strong> proficiency bonus + {characterClass.spellcastingAbility} modifier
                </FeatureItem>
              </FeaturesList>
            </Section>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ClassModal;
