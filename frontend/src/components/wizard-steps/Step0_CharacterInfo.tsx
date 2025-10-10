import React, { useEffect } from 'react';
import styled from 'styled-components';
import { StepContainer, FormGroup } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import namesData from '../../data/names.json';

interface Step0CharacterInfoProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
  onMethodSelect?: (method: 'standard-array' | 'custom') => void;
}

const InputWithButton = styled.div`
  position: relative;

  input {
    padding-right: 3rem;
  }

  .random-btn {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(145deg, #ce9016, #b8860b);
    border: none;
    border-radius: 4px;
    color: #1a1a1a;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(145deg, #e6b52a, #ce9016);
      transform: translateY(-50%) scale(1.05);
    }

    &:active {
      transform: translateY(-50%) scale(0.95);
    }
  }
`;

const MethodSelectionContainer = styled.div`
  margin-top: 2rem;
`;

const MethodTitle = styled.h3`
  color: #ce9016;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const MethodButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const MethodCard = styled.button`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid #444;
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  h4 {
    color: #ce9016;
    font-family: 'Cinzel', serif;
    font-size: 1.3rem;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: #ccc;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.4;
  }
`;

const InfoBox = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(206, 144, 22, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(206, 144, 22, 0.3);

  h4 {
    color: #ce9016;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: #ccc;
    margin: 0;
    font-size: 0.9rem;
  }
`;

const NextButton = styled.button`
  display: block;
  margin: 1.5rem auto 0;
  padding: 0.75rem 2rem;
  background: linear-gradient(145deg, #ce9016, #b8860b);
  border: none;
  border-radius: 8px;
  color: #1a1a1a;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: linear-gradient(145deg, #e6b52a, #ce9016);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const Step0CharacterInfo: React.FC<Step0CharacterInfoProps> = ({
  data,
  onUpdate,
  onMethodSelect
}) => {

  const getRandomName = (nameArray: string[]) => {
    return nameArray[Math.floor(Math.random() * nameArray.length)];
  };

  const generateRandomCharacterName = () => {
    const firstName = getRandomName(namesData.firstNames);
    const lastName = getRandomName(namesData.lastNames);
    return `${firstName} ${lastName}`;
  };

  const handleRefreshCharacterName = () => {
    const newName = generateRandomCharacterName();
    onUpdate({ characterName: newName });
  };

  // Auto-fill character name on component mount if it's empty
  useEffect(() => {
    if (!data.characterName) {
      const randomName = generateRandomCharacterName();
      onUpdate({ characterName: randomName });
    }
  }, []);

  const handleMethodClick = (method: 'standard-array' | 'custom') => {
    // Update the method in the data
    onUpdate({ abilityScoreMethod: method });
    // Call the callback to navigate to next step
    if (onMethodSelect) {
      onMethodSelect(method);
    }
  };

  return (
    <StepContainer>
      <div className="step-title">Character Information</div>
      <div className="step-description">
        Let's start by giving your character a name and choosing how you'll determine ability scores.
      </div>

      <div className="step-content">
        <FormGroup>
          <label htmlFor="characterName">Character Name</label>
          <InputWithButton>
            <input
              id="characterName"
              type="text"
              value={data.characterName}
              onChange={(e) => onUpdate({ characterName: e.target.value })}
              placeholder="Enter your character's name"
              maxLength={50}
            />
            <button
              type="button"
              className="random-btn"
              onClick={handleRefreshCharacterName}
              title="Generate new random character name"
            >
              🔄
            </button>
          </InputWithButton>
        </FormGroup>

        <MethodSelectionContainer>
          <MethodTitle>How will you determine ability scores?</MethodTitle>
          <MethodButtons>
            <MethodCard
              onClick={() => onUpdate({ abilityScoreMethod: 'standard-array' })}
              style={{
                borderColor: data.abilityScoreMethod === 'standard-array' ? '#ce9016' : '#444',
                background: data.abilityScoreMethod === 'standard-array' ? 'rgba(206, 144, 22, 0.15)' : 'rgba(26, 26, 26, 0.8)'
              }}
            >
              <h4>Standard Array</h4>
              <p>Use the standard values: 15, 14, 13, 12, 10, 8</p>
              {data.abilityScoreMethod === 'standard-array' && <p style={{ color: '#6aa84f', marginTop: '0.5rem', fontWeight: 600 }}>✓ Selected</p>}
            </MethodCard>
            <MethodCard
              onClick={() => onUpdate({ abilityScoreMethod: 'custom' })}
              style={{
                borderColor: data.abilityScoreMethod === 'custom' ? '#ce9016' : '#444',
                background: data.abilityScoreMethod === 'custom' ? 'rgba(206, 144, 22, 0.15)' : 'rgba(26, 26, 26, 0.8)'
              }}
            >
              <h4>Roll / Custom</h4>
              <p>Roll 4d6 (drop lowest) or enter custom scores</p>
              {data.abilityScoreMethod === 'custom' && <p style={{ color: '#6aa84f', marginTop: '0.5rem', fontWeight: 600 }}>✓ Selected</p>}
            </MethodCard>
          </MethodButtons>

          <NextButton
            onClick={() => handleMethodClick(data.abilityScoreMethod)}
            disabled={!data.abilityScoreMethod}
          >
            Next
          </NextButton>
        </MethodSelectionContainer>

        <InfoBox>
          <h4>What's Next?</h4>
          <p>
            After choosing your ability score method, we'll follow the 2024 D&D Player's Handbook order:
            Class → Background → Species → Origin Feats
          </p>
        </InfoBox>
      </div>
    </StepContainer>
  );
};