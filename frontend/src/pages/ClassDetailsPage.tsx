import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { CharacterClass, Spell, isError } from '../types/api';
import { classService, spellService } from '../services';
import { showError } from '@/utils/errorDisplay';
import { Hero } from '../components';
import SpellCard from '../components/SpellCard';
import SpellModal from '../components/SpellModal';
import { logger } from '../utils/logger';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

// Main page container with forest green background (matching feats page)
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #363636ff 0%,
    #4b4b4bff 25%,
    #323232ff 50%,
    #222222ff 75%,
    #0e0e0eff 100%
  );
  padding: 0;
  font-family: 'Crimson Text', serif;
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

const Navigation = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const BackButton = styled(Link)`
  padding: 12px 24px;
  background: linear-gradient(145deg, #ce9016, #b8860b);
  color: #2c1810;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  &:hover {
    background: linear-gradient(145deg, #b8860b, #a0801b);
    color: #2c1810;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(206, 144, 22, 0.4);
  }
`;

// Main container that holds everything below the header (matching feats page)
const MainContainer = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border: 2px solid #8b6914;
  border-radius: 0 0 15px 15px;
  margin: 0 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(139, 105, 20, 0.3);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  /* Medieval parchment texture */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="paper"><feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/></filter></defs><rect width="100" height="100" fill="rgba(101,67,33,0.1)" filter="url(%23paper)"/></svg>')
      repeat;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 768px) {
    margin: 0 10px 20px 10px;
  }

  @media (max-width: 480px) {
    margin: 0 5px 20px 5px;
  }
`;

// Content inside the main container
const Content = styled.div`
  position: relative;
  z-index: 2;
  padding: 30px;
  line-height: 1.6;
  color: #2c1810;

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 15px;
  }
`;

const ClassDescription = styled.div`
  font-style: italic;
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 3px solid #8b6914;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  font-size: 1.1rem;
  color: #2c1810;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
  font-family: 'Crimson Text', serif;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
`;

const QuickReference = styled.div`
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 3px solid #8b6914;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  font-size: 0.95rem;
  overflow-x: auto;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    padding: 20px;
    margin: 0 -5px 30px -5px;
    border-left: none;
    border-right: none;
    border-radius: 0;
  }
`;

const QuickRefTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }

  th {
    background: linear-gradient(
      145deg,
      rgba(90, 58, 42, 0.9),
      rgba(74, 42, 26, 0.9)
    );
    color: #ce9016;
    padding: 0.75rem 0.5rem;
    text-align: left;
    font-weight: 700;
    font-family: 'Cinzel', serif;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
    letter-spacing: 1px;
    border: 2px solid #8b6914;

    /* Column sizing */
    &:nth-child(1) {
      width: 60px;
    } /* LVL */
    &:nth-child(2) {
      width: 60px;
    } /* Prof. */
    &:nth-child(3) {
      width: auto;
    } /* Features - takes remaining space */
    &:nth-child(4) {
      width: 80px;
    } /* HP */

    @media (max-width: 768px) {
      padding: 0.5rem 0.25rem;
      font-size: 0.75rem;

      &:nth-child(1) {
        width: 50px;
      }
      &:nth-child(2) {
        width: 50px;
      }
      &:nth-child(4) {
        width: 70px;
      }
    }
  }

  td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid rgba(139, 105, 20, 0.3);
    border-left: 1px solid rgba(139, 105, 20, 0.2);
    border-right: 1px solid rgba(139, 105, 20, 0.2);
    color: #2c1810;
    word-wrap: break-word;
    white-space: normal;
    vertical-align: top;

    /* Match column sizing */
    &:nth-child(1) {
      width: 60px;
    } /* LVL */
    &:nth-child(2) {
      width: 60px;
    } /* Prof. */
    &:nth-child(3) {
      width: auto;
    } /* Features - takes remaining space */
    &:nth-child(4) {
      width: 80px;
    } /* HP */

    @media (max-width: 768px) {
      padding: 0.5rem 0.25rem;
      font-size: 0.75rem;

      &:nth-child(1) {
        width: 50px;
      }
      &:nth-child(2) {
        width: 50px;
      }
      &:nth-child(4) {
        width: 70px;
      }
    }
  }

  tr:nth-child(even) td {
    background: rgba(139, 105, 20, 0.1);
  }
`;

