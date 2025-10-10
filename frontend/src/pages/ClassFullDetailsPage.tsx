import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { CharacterClass, isError } from '../types/api';
import { classService } from '../services';
import { parseDnDTemplateTag } from '../utils/dndTemplateParser';
import { logger } from '../utils/logger';

// Main page container matching Classes page
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

// Header section
const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-family: 'Cinzel', serif;
    font-size: 3rem;
    color: #ce9016;
    margin-bottom: 0.5rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
`;

const BackButton = styled(Link)`
  display: inline-block;
  background: rgba(206, 144, 22, 0.2);
  color: #ce9016;
  border: 2px solid #ce9016;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-family: 'Cinzel', serif;
  margin-bottom: 2rem;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    background: rgba(206, 144, 22, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(206, 144, 22, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Main container
const MainContainer = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 3rem;
  backdrop-filter: blur(10px);
`;

const ClassMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const MetaItem = styled.div`
  background: rgba(35, 35, 35, 0.5);
  padding: 1.25rem;
  border-radius: 6px;
  border-left: 3px solid #ce9016;

  h4 {
    color: #ce9016;
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin: 0;
    color: #f0f0f0;
    font-weight: 500;
    font-size: 1.1rem;
  }
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
  background: rgba(35, 35, 35, 0.3);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #444;

  h3 {
    color: #ce9016;
    font-size: 1.1rem;
    margin: 0 0 1rem 0;
    font-family: 'Cinzel', serif;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const FeaturesList = styled.div`
  background: rgba(35, 35, 35, 0.5);
  border-radius: 8px;
  padding: 1rem;
`;

const FeatureItem = styled.div`
  margin-bottom: 0.75rem;
  color: #f0f0f0;
  line-height: 1.6;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: #ce9016;
    font-weight: 600;
  }
`;

const QuickRefTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  background: rgba(35, 35, 35, 0.5);
  border-radius: 8px;
  overflow: hidden;

  th {
    background: rgba(35, 35, 35, 0.9);
    color: #ce9016;
    padding: 0.75rem;
    text-align: left;
    font-weight: 700;
    font-family: 'Cinzel', serif;
    border: 1px solid #444;
    font-size: 0.9rem;
  }

  td {
    padding: 0.75rem;
    border: 1px solid #444;
    color: #f0f0f0;
    vertical-align: top;
    font-size: 0.85rem;
  }

  tr:nth-child(even) td {
    background: rgba(45, 45, 45, 0.3);
  }
`;

const TableHeader = styled.h3`
  color: #ce9016;
  font-size: 1.3rem;
  margin: 1.5rem 0 0.5rem 0;
  font-family: 'Cinzel', serif;
`;

const FeatureBlock = styled.div`
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: rgba(35, 35, 35, 0.5);
  border-radius: 8px;
  border: 1px solid #444;
`;

const FeatureName = styled.h4`
  color: #ce9016;
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  font-family: 'Cinzel', serif;
`;

const FeatureDescription = styled.div`
  font-size: 0.9rem;
  line-height: 1.6;
  color: #f0f0f0;

  p {
    margin-bottom: 0.75rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: #ce9016;
    font-weight: 600;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #ce9016;
  font-size: 1.4rem;
  font-weight: 600;
  font-family: 'Cinzel', serif;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #ff6b6b;
  text-align: center;
  font-family: 'Cinzel', serif;

  .error-title {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .error-message {
    color: #ccc;
    margin-bottom: 1rem;
  }
`;

const ClassFullDetailsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [characterClass, setCharacterClass] = useState<CharacterClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    if (!classId) {
      setError('Class ID not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await classService.getClassById(classId);

      if (isError(response)) {
        setError(response.error ?? 'Class not found');
      } else {
        setCharacterClass(response.data);
      }
    } catch (err) {
      setError('Failed to load class data from the ancient tomes.');
      logger.error('Error loading class:', err);
    } finally {
      setLoading(false);
    }
  };

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

    const cleanText = (text: string): string => {
      return (
        text
          .replace(/\{@item ([^|]+)\|[^}]+\}/g, '$1')
          .replace(/\{@filter ([^|]+)\|[^}]+\}/g, '$1')
          .replace(/\{@[^}]+\}/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      );
    };

    if (typeof prof === 'string') {
      return cleanText(prof);
    }

    if (Array.isArray(prof)) {
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

    if (typeof prof === 'object') {
      if (prof.choose && prof.from) {
        return `Choose ${prof.choose} from: ${
          Array.isArray(prof.from) ? prof.from.join(', ') : prof.from
        }`;
      }

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
    if (!characterClass?.classFeatures) return [];
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

  if (loading) {
    return (
      <PageContainer>
        <ContentContainer>
          <MainContainer>
            <LoadingContainer>Loading class details...</LoadingContainer>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error || !characterClass) {
    return (
      <PageContainer>
        <ContentContainer>
          <MainContainer>
            <ErrorContainer>
              <div className="error-title">Error Loading Class</div>
              <div className="error-message">{error || 'Class not found'}</div>
            </ErrorContainer>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <h1>{characterClass.name}</h1>
        </Header>

        <BackButton to="/classes">← Back to Classes</BackButton>

        <MainContainer>
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
              <p>{formatSavingThrows(characterClass.savingThrowProficiencies)}</p>
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
                  <strong>Spell Save DC:</strong> 8 + proficiency bonus +{' '}
                  {characterClass.spellcastingAbility} modifier
                </FeatureItem>
                <FeatureItem>
                  <strong>Spell Attack:</strong> proficiency bonus +{' '}
                  {characterClass.spellcastingAbility} modifier
                </FeatureItem>
              </FeaturesList>
            </Section>
          )}
        </MainContainer>
      </ContentContainer>
    </PageContainer>
  );
};

export default ClassFullDetailsPage;