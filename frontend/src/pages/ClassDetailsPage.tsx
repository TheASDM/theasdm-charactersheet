import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { CharacterClass, Spell } from '../types/api';
import { classService, spellService } from '../services';
import SpellCard from '../components/SpellCard';
import SpellModal from '../components/SpellModal';

// Styled components for D&D reference-style layout
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f4f1e8 0%, #e8dcc0 100%);
  font-family: 'Georgia', serif;
`;

const ContentContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  min-height: 100vh;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
  color: white;
  padding: 20px;
  text-align: center;
  border-bottom: 3px solid #654321;
`;

const HeaderTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  letter-spacing: 2px;
`;

const ClassTitle = styled.h1`
  font-family: 'Cinzel', serif;
  font-size: 2.8rem;
  font-weight: 700;
  margin: 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Navigation = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
`;

const NavButton = styled(Link)`
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    color: white;
  }
`;

const BackButton = styled(Link)`
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
`;

const Content = styled.div`
  padding: 24px 32px;
  line-height: 1.6;
  color: #333;
`;

const ClassDescription = styled.div`
  font-style: italic;
  background: #f9f7f1;
  padding: 16px;
  border-left: 4px solid #8b4513;
  margin-bottom: 24px;
  font-size: 16px;
`;

const QuickReference = styled.div`
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 24px;
  font-size: 14px;
`;

const QuickRefTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    background: #8b4513;
    color: white;
    padding: 8px 12px;
    text-align: left;
    font-weight: bold;
  }

  td {
    padding: 6px 12px;
    border-bottom: 1px solid #ddd;
  }

  tr:nth-child(even) td {
    background: #f9f9f9;
  }
`;

const SectionHeader = styled.h2`
  color: #8b4513;
  font-family: 'Cinzel', serif;
  font-size: 1.6rem;
  margin: 32px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #8b4513;
`;

const SubHeader = styled.h3`
  color: #654321;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  margin: 24px 0 12px 0;
  font-weight: 600;
`;

const FeatureBlock = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-left: 3px solid #8b4513;
`;

const FeatureName = styled.h4`
  color: #8b4513;
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 8px 0;
`;

const FeatureDescription = styled.div`
  font-size: 14px;
  line-height: 1.5;
`;

const ProficiencyList = styled.ul`
  margin: 8px 0 16px 20px;

  li {
    margin-bottom: 4px;
  }