const SectionHeader = styled.h2`
  color: #ce9016;
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 2.5rem 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid #8b6914;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
`;

const SubHeader = styled.h3`
  color: #b8860b;
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  margin: 2rem 0 1rem 0;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
`;

const FeatureBlock = styled.div`
  margin-bottom: 1.5rem;
  padding: 25px;
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 3px solid #8b6914;
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
`;

const FeatureName = styled.h4`
  color: #8b6914;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  font-family: 'Cinzel', serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
`;

const FeatureDescription = styled.div`
  font-size: 0.95rem;
  line-height: 1.6;
  color: #2c1810;
  font-family: 'Crimson Text', serif;

  p {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  ul,
  ol {
    margin: 0.75rem 0 1rem 1.5rem;
  }

  strong {
    color: #8b6914;
    font-weight: 700;
  }
`;

const ProficiencyList = styled.ul`
  margin: 0.75rem 0 1.5rem 1.5rem;
  color: #2c1810;
  font-family: 'Crimson Text', serif;

  li {
    margin-bottom: 0.5rem;
  }

  strong {
    color: #8b6914;
    font-weight: 700;
  }
`;

const EquipmentSection = styled.div`
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 3px solid #8b6914;
  border-radius: 15px;
  padding: 25px;
  margin: 1.5rem 0;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
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
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
  position: relative;
  z-index: 1;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #ce9016;
  text-align: center;
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;

  .error-title {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .error-message {
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  button {
    background: linear-gradient(145deg, #ce9016, #b8860b);
    color: #2c1810;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Cinzel', serif;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(206, 144, 22, 0.4);
      background: linear-gradient(145deg, #b8860b, #a0801b);
    }
  }
`;

const TabContainer = styled.div`
  border-bottom: 3px solid #8b6914;
  margin: 2rem 0 1.5rem 0;
`;

const TabButton = styled.button<{ active: boolean }>`
  background: ${(props) =>
    props.active
      ? 'linear-gradient(145deg, #ce9016, #b8860b)'
      : 'linear-gradient(145deg, rgba(244, 231, 209, 0.8), rgba(232, 213, 183, 0.8))'};
  color: ${(props) => (props.active ? '#2c1810' : '#8b6914')};
  border: 2px solid #8b6914;
  padding: 1rem 1.5rem;
  margin-right: 0.5rem;
  border-radius: 15px 15px 0 0;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Cinzel', serif;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  text-shadow: ${(props) =>
    props.active ? 'none' : '1px 1px 2px rgba(0, 0, 0, 0.3)'};

  &:hover {
    background: ${(props) =>
      props.active
        ? 'linear-gradient(145deg, #ce9016, #b8860b)'
        : 'linear-gradient(145deg, #ce9016, #b8860b)'};
    color: #2c1810;
    transform: translateY(-2px);
    text-shadow: none;
  }

  .tab-text-mobile {
    display: none;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    margin-right: 0.25rem;

    .tab-text-full {
      display: none;
    }

    .tab-text-mobile {
      display: inline;
    }
  }

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    margin-right: 0.2rem;
  }
`;

