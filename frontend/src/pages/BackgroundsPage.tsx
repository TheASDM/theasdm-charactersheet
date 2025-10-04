import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Background, isError } from '../types/api';
import { listBackgrounds } from '@/services/backgroundService';
import { useApiCall } from '@/hooks/useApiCall';
import LoadingSpinner from '@/components/LoadingSpinner';
import { showError } from '@/utils/errorDisplay';

// Main page container matching Generator theme
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
`;

// Header section
const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-family: 'Cinzel', serif;
    font-size: 3rem;
    color: #d4af37;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  p {
    font-size: 1.2rem;
    color: #ccc;
    max-width: 600px;
    margin: 0 auto;
  }
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

// Main container matching Generator's WizardContent
const MainContainer = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 3rem;
  min-height: 500px;
  backdrop-filter: blur(10px);
`;

// Background cards grid - matching generator
const BackgroundGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Individual background card - matching generator
const BackgroundCard = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid #444;
  border-radius: 8px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(212, 175, 55, 0.3);
  }
`;

const BackgroundName = styled.h3`
  color: #d4af37;
  margin: 0 0 0.5rem 0;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  text-align: center;
`;

const BackgroundDescription = styled.p`
  color: #ccc;
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0 0 0.75rem 0;
  text-align: center;
  flex: 1;
`;

const BackgroundFeatures = styled.div`
  .feature-title {
    color: #d4af37;
    font-weight: 600;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .feature-list {
    color: #aaa;
    font-size: 0.75rem;
    line-height: 1.3;
    margin-bottom: 0.5rem;
  }

  .ability-score-main {
    color: #aaa;
    font-size: 0.75rem;
    line-height: 1.3;
  }

  .ability-score-rules {
    color: #d4af37;
    font-size: 0.7rem;
    font-style: italic;
    margin-top: 0.25rem;
  }
`;

// Loading and error states
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #d4af37;
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

const BackgroundsPage: React.FC = () => {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const {
    data: backgroundData,
    error,
    isLoading,
    execute: fetchBackgrounds,
  } = useApiCall(listBackgrounds, {
    onSuccess: setBackgrounds,
    onError: (result) => {
      if (isError(result)) {
        showError(result.error ?? 'Failed to load backgrounds from the chronicles of old.', result.statusCode, result.errorCode);
      }
    },
  });

  useEffect(() => {
    fetchBackgrounds();
  }, [fetchBackgrounds]);

  useEffect(() => {
    if (backgroundData) {
      setBackgrounds(backgroundData);
    }
  }, [backgroundData]);

  // Helper functions
  const getSkillProficiencyList = (skillProfs?: { [key: string]: boolean }): string => {
    if (!skillProfs) return 'None';
    const skills = Object.keys(skillProfs).filter(skill => skillProfs[skill]);
    return skills.length > 0
      ? skills.map(skill => skill.charAt(0).toUpperCase() + skill.slice(1)).join(', ')
      : 'None';
  };

  const getAbilityScoreInfo = (abilityScoreIncrease?: any): { abilities: string; rules: string } => {
    if (!abilityScoreIncrease || !abilityScoreIncrease.options) {
      return { abilities: 'None', rules: '' };
    }

    const abilities = abilityScoreIncrease.options.map((ability: string) => {
      switch (ability) {
        case 'str':
          return 'Strength';
        case 'dex':
          return 'Dexterity';
        case 'con':
          return 'Constitution';
        case 'int':
          return 'Intelligence';
        case 'wis':
          return 'Wisdom';
        case 'cha':
          return 'Charisma';
        default:
          return ability.toUpperCase();
      }
    });

    const abilityNames = abilities.join(', ');
    let rules = '';

    if (abilities.length === 3) {
      rules = '(increase one by 2 and one by 1 or all 3 by 1)';
    } else if (abilities.length === 2) {
      rules = '(increase one by 2 and one by 1)';
    }

    return { abilities: abilityNames, rules };
  };

  const getLanguageInfo = (): string => {
    return 'Choose 2 languages';
  };

  if (isLoading && backgrounds.length === 0) {
    return (
      <PageContainer>
        <ContentContainer>
          <Header>
            <h1>D&D Backgrounds</h1>
            <p>Forge Your Past</p>
          </Header>
          <MainContainer>
            <LoadingContainer>
              <LoadingSpinner message="Loading background data..." />
            </LoadingContainer>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error && backgrounds.length === 0) {
    return (
      <PageContainer>
        <ContentContainer>
          <Header>
            <h1>D&D Backgrounds</h1>
            <p>Forge Your Past</p>
          </Header>
          <MainContainer>
            <ErrorContainer>
              <div className="error-title">Error Loading Backgrounds</div>
              <div className="error-message">{error}</div>
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
          <h1>D&D Backgrounds</h1>
          <p>Choose from {backgrounds.length} diverse backgrounds</p>
        </Header>
        <MainContainer>
          <BackgroundGrid>
            {backgrounds.map((background, index) => (
              <BackgroundCard key={background.id || background.name || index}>
                <BackgroundName>{background.name}</BackgroundName>

                <BackgroundDescription>
                  {background.description ||
                    `A ${background.name.toLowerCase()} background with unique skills and experiences.`}
                </BackgroundDescription>

                <BackgroundFeatures>
                  <div className="feature-title">Skills:</div>
                  <div className="feature-list">
                    {getSkillProficiencyList(background.skillProficiencies)}
                  </div>

                  <div className="feature-title">Languages:</div>
                  <div className="feature-list">{getLanguageInfo()}</div>

                  <div className="feature-title">Ability Score Increase:</div>
                  <div className="ability-score-main">
                    {getAbilityScoreInfo(background.abilityScoreIncrease).abilities}
                  </div>
                  {getAbilityScoreInfo(background.abilityScoreIncrease).rules && (
                    <div className="ability-score-rules">
                      {getAbilityScoreInfo(background.abilityScoreIncrease).rules}
                    </div>
                  )}

                  {background.originFeat && (
                    <>
                      <div className="feature-title">Origin Feat:</div>
                      <div className="feature-list">{background.originFeat}</div>
                    </>
                  )}
                </BackgroundFeatures>
              </BackgroundCard>
            ))}
          </BackgroundGrid>
        </MainContainer>
      </ContentContainer>
    </PageContainer>
  );
};

export default BackgroundsPage;