`;

const EquipmentSection = styled.div`
  background: #f9f7f1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  margin: 16px 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #666;
  font-size: 1.1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #f44336;
  text-align: center;

  button {
    margin-top: 12px;
    background: #2196f3;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
`;

const TabContainer = styled.div`
  border-bottom: 2px solid #ddd;
  margin: 24px 0 16px 0;
`;

const TabButton = styled.button<{ active: boolean }>`
  background: ${(props) => (props.active ? '#8b4513' : 'transparent')};
  color: ${(props) => (props.active ? 'white' : '#8b4513')};
  border: none;
  padding: 12px 20px;
  margin-right: 8px;
  border-radius: 8px 8px 0 0;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: ${(props) =>
    props.active ? '2px solid #8b4513' : '2px solid transparent'};

  &:hover {
    background: ${(props) =>
      props.active ? '#8b4513' : 'rgba(139, 69, 19, 0.1)'};
  }
`;

// Enhanced ClassDetailsPage with tabs
const ClassDetailsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [characterClass, setCharacterClass] = useState<CharacterClass | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'subclasses' | 'spells'
  >('overview');
  // Add spells state
  const [spells, setSpells] = useState<Spell[]>([]);
  const [spellsLoading, setSpellsLoading] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  // Load spells when spells tab is active for spellcasting classes
  useEffect(() => {
    if (characterClass?.spellcastingAbility && activeTab === 'spells') {
      loadSpells();
    }
  }, [characterClass, activeTab]);

  const loadClassData = async () => {
    if (!classId) {
      setError('Class ID not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await classService.getById(parseInt(classId));

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setCharacterClass(response.data);
      } else {
        setError('Class not found');
      }
    } catch (err) {
      setError('Failed to load class data');
      console.error('Error loading class:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load spells for the current class
  const loadSpells = async () => {
    if (!characterClass?.name) return;

    setSpellsLoading(true);
    try {
      const response = await spellService.getByClass(characterClass.name);
      if (response.data && response.data.spells) {
        setSpells(response.data.spells);
      } else if (response.data && response.data.items) {
        setSpells(response.data.items);
      }
    } catch (err) {
      console.error('Error loading spells:', err);
    } finally {
      setSpellsLoading(false);
    }
  };

  // Organize spells by level
  const organizeSpellsByLevel = () => {
    const spellsByLevel: { [level: number]: Spell[] } = {};
    spells.forEach((spell) => {
      const level = spell.level;
      if (!spellsByLevel[level]) {
        spellsByLevel[level] = [];
      }
      spellsByLevel[level].push(spell);
    });

    // Sort spells within each level alphabetically
    Object.keys(spellsByLevel).forEach((level) => {
      spellsByLevel[parseInt(level)].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });

    return spellsByLevel;
  };

  // Helper functions
  const formatProficiencies = (prof: any): string => {
    if (!prof) return 'None';

    const cleanText = (text: string): string => {
      return text
        .replace(/\{@item ([^|]+)\|[^}]+\}/g, '$1')
        .replace(/\{@filter ([^|]+)\|[^}]+\}/g, '$1')
        .replace(/\{@[^}]+\}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
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

  const getSubclasses = () => {
    if (!characterClass?.subclassFeatures) return [];
    if (
      typeof characterClass.subclassFeatures === 'object' &&
      characterClass.subclassFeatures !== null
    ) {
      return Object.entries(characterClass.subclassFeatures).map(
        ([name, details]: [string, any]) => {
          // Parse level features if they exist
          const levelFeatures: { [level: string]: any[] } = {};

          if (details && typeof details === 'object' && details.features) {
            Object.entries(details.features).forEach(([level, features]) => {
              levelFeatures[level] = Array.isArray(features)
                ? features
                : [features];
            });
          }

          return {
            name,
            details,
            levelFeatures,
            source: details?.source || "Player's Handbook",
            page: details?.page || null,
          };
        }
      );
    }
    return [];
  };

  const getClassDescription = () => {
    // This would ideally come from the API data, but for now we'll use a generic description
    const descriptions: { [key: string]: string } = {
      Barbarian:
        'Fierce warriors who harness primal rage in battle, drawing strength from the wild places of the world.',
      Bard: 'Masters of song, speech, and the magic they contain, weaving spells through music and inspiring allies.',
      Cleric:
        'Priestly champions who wield divine magic in service of higher powers and their sacred duties.',
      Druid:
        'Priests of nature, wielding elemental forces and able to transform into the beasts they protect.',
      Fighter:
        'Masters of martial combat skilled with a variety of weapons and armor, tactical and versatile.',
      Monk: 'Students of martial arts, harnessing inner power and achieving perfection through discipline.',
      Paladin:
        'Holy warriors bound by sacred oaths, blending martial prowess with divine magic.',
      Ranger:
        'Warriors of the wilderness, skilled in tracking, survival, and combat against favored enemies.',
      Rogue:
        'Scoundrels who use stealth and trickery to overcome obstacles and enemies, masters of skill.',
      Sorcerer:
        'Spellcasters who draw on inherent magic from a draconic bloodline or other exotic source.',
      Warlock:
        'Seekers of power who make pacts with extraplanar beings to unlock magical potential.',
      Wizard:
        'Students of arcane magic, mastering spells through study and preparation from spellbooks.',
    };

    return (
      descriptions[characterClass?.name || ''] ||
      'A versatile adventurer with unique abilities and training.'
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>Loading class details...</LoadingContainer>
      </PageContainer>
    );
  }

  if (error || !characterClass) {
    return (
      <PageContainer>
        <ErrorContainer>
          <div>Error: {error || 'Class not found'}</div>
          <button onClick={loadClassData}>Retry</button>
        </ErrorContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <HeaderTitle>D&D 5th Edition</HeaderTitle>
          <ClassTitle>{characterClass.name}</ClassTitle>
          <Navigation>
            <BackButton to="/classes">← Back to Classes</BackButton>
            <NavButton to={`/classes/${classId}/levels`}>
              📊 Levels Table
            </NavButton>
          </Navigation>
        </Header>

        <Content>
          <ClassDescription>{getClassDescription()}</ClassDescription>

          {/* Tabbed Navigation */}
          <TabContainer>
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            >
              📖 Overview
            </TabButton>
            {getSubclasses().length > 0 && (
              <TabButton
                active={activeTab === 'subclasses'}
                onClick={() => setActiveTab('subclasses')}
              >
                ⚔️ Subclasses ({getSubclasses().length})
              </TabButton>
            )}
            {characterClass.spellcastingAbility && (
              <TabButton
                active={activeTab === 'spells'}
                onClick={() => setActiveTab('spells')}
              >
                🪄 Spells
              </TabButton>
            )}
          </TabContainer>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Quick Reference Table */}
              <QuickReference>
                <QuickRefTable>
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Proficiency Bonus</th>
                      <th>Features</th>
                      <th>Hit Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1st</td>
                      <td>+2</td>
                      <td>See Class Features</td>
                      <td>{characterClass.hitDie} + Con modifier</td>
                    </tr>
                    <tr>
                      <td>2nd</td>
                      <td>+2</td>
                      <td>See Class Features</td>
                      <td>
                        +{Math.floor(characterClass.hitDie / 2) + 1} (or{' '}
                        {characterClass.hitDie}) + Con modifier
                      </td>
                    </tr>
                    <tr>
                      <td>3rd</td>
                      <td>+2</td>
                      <td>See Class Features</td>
                      <td>
                        +{Math.floor(characterClass.hitDie / 2) + 1} (or{' '}
                        {characterClass.hitDie}) + Con modifier
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          textAlign: 'center',
                          fontStyle: 'italic',
                          color: '#666',
                        }}
                      >
                        ... continues through 20th level
                      </td>
                    </tr>
                  </tbody>
                </QuickRefTable>
              </QuickReference>

              {/* Class Features */}
              <SectionHeader>Class Features</SectionHeader>
              <p>
                As a {characterClass.name.toLowerCase()}, you gain the following
                class features.
              </p>

              <SubHeader>Hit Points</SubHeader>
              <p>
                <strong>Hit Dice:</strong> 1d{characterClass.hitDie} per{' '}
                {characterClass.name.toLowerCase()} level
              </p>
              <p>
                <strong>Hit Points at 1st Level:</strong>{' '}
                {characterClass.hitDie} + your Constitution modifier
              </p>
              <p>
                <strong>Hit Points at Higher Levels:</strong> 1d
                {characterClass.hitDie} (or{' '}
                {Math.floor(characterClass.hitDie / 2) + 1}) + your Constitution
                modifier per {characterClass.name.toLowerCase()} level after 1st
              </p>

              <SubHeader>Proficiencies</SubHeader>
              <ProficiencyList>
                {characterClass.armorProficiencies && (
                  <li>
                    <strong>Armor:</strong>{' '}
                    {formatProficiencies(characterClass.armorProficiencies)}
                  </li>
                )}
                {characterClass.weaponProficiencies && (
                  <li>
                    <strong>Weapons:</strong>{' '}
                    {formatProficiencies(characterClass.weaponProficiencies)}
                  </li>
                )}
                {characterClass.toolProficiencies && (
                  <li>
                    <strong>Tools:</strong>{' '}
                    {formatProficiencies(characterClass.toolProficiencies)}
                  </li>
                )}
                <li>
                  <strong>Saving Throws:</strong>{' '}
                  {characterClass.savingThrowProficiencies.join(', ')}
                </li>
                {characterClass.skillProficiencies && (
                  <li>
                    <strong>Skills:</strong>{' '}
                    {formatProficiencies(characterClass.skillProficiencies)}
                  </li>
                )}
              </ProficiencyList>

              <SubHeader>Equipment</SubHeader>
              <EquipmentSection>
                <p>
                  You start with the following equipment, in addition to the
                  equipment granted by your background:
                </p>
                <ul>
                  <li>
                    Starting equipment varies by class - see{' '}
                    {characterClass.source} pg. {characterClass.page}
                  </li>
                  <li>
                    Alternatively, you can buy your starting equipment with
                    starting wealth
                  </li>
                </ul>
              </EquipmentSection>

              {/* Individual Class Features */}
              {getClassFeatures()
                .slice(0, 3)
                .map(({ level, features }) => {
                  if (!Array.isArray(features)) return null;

                  return features.map((feature: any, index: number) => {
                    if (typeof feature === 'object' && feature.name) {
                      return (
                        <FeatureBlock key={`${level}-${index}`}>
                          <FeatureName>{feature.name}</FeatureName>
                          <FeatureDescription>
                            {feature.entries &&
                            Array.isArray(feature.entries) ? (
                              feature.entries
                                .slice(0, 2)
                                .map((entry: any, i: number) => (
                                  <p key={i}>
                                    {typeof entry === 'string'
                                      ? entry
                                          .replace(/\{@[^}]+\}/g, '')
                                          .substring(0, 200) + '...'
                                      : 'See class description for full details.'}
                                  </p>
                                ))
                            ) : (
                              <p>
                                Advanced class feature - see{' '}
                                {characterClass.source} for full details.
                              </p>
                            )}
                          </FeatureDescription>
                        </FeatureBlock>
                      );
                    }
                    return null;
                  });
                })}

              {/* Spellcasting */}
              {characterClass.spellcastingAbility && (
                <>
                  <SectionHeader>Spellcasting</SectionHeader>
                  <FeatureBlock>
                    <FeatureName>Spellcasting</FeatureName>
                    <FeatureDescription>
                      <p>
                        You are a spellcaster. Your spellcasting ability is{' '}
                        <strong>{characterClass.spellcastingAbility}</strong>{' '}
                        (spell save DC = 8 + your proficiency bonus + your{' '}
                        {characterClass.spellcastingAbility} modifier).
                      </p>
                      {characterClass.spellcastingFocus && (
                        <p>
                          <strong>Spellcasting Focus:</strong>{' '}
                          {characterClass.spellcastingFocus}
                        </p>
                      )}
                    </FeatureDescription>
                  </FeatureBlock>
                </>
              )}

              {/* Subclasses */}
              {getSubclasses().length > 0 && (
                <>
                  <SectionHeader>Subclasses</SectionHeader>
                  <p>
                    At a certain level, you choose a subclass that grants you
                    features at certain levels. The available subclasses are:
                  </p>
                  {getSubclasses()
                    .slice(0, 4)
                    .map(({ name, details }) => (
                      <FeatureBlock key={name}>
                        <FeatureName>{name}</FeatureName>
                        <FeatureDescription>
                          <p>
                            Source: {details?.source || 'Official'} • See full
                            details in the source material
                          </p>
                        </FeatureDescription>
                      </FeatureBlock>
                    ))}
                  {getSubclasses().length > 4 && (
                    <p>
                      <em>
                        ... and {getSubclasses().length - 4} more subclasses
                      </em>
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {/* Enhanced Subclasses Tab */}
          {(activeTab as string) === 'subclasses' && (
            <div>
              <SectionHeader>
                All {characterClass.name} Subclasses
              </SectionHeader>
              <p>
                At{' '}
                {characterClass.name === 'Cleric' ||
                characterClass.name === 'Sorcerer' ||
                characterClass.name === 'Warlock'
                  ? '1st'
                  : '3rd'}{' '}
                level, you choose a subclass that grants you special features at
                certain levels.
              </p>

              {getSubclasses().length > 0 ? (
                getSubclasses().map(({ name, details, levelFeatures }) => (
                  <FeatureBlock key={name} style={{ marginBottom: '32px' }}>
                    <FeatureName
                      style={{ fontSize: '20px', marginBottom: '12px' }}
                    >
                      {name}
                    </FeatureName>
                    <FeatureDescription>
                      <p>
                        <strong>Source:</strong>{' '}
                        {details?.source || "Player's Handbook"}{' '}
                        {details?.page && `• Page ${details.page}`}
                      </p>

                      {/* Show features by level */}
                      {Object.keys(levelFeatures).length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <strong>Subclass Features:</strong>
                          <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                            {Object.entries(levelFeatures)
                              .sort(([a], [b]) => parseInt(a) - parseInt(b))
                              .map(([level, features]: [string, any[]]) => (
                                <div
                                  key={level}
                                  style={{ marginBottom: '12px' }}
                                >
                                  <strong style={{ color: '#8b4513' }}>
                                    Level {level}:
                                  </strong>
                                  <ul style={{ margin: '4px 0 0 20px' }}>
                                    {features.map((feature, idx) => (
                                      <li
                                        key={idx}
                                        style={{ marginBottom: '4px' }}
                                      >
                                        {typeof feature === 'object' &&
                                        feature.name
                                          ? feature.name
                                          : typeof feature === 'string'
                                          ? feature
                                          : 'Special feature'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {Object.keys(levelFeatures).length === 0 && (
                        <p
                          style={{
                            marginTop: '8px',
                            fontStyle: 'italic',
                            color: '#666',
                          }}
                        >
                          Detailed subclass features available in{' '}
                          {details?.source || 'source material'}.
                        </p>
                      )}
                    </FeatureDescription>
                  </FeatureBlock>
                ))
              ) : (
                <p>No subclasses available for this class.</p>
              )}
            </div>
          )}

          {/* Enhanced Spells Tab */}
          {(activeTab as string) === 'spells' &&
            characterClass.spellcastingAbility && (
              <div>
                <SectionHeader>{characterClass.name} Spell List</SectionHeader>
                <FeatureBlock style={{ marginBottom: '24px' }}>
                  <FeatureName>
                    Spellcasting Ability: {characterClass.spellcastingAbility}
                  </FeatureName>
                  <FeatureDescription>
                    <p>
                      <strong>Spell save DC</strong> = 8 + your proficiency
                      bonus + your {characterClass.spellcastingAbility} modifier
                    </p>
                    <p>
                      <strong>Spell attack modifier</strong> = your proficiency
                      bonus + your {characterClass.spellcastingAbility} modifier
                    </p>
                    {characterClass.spellcastingFocus && (
                      <p>
                        <strong>Spellcasting Focus:</strong>{' '}
                        {characterClass.spellcastingFocus}
                      </p>
                    )}
                  </FeatureDescription>
                </FeatureBlock>

                {spellsLoading ? (
                  <LoadingContainer style={{ minHeight: '200px' }}>
                    Loading {characterClass.name} spells...
                  </LoadingContainer>
                ) : spells.length > 0 ? (
                  <div>
                    <p style={{ marginBottom: '24px' }}>
                      <strong>Total Spells Available:</strong> {spells.length}
                    </p>

                    {Object.entries(organizeSpellsByLevel())
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([level, levelSpells]) => (
                        <div key={level} style={{ marginBottom: '32px' }}>
                          <SubHeader>
                            {level === '0'
                              ? 'Cantrips'
                              : `${level}${
                                  level === '1'
                                    ? 'st'
                                    : level === '2'
                                    ? 'nd'
                                    : level === '3'
                                    ? 'rd'
                                    : 'th'
                                } Level`}
                            <span
                              style={{
                                fontWeight: 'normal',
                                fontSize: '14px',
                                color: '#666',
                              }}
                            >
                              {' '}
                              ({levelSpells.length} spells)
                            </span>
                          </SubHeader>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(auto-fill, minmax(280px, 1fr))',
                              gap: '12px',
                              marginTop: '12px',
                            }}
                          >
                            {levelSpells.map((spell) => (
                              <SpellCard
                                key={spell.id}
                                spell={spell}
                                onClick={() => setSelectedSpell(spell)}
                                compact={true}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <FeatureBlock>
                    <FeatureName>No Spells Found</FeatureName>
                    <FeatureDescription>
                      <p>
                        No spells are currently available for the{' '}
                        {characterClass.name} class in the database. This may be
                        due to data still being imported.
                      </p>
                    </FeatureDescription>
                  </FeatureBlock>
                )}
              </div>
            )}
        </Content>
      </ContentContainer>

      {/* Spell Modal */}
      {selectedSpell && (
        <SpellModal
          spell={selectedSpell}
          isOpen={!!selectedSpell}
          onClose={() => setSelectedSpell(null)}
        />
      )}
    </PageContainer>
  );
};

export default ClassDetailsPage;