// Enhanced ClassDetailsPage with tabs
const ClassDetailsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [searchParams] = useSearchParams();
  const [characterClass, setCharacterClass] = useState<CharacterClass | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for tab parameter in URL and set initial active tab
  const initialTab = searchParams.get('tab') as
    | 'overview'
    | 'subclasses'
    | 'spells'
    | null;
  const [activeTab, setActiveTab] = useState<
    'overview' | 'subclasses' | 'spells'
  >(
    initialTab && ['overview', 'subclasses', 'spells'].includes(initialTab)
      ? initialTab
      : 'overview'
  );
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

      const response = await classService.getClassById(classId);

      if (isError(response)) {
        setError(response.error ?? 'Failed to load class data from the ancient tomes.');
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

  // Load spells for the current class
  const loadSpells = async () => {
    if (!characterClass?.name) return;

    setSpellsLoading(true);
    try {
      const response = await spellService.listSpellsByClass(characterClass.name);
      if (isError(response)) {
        showError(response.error ?? 'Failed to load spells for this class.', response.statusCode, response.errorCode);
        setSpells([]);
      } else {
        const payload = response.data;
        setSpells(payload.spells ?? payload.items ?? []);
      }
    } catch (err) {
      logger.error('Error loading spells:', err);
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
      <>
        <FontImport />
        <PageContainer>
          <ContentContainer>
            <MainContainer>
              <Content>
                <LoadingContainer>
                  📚 Gathering Ancient Knowledge from the Guild Halls...
                </LoadingContainer>
              </Content>
            </MainContainer>
          </ContentContainer>
        </PageContainer>
      </>
    );
  }

  if (error || !characterClass) {
    return (
      <>
        <FontImport />
        <PageContainer>
          <ContentContainer>
            <MainContainer>
              <Content>
                <ErrorContainer>
                  <div className="error-title">
                    ⚔️ Ancient Scrolls Unavailable
                  </div>
                  <div className="error-message">
                    {error || 'Class not found in the archives.'}
                  </div>
                  <button onClick={loadClassData}>Retry Incantation</button>
                </ErrorContainer>
              </Content>
            </MainContainer>
          </ContentContainer>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <FontImport />
      <PageContainer>
        <ContentContainer>
          <Hero
            title={characterClass.name}
            subtitle="Master of Skills and Shadows"
            height="280px"
          />

          <Navigation
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 10,
            }}
          >
            <BackButton to="/classes">← Back to Classes</BackButton>
          </Navigation>

          <MainContainer>
            <Content>
              <ClassDescription>{getClassDescription()}</ClassDescription>

              {/* Tabbed Navigation */}
              <TabContainer>
                <TabButton
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                >
                  <span className="tab-text-full">📖 Class Details</span>
                  <span className="tab-text-mobile">📖 Details</span>
                </TabButton>
                {getSubclasses().length > 0 && (
                  <TabButton
                    active={activeTab === 'subclasses'}
                    onClick={() => setActiveTab('subclasses')}
                  >
                    <span className="tab-text-full">
                      ⚔️ Subclasses ({getSubclasses().length})
                    </span>
                    <span className="tab-text-mobile">
                      ⚔️ Subs ({getSubclasses().length})
                    </span>
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

              {/* Class Details Tab Content */}
              {activeTab === 'overview' && (
                <>
                  {/* Quick Reference Table */}
                  <QuickReference>
                    <QuickRefTable>
                      <thead>
                        <tr>
                          <th>LVL</th>
                          <th>Prof.</th>
                          <th>Features</th>
                          <th>HP</th>
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
                    As a {characterClass.name.toLowerCase()}, you gain the
                    following class features.
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
                    {Math.floor(characterClass.hitDie / 2) + 1}) + your
                    Constitution modifier per{' '}
                    {characterClass.name.toLowerCase()} level after 1st
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
                        {formatProficiencies(
                          characterClass.weaponProficiencies
                        )}
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
                      {(characterClass.savingThrows || characterClass.savingThrowProficiencies || []).join(', ')}
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
                              {feature.entries &&
                              Array.isArray(feature.entries) ? (
                                feature.entries
                                  .map((entry: any, i: number) => {
                                    if (typeof entry === 'string') {
                                      // Better template tag handling
                                      const cleanedEntry =
                                        parseTemplateTag(entry);

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
                                          <div
                                            key={i}
                                            style={{ marginTop: '8px' }}
                                          >
                                            {entry.name && (
                                              <h4
                                                style={{
                                                  color: '#8b6914',
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
                                                  typeof nestedEntry ===
                                                  'string'
                                                ) {
                                                  const cleanedEntry =
                                                    parseTemplateTag(
                                                      nestedEntry
                                                    );

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
                                                            color: '#8b6914',
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
                                                            '2px solid #8b6914',
                                                          fontSize: '14px',
                                                          backgroundColor:
                                                            '#f4e7d1',
                                                        }}
                                                      >
                                                        {nestedEntry.colLabels && (
                                                          <thead>
                                                            <tr
                                                              style={{
                                                                background:
                                                                  'linear-gradient(145deg, rgba(90, 58, 42, 0.9), rgba(74, 42, 26, 0.9))',
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
                                                                        '1px solid #8b6914',
                                                                      color:
                                                                        '#ce9016',
                                                                      fontWeight:
                                                                        'bold',
                                                                      textAlign:
                                                                        'left',
                                                                      fontFamily:
                                                                        'Cinzel, serif',
                                                                      textShadow:
                                                                        '1px 1px 2px rgba(0, 0, 0, 0.5)',
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
                                                                      rowIdx %
                                                                        2 ===
                                                                      0
                                                                        ? 'rgba(139, 105, 20, 0.1)'
                                                                        : 'transparent',
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
                                                                            '1px solid #8b6914',
                                                                          verticalAlign:
                                                                            'top',
                                                                          color:
                                                                            '#2c1810',
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
                                                                            ) ||
                                                                            ''
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
                                                  style={{
                                                    marginBottom: '4px',
                                                  }}
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
                                                  color: '#8b6914',
                                                }}
                                              >
                                                {entry.caption}
                                              </p>
                                            )}
                                            <table
                                              style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                border: '2px solid #8b6914',
                                                fontSize: '14px',
                                                backgroundColor: '#f4e7d1',
                                              }}
                                            >
                                              {entry.colLabels && (
                                                <thead>
                                                  <tr
                                                    style={{
                                                      background:
                                                        'linear-gradient(145deg, rgba(90, 58, 42, 0.9), rgba(74, 42, 26, 0.9))',
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
                                                              '1px solid #8b6914',
                                                            color: '#ce9016',
                                                            fontWeight: 'bold',
                                                            textAlign: 'left',
                                                            fontFamily:
                                                              'Cinzel, serif',
                                                            textShadow:
                                                              '1px 1px 2px rgba(0, 0, 0, 0.5)',
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
                                                              ? 'rgba(139, 105, 20, 0.1)'
                                                              : 'transparent',
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
                                                                padding:
                                                                  '8px 12px',
                                                                border:
                                                                  '1px solid #8b6914',
                                                                verticalAlign:
                                                                  'top',
                                                                color:
                                                                  '#2c1810',
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
                            <strong>
                              {characterClass.spellcastingAbility}
                            </strong>{' '}
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
                    level, you choose a subclass that grants you special
                    features at certain levels.
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
                              <div
                                style={{ marginLeft: '20px', marginTop: '8px' }}
                              >
                                {Object.entries(levelFeatures)
                                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                  .map(([level, features]: [string, any[]]) => (
                                    <div
                                      key={level}
                                      style={{ marginBottom: '12px' }}
                                    >
                                      <strong style={{ color: '#8b6914' }}>
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
                                              Array.isArray(
                                                feature.entries
                                              ) && (
                                                <div
                                                  style={{
                                                    marginTop: '4px',
                                                    marginLeft: '16px',
                                                    fontSize: '14px',
                                                    color: '#2c1810',
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
                                                        {typeof entry ===
                                                        'string'
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
                                color: '#6d4423',
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
                    <SectionHeader>
                      {characterClass.name} Spell List
                    </SectionHeader>
                    <FeatureBlock style={{ marginBottom: '24px' }}>
                      <FeatureName>
                        Spellcasting Ability:{' '}
                        {characterClass.spellcastingAbility}
                      </FeatureName>
                      <FeatureDescription>
                        <p>
                          <strong>Spell save DC</strong> = 8 + your proficiency
                          bonus + your {characterClass.spellcastingAbility}{' '}
                          modifier
                        </p>
                        <p>
                          <strong>Spell attack modifier</strong> = your
                          proficiency bonus + your{' '}
                          {characterClass.spellcastingAbility} modifier
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
                        📚 Loading {characterClass.name} spellbook...
                      </LoadingContainer>
                    ) : spells.length > 0 ? (
                      <div>
                        <p style={{ marginBottom: '24px' }}>
                          <strong>Total Spells Available:</strong>{' '}
                          {spells.length}
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
                                    color: '#a0824a',
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
                        <FeatureName>
                          No Spells Found in the Grimoires
                        </FeatureName>
                        <FeatureDescription>
                          <p>
                            No spells are currently available for the{' '}
                            {characterClass.name} class in the ancient
                            libraries. This may be due to knowledge still being
                            gathered from distant realms.
                          </p>
                        </FeatureDescription>
                      </FeatureBlock>
                    )}
                  </div>
                )}
            </Content>
          </MainContainer>
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
    </>
  );
};

export default ClassDetailsPage;