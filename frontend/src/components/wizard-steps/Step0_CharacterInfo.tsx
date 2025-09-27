import React from 'react';
import { StepContainer, FormGroup } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';

interface Step0CharacterInfoProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

export const Step0CharacterInfo: React.FC<Step0CharacterInfoProps> = ({
  data,
  onUpdate
}) => {
  return (
    <StepContainer>
      <div className="step-title">Character & Player Information</div>
      <div className="step-description">
        Let's start by giving your character a name and recording who's playing them.
      </div>

      <div className="step-content">
        <FormGroup>
          <label htmlFor="characterName">Character Name *</label>
          <input
            id="characterName"
            type="text"
            value={data.characterName}
            onChange={(e) => onUpdate({ characterName: e.target.value })}
            placeholder="Enter your character's name"
            maxLength={50}
          />
        </FormGroup>

        <FormGroup>
          <label htmlFor="playerName">Player Name *</label>
          <input
            id="playerName"
            type="text"
            value={data.playerName}
            onChange={(e) => onUpdate({ playerName: e.target.value })}
            placeholder="Enter your name"
            maxLength={50}
          />
        </FormGroup>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
          <h4 style={{ color: '#d4af37', margin: '0 0 0.5rem 0' }}>What's Next?</h4>
          <p style={{ color: '#ccc', margin: 0, fontSize: '0.9rem' }}>
            After this, we'll set up your ability scores, then follow the 2024 D&D Player's Handbook order:
            Class → Background → Species → Origin Feats
          </p>
        </div>
      </div>
    </StepContainer>
  );
};