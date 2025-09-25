import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { CharacterClass } from '../types/api';
import { classService } from '../services';

// Styled components for clean D&D styling
const PageContainer = styled.div`
  min-height: 100vh;
  background: #2c2c2c;
  font-family: 'Georgia', serif;
  position: relative;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  margin-top: 2rem;
  margin-bottom: 2rem;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    margin: 1rem;
    min-height: calc(100vh - 2rem);
  }
`;

const Header = styled.div`
  background: #c85450;
  color: #f8f6f0;
  padding: 2rem;
  text-align: center;
  border-bottom: 2px solid #a94442;
`;

const ClassTitle = styled.h1`
  margin: 0 0 8px 0;
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  font-weight: 600;
`;

const ClassSubtitle = styled.p`
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
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
  padding: 24px;
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
`;

const MetaItem = styled.div`
  h4 {
    color: #8b5a2b;
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
  margin-bottom: 32px;

  h2 {
    color: #8b5a2b;
    font-family: 'Cinzel', serif;
    font-size: 1.8rem;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #8b5a2b;
  }
`;

const LevelsTable = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
`;

const LevelRow = styled.div<{ isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 80px 1fr;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: ${(props) => (props.isHeader ? '#8B5A2B' : 'white')};
  color: ${(props) => (props.isHeader ? 'white' : '#333')};
  font-weight: ${(props) => (props.isHeader ? '600' : '400')};

  &:last-child {
    border-bottom: none;
  }

  &:nth-child(even):not(:first-child) {
    background: #f9fafb;
  }
`;

const LevelNumber = styled.div`
  font-weight: 600;
  color: #8b5a2b;
`;

const FeaturesList = styled.div`
  line-height: 1.5;
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

const ClassLevelsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [characterClass, setCharacterClass] = useState<CharacterClass | null>(
    null
  );
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

  // Helper functions (same as modal)
  const formatPrimaryAbilities = (abilities: string[]): string => {
    if (!abilities || abilities.length === 0) return 'None';
    return abilities.join(' or ');
  };

  const formatSavingThrows = (saves: string[]): string => {
    if (!saves || saves.length === 0) return 'None';
    return saves.join(', ');
  };

  const formatClassFeatures = (features: any): string => {
    if (!features) return '';

    if (typeof features === 'string') return features;
    if (typeof features === 'number') return features.toString();

    if (Array.isArray(features)) {
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
      const entries = Object.entries(features);
      return entries
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return key;
          }
          return `${key}: ${value}`;
        })
        .join(', ');
    }

    return 'Class Feature';
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

  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>Loading class information...</LoadingContainer>
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
          <ClassTitle>{characterClass.name}</ClassTitle>
          <ClassSubtitle>Class Features by Level</ClassSubtitle>
          <Navigation>
            <BackButton to="/classes">← Back to Classes</BackButton>
            <NavButton to={`/classes/${classId}/details`}>
              📖 Full Details
            </NavButton>
          </Navigation>
        </Header>

        <Content>
          {/* Class Meta Information */}
          <MetaGrid>
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
          </MetaGrid>

          {/* Class Features Table */}
          <Section>
            <h2>Class Features by Level</h2>
            <LevelsTable>
              <LevelRow isHeader>
                <div>Level</div>
                <div>Features</div>
              </LevelRow>
              {getClassFeatures().map(({ level, features }) => (
                <LevelRow key={level}>
                  <LevelNumber>{level}</LevelNumber>
                  <FeaturesList>{formatClassFeatures(features)}</FeaturesList>
                </LevelRow>
              ))}
            </LevelsTable>
          </Section>
        </Content>
      </ContentContainer>
    </PageContainer>
  );
};

export default ClassLevelsPage;
