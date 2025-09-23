import React from 'react';
import styled from 'styled-components';
import { CharacterClass } from '../types/api';

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
  background-color: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 0 24px 24px 24px;
`;

const ClassTitle = styled.h2`
  margin: 0 0 8px 0;
  color: #8b5a2b;
  font-family: 'Cinzel', serif;
  font-size: 28px;
  font-weight: 600;
`;

const ClassMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const MetaItem = styled.div`
  h4 {
    color: #333;
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin: 0;
    color: #333;
    font-weight: 500;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;

  h3 {
    color: #8b5a2b;
    font-size: 18px;
    margin: 0 0 12px 0;
    font-family: 'Cinzel', serif;
  }
`;

const FeaturesList = styled.div`
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
`;

const FeatureItem = styled.div`
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: #8b5a2b;
    font-weight: 600;
  }
`;

const SubclassList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
`;

const SubclassItem = styled.div`
  background-color: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #8b5a2b;

  h4 {
    margin: 0 0 4px 0;
    color: #8b5a2b;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #666;
    font-size: 12px;
  }
`;

const ClassModal: React.FC<ClassModalProps> = ({
  characterClass,
  isOpen,
  onClose,
}) => {
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

  const formatClassFeatures = (features: any): string => {
    if (!features) return '';

    if (typeof features === 'string') return features;
    if (typeof features === 'number') return features.toString();

    if (Array.isArray(features)) {
      // Handle array of feature objects
      return features
        .map((feature) => {
          if (typeof feature === 'object' && feature.name) {
            return feature.name;
          }
          if (typeof feature === 'string') {
            return feature;
          }
          return 'Feature';
        })
        .join(', ');
    }

    if (typeof features === 'object') {
      // Try to extract feature names from object keys or values
      const entries = Object.entries(features);
      return entries
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // If value is an object, use the key as the feature name
            return key;
          }
          return `${key}: ${value}`;
        })
        .join(', ');
    }

    return 'Class Feature';
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

  const getSubclasses = () => {
    // Use subclassFeatures instead of subclasses
    if (!characterClass.subclassFeatures) return [];
    if (
      typeof characterClass.subclassFeatures === 'object' &&
      characterClass.subclassFeatures !== null
    ) {
      return Object.entries(characterClass.subclassFeatures).map(
        ([name, details]: [string, any]) => ({
          name,
          details,
        })
      );
    }
    return [];
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>

        <ModalHeader>
          <ClassTitle>{characterClass.name}</ClassTitle>
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

          {/* Class Features */}
          {getClassFeatures().length > 0 && (
            <Section>
              <h3>Class Features by Level</h3>
              <FeaturesList>
                {getClassFeatures().map(({ level, features }) => (
                  <FeatureItem key={level}>
                    <strong>Level {level}:</strong>{' '}
                    {formatClassFeatures(features)}
                  </FeatureItem>
                ))}
              </FeaturesList>
            </Section>
          )}

          {/* Subclasses */}
          {getSubclasses().length > 0 && (
            <Section>
              <h3>Subclasses ({getSubclasses().length})</h3>
              <SubclassList>
                {getSubclasses().map(({ name, details }) => (
                  <SubclassItem key={name}>
                    <h4>{name}</h4>
                    <p>
                      {details?.shortName && `${details.shortName} • `}
                      {details?.source || 'Official'}
                    </p>
                  </SubclassItem>
                ))}
              </SubclassList>
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
              </FeaturesList>
            </Section>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ClassModal;
