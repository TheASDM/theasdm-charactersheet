import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { CharacterClass, Spell } from '../types/api';
import { classService, spellService } from '../services';
import SpellCard from '../components/SpellCard';
import SpellModal from '../components/SpellModal';

// Styled components for D&D reference-style layout
const PageContainer = styled.div`
  min-height: 50vh;
  background: linear-gradient(135deg, #f4f1e8 0%, #e8dcc0 100%);
  font-family: 'Georgia', serif;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  min-height: 50vh;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
  color: white;
  padding: 20px;
  text-align: center;
  border-bottom: 3px solid #654321;
`;

const HeaderTitle = styled.h4`
  color: #000000ff;
  text-align: center;
  font-size: 1rem;
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
  line-height: 1.6;

  p {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  ul,
  ol {
    margin: 8px 0 12px 20px;
  }
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

  // Universal D&D template tag parser
  const parseTemplateTag = (text: string): string => {
    return text.replace(/\{@([^}]+)\}/g, (_match, content) => {
      // Split on first space to get tag type and content
      const parts = content.split(' ');
      const tagType = parts[0];
      const tagContent = parts.slice(1).join(' ');

      // Handle pipe-separated content (name|source)
      const [name, _source] = tagContent.includes('|')
        ? tagContent.split('|')
        : [tagContent, null];

      switch (tagType) {
        // Formatting
        case 'b':
          return `<strong>${name}</strong>`;
        case 'i':
          return `<em>${name}</em>`;
        case 'u':
          return `<u>${name}</u>`;

        // Game mechanics
        case 'dice':
          return name;
        case 'damage':
          return `${name} damage`;
        case 'hit':
          return `+${name} to hit`;
        case 'dc':
          return `DC ${name}`;
        case 'h':
          return 'hit';
        case 'm':
          return 'miss';

        // Game elements
        case 'spell':
          return name;
        case 'item':
          return name;
        case 'feat':
          return `${name} feat`;
        case 'condition':
          return name;
        case 'creature':
          return name;
        case 'class':
          return name;
        case 'background':
          return name;
        case 'race':
          return name;
        case 'skill':
          return name;
        case 'action':
          return name;
        case 'filter':
          return name;

        // Time and rest
        case 'rest':
          if (name === 'long') return 'long rest';
          if (name === 'short') return 'short rest';
          return name;
        case 'recharge':
          return `Recharge ${name}`;

        // Combat
        case 'atk':
          return `${name} attack`;

        // Fallback - return the content without the tag
        default:
          return name || '';
      }
    });
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
                    {Array.from({ length: 20 }, (_, i) => {
                      const level = i + 1;
                      const levelSuffix =
                        level === 1
                          ? 'st'
                          : level === 2
                          ? 'nd'
                          : level === 3
                          ? 'rd'
                          : 'th';
                      const hitPoints =
                        level === 1
                          ? `${characterClass.hitDie} + Con modifier`
                          : `+${
                              Math.floor(characterClass.hitDie / 2) + 1
                            } (or ${characterClass.hitDie}) + Con modifier`;

                      return (
                        <tr key={level}>
                          <td>
                            {level}
                            {levelSuffix}
                          </td>
                          <td>{getProficiencyBonus(level)}</td>
                          <td>{getFeaturesForLevel(level)}</td>
                          <td>{hitPoints}</td>
                        </tr>
                      );
                    })}
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
              <SectionHeader>Class Features by Level</SectionHeader>
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
                            feature.entries
                              .map((entry: any, i: number) => {
                                if (typeof entry === 'string') {
                                  // Better template tag handling
                                  const cleanedEntry = parseTemplateTag(entry);

                                  // Only show if there's actual content after cleaning
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
                                  return null;
                                } else if (typeof entry === 'object') {
                                  // Handle nested entries that might contain tables
                                  if (
                                    entry.type === 'entries' &&
                                    entry.entries
                                  ) {
                                    return (
                                      <div key={i} style={{ marginTop: '8px' }}>
                                        {entry.name && (
                                          <h4
                                            style={{
                                              color: '#8b5a2b',
                                              fontSize: '16px',
                                              fontWeight: 'bold',
                                              marginBottom: '8px',
                                            }}
                                          >
                                            {entry.name}
                                          </h4>
                                        )}
                                        {entry.entries.map(
                                          (
                                            nestedEntry: any,
                                            nestedIdx: number
                                          ) => {
                                            if (
                                              typeof nestedEntry === 'string'
                                            ) {
                                              const cleanedEntry =
                                                parseTemplateTag(nestedEntry);

                                              return (
                                                <p
                                                  key={nestedIdx}
                                                  style={{
                                                    marginBottom: '8px',
                                                  }}
                                                  dangerouslySetInnerHTML={{
                                                    __html: cleanedEntry,
                                                  }}
                                                />
                                              );
                                            } else if (
                                              nestedEntry.type === 'table'
                                            ) {
                                              return (
                                                <div
                                                  key={nestedIdx}
                                                  style={{
                                                    marginTop: '16px',
                                                    marginBottom: '16px',
                                                  }}
                                                >
                                                  {nestedEntry.caption && (
                                                    <p
                                                      style={{
                                                        fontWeight: 'bold',
                                                        marginBottom: '8px',
                                                        color: '#8b5a2b',
                                                      }}
                                                    >
                                                      {nestedEntry.caption}
                                                    </p>
                                                  )}
                                                  <table
                                                    style={{
                                                      width: '100%',
                                                      borderCollapse:
                                                        'collapse',
                                                      border:
                                                        '1px solid #d0c4a0',
                                                      fontSize: '14px',
                                                      backgroundColor:
                                                        '#fafaf7',
                                                    }}
                                                  >
                                                    {nestedEntry.colLabels && (
                                                      <thead>
                                                        <tr
                                                          style={{
                                                            backgroundColor:
                                                              '#8b5a2b',
                                                          }}
                                                        >
                                                          {nestedEntry.colLabels.map(
                                                            (
                                                              label: string,
                                                              idx: number
                                                            ) => (
                                                              <th
                                                                key={idx}
                                                                style={{
                                                                  padding:
                                                                    '8px 12px',
                                                                  border:
                                                                    '1px solid #d0c4a0',
                                                                  color:
                                                                    'white',
                                                                  fontWeight:
                                                                    'bold',
                                                                  textAlign:
                                                                    'left',
                                                                }}
                                                              >
                                                                {typeof label ===
                                                                'string'
                                                                  ? label.replace(
                                                                      /\{@[^}]+\}/g,
                                                                      ''
                                                                    )
                                                                  : label}
                                                              </th>
                                                            )
                                                          )}
                                                        </tr>
                                                      </thead>
                                                    )}
                                                    <tbody>
                                                      {nestedEntry.rows &&
                                                        nestedEntry.rows.map(
                                                          (
                                                            row: any[],
                                                            rowIdx: number
                                                          ) => (
                                                            <tr
                                                              key={rowIdx}
                                                              style={{
                                                                backgroundColor:
                                                                  rowIdx % 2 ===
                                                                  0
                                                                    ? 'white'
                                                                    : '#f9f7f0',
                                                              }}
                                                            >
                                                              {row.map(
                                                                (
                                                                  cell: any,
                                                                  cellIdx: number
                                                                ) => (
                                                                  <td
                                                                    key={
                                                                      cellIdx
                                                                    }
                                                                    style={{
                                                                      padding:
                                                                        '8px 12px',
                                                                      border:
                                                                        '1px solid #d0c4a0',
                                                                      verticalAlign:
                                                                        'top',
                                                                    }}
                                                                  >
                                                                    {typeof cell ===
                                                                    'string'
                                                                      ? cell
                                                                          .replace(
                                                                            /\{@dice ([^}]+)\}/g,
                                                                            '$1'
                                                                          )
                                                                          .replace(
                                                                            /\{@item ([^|]+)\|[^}]+\}/g,
                                                                            '$1'
                                                                          )
                                                                          .replace(
                                                                            /\{@b ([^}]+)\}/g,
                                                                            '$1'
                                                                          )
                                                                          .replace(
                                                                            /\{@[^}]+\}/g,
                                                                            ''
                                                                          )
                                                                      : typeof cell ===
                                                                          'object' &&
                                                                        cell.type ===
                                                                          'entries'
                                                                      ? cell.entries?.join(
                                                                          ' '
                                                                        ) || ''
                                                                      : cell?.toString() ||
                                                                        ''}
                                                                  </td>
                                                                )
                                                              )}
                                                            </tr>
                                                          )
                                                        )}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              );
                                            }
                                            return null;
                                          }
                                        )}
                                      </div>
                                    );
                                  }
                                  // Handle list entries
                                  else if (
                                    entry.type === 'list' &&
                                    entry.items
                                  ) {
                                    return (
                                      <ul
                                        key={i}
                                        style={{
                                          marginLeft: '20px',
                                          marginTop: '8px',
                                        }}
                                      >
                                        {entry.items.map(
                                          (item: any, idx: number) => (
                                            <li
                                              key={idx}
                                              style={{ marginBottom: '4px' }}
                                            >
                                              {typeof item === 'string'
                                                ? item.replace(
                                                    /\{@[^}]+\}/g,
                                                    ''
                                                  )
                                                : item.name || 'List item'}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    );
                                  }
                                  // Handle table entries
                                  else if (entry.type === 'table') {
                                    return (
                                      <div
                                        key={i}
                                        style={{
                                          marginTop: '16px',
                                          marginBottom: '16px',
                                        }}
                                      >
                                        {entry.caption && (
                                          <p
                                            style={{
                                              fontWeight: 'bold',
                                              marginBottom: '8px',
                                              color: '#8b5a2b',
                                            }}
                                          >
                                            {entry.caption}
                                          </p>
                                        )}
                                        <table
                                          style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            border: '1px solid #d0c4a0',
                                            fontSize: '14px',
                                            backgroundColor: '#fafaf7',
                                          }}
                                        >
                                          {entry.colLabels && (
                                            <thead>
                                              <tr
                                                style={{
                                                  backgroundColor: '#8b5a2b',
                                                }}
                                              >
                                                {entry.colLabels.map(
                                                  (
                                                    label: string,
                                                    idx: number
                                                  ) => (
                                                    <th
                                                      key={idx}
                                                      style={{
                                                        padding: '8px 12px',
                                                        border:
                                                          '1px solid #d0c4a0',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        textAlign: 'left',
                                                      }}
                                                    >
                                                      {typeof label === 'string'
                                                        ? label.replace(
                                                            /\{@[^}]+\}/g,
                                                            ''
                                                          )
                                                        : label}
                                                    </th>
                                                  )
                                                )}
                                              </tr>
                                            </thead>
                                          )}
                                          <tbody>
                                            {entry.rows &&
                                              entry.rows.map(
                                                (
                                                  row: any[],
                                                  rowIdx: number
                                                ) => (
                                                  <tr
                                                    key={rowIdx}
                                                    style={{
                                                      backgroundColor:
                                                        rowIdx % 2 === 0
                                                          ? 'white'
                                                          : '#f9f7f0',
                                                    }}
                                                  >
                                                    {row.map(
                                                      (
                                                        cell: any,
                                                        cellIdx: number
                                                      ) => (
                                                        <td
                                                          key={cellIdx}
                                                          style={{
                                                            padding: '8px 12px',
                                                            border:
                                                              '1px solid #d0c4a0',
                                                            verticalAlign:
                                                              'top',
                                                          }}
                                                        >
                                                          {typeof cell ===
                                                          'string'
                                                            ? cell
                                                                .replace(
                                                                  /\{@dice ([^}]+)\}/g,
                                                                  '$1'
                                                                )
                                                                .replace(
                                                                  /\{@item ([^|]+)\|[^}]+\}/g,
                                                                  '$1'
                                                                )
                                                                .replace(
                                                                  /\{@b ([^}]+)\}/g,
                                                                  '$1'
                                                                )
                                                                .replace(
                                                                  /\{@[^}]+\}/g,
                                                                  ''
                                                                )
                                                            : typeof cell ===
                                                                'object' &&
                                                              cell.type ===
                                                                'entries'
                                                            ? cell.entries?.join(
                                                                ' '
                                                              ) || ''
                                                            : cell?.toString() ||
                                                              ''}
                                                        </td>
                                                      )
                                                    )}
                                                  </tr>
                                                )
                                              )}
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  }
                                }
                                return null;
                              })
                              .filter(Boolean) // Remove null entries
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
                                        style={{ marginBottom: '12px' }}
                                      >
                                        <strong>
                                          {typeof feature === 'object' &&
                                          feature.name
                                            ? feature.name
                                            : typeof feature === 'string'
                                            ? feature
                                            : 'Special feature'}
                                        </strong>
                                        {typeof feature === 'object' &&
                                          feature.entries &&
                                          Array.isArray(feature.entries) && (
                                            <div
                                              style={{
                                                marginTop: '4px',
                                                marginLeft: '16px',
                                                fontSize: '14px',
                                                color: '#555',
                                              }}
                                            >
                                              {feature.entries.map(
                                                (
                                                  entry: any,
                                                  entryIdx: number
                                                ) => (
                                                  <p
                                                    key={entryIdx}
                                                    style={{
                                                      marginBottom: '8px',
                                                    }}
                                                  >
                                                    {typeof entry === 'string'
                                                      ? entry.replace(
                                                          /\{@[^}]+\}/g,
                                                          ''
                                                        )
                                                      : ''}
                                                  </p>
                                                )
                                              )}
                                            </div>
                                          )}
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
