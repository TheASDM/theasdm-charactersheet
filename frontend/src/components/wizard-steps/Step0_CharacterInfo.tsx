import React from 'react';
import styled from 'styled-components';
import { StepContainer, FormGroup } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import namesData from '../../data/names.json';

interface Step0CharacterInfoProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
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
    background: linear-gradient(145deg, #d4af37, #b8941f);
    border: none;
    border-radius: 4px;
    color: #1a1a1a;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(145deg, #e6b52a, #d4af37);
      transform: translateY(-50%) scale(1.05);
    }

    &:active {
      transform: translateY(-50%) scale(0.95);
    }
  }
`;


export const Step0CharacterInfo: React.FC<Step0CharacterInfoProps> = ({
  data,
  onUpdate
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
  React.useEffect(() => {
    if (!data.characterName) {
      const randomName = generateRandomCharacterName();
      onUpdate({ characterName: randomName });
    }
  }, []);
  return (
    <StepContainer>
      <div className="step-title">Character & Player Information</div>
      <div className="step-description">
        Let's start by giving your character a name and recording who's playing them.
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

        <FormGroup>
          <label htmlFor="playerName">Player Name</label>
          <input
            id="playerName"
            type="text"
            value={data.playerName}
            onChange={(e) => onUpdate({ playerName: e.target.value })}
            placeholder="Please enter your name"
            maxLength={50}
          />
        </FormGroup>


        {(!data.characterName.trim() || !data.playerName.trim()) && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <h4 style={{ color: '#d4af37', margin: '0 0 0.5rem 0' }}>What's Next?</h4>
            <p style={{ color: '#ccc', margin: 0, fontSize: '0.9rem' }}>
              After this, we'll set up your ability scores, then follow the 2024 D&D Player's Handbook order:
              Class → Background → Species → Origin Feats
            </p>
          </div>
        )}
      </div>
    </StepContainer>
  );
};