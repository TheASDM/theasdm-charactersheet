import React from 'react';
import { StepContainer, FormGroup, RadioGroup } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import styled from 'styled-components';

interface Step1AbilityScoresProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

const AbilityScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  margin-top: 0.75rem;
  max-width: none;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const AbilityScoreBox = styled.div`
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.5rem;
  text-align: center;
  min-width: 0; // Prevent overflow

  .ability-name {
    color: #d4af37;
    font-weight: 600;
    margin-bottom: 0.25rem;
    text-transform: capitalize;
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ability-input {
    width: 100%;
    padding: 4px 6px;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid #666;
    border-radius: 4px;
    color: #f0f0f0;
    font-size: 1.2rem;
    font-weight: 700;
    text-align: center;
    min-width: 0;

    &:focus {
      outline: none;
      border-color: #d4af37;
      box-shadow: 0 0 4px rgba(212, 175, 55, 0.3);
    }
  }

  .ability-modifier {
    text-align: center;
    margin-top: 0.15rem;
    color: #888;
    font-size: 0.7rem;
    font-weight: 500;
  }
`;

const StandardArrayInfo = styled.div`
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  text-align: center;

  h4 {
    color: #4caf50;
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  p {
    color: #ccc;
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
  }

  .standard-array-values {
    display: flex;
    justify-content: center;
    gap: 1rem;
    font-weight: 700;
    color: #4caf50;
    font-size: 1.2rem;
  }
`;

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

function getAbilityModifier(score: number): string {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export const Step1AbilityScores: React.FC<Step1AbilityScoresProps> = ({
  data,
  onUpdate
}) => {
  const handleMethodChange = (method: 'standard-array' | 'custom') => {
    if (method === 'standard-array') {
      // Set all abilities to 10 first, user will assign the standard array values
      onUpdate({
        abilityScoreMethod: method,
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10
        }
      });
    } else {
      onUpdate({ abilityScoreMethod: method });
    }
  };

  const handleAbilityScoreChange = (ability: keyof CharacterBuilderData['abilityScores'], value: number) => {
    onUpdate({
      abilityScores: {
        ...data.abilityScores,
        [ability]: Math.max(3, Math.min(18, value))
      }
    });
  };

  return (
    <StepContainer>
      <div className="step-title">Ability Scores</div>
      <div className="step-description">
        Choose how you want to determine your character's ability scores.
      </div>

      <div className="step-content">
        <FormGroup style={{ marginBottom: '0.75rem' }}>
          <label style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: '600', color: '#d4af37' }}>Ability Score Method</label>
          <RadioGroup style={{ gap: '2rem', justifyContent: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <div className="radio-option">
              <input
                type="radio"
                id="standard-array"
                name="abilityMethod"
                value="standard-array"
                checked={data.abilityScoreMethod === 'standard-array'}
                onChange={() => handleMethodChange('standard-array')}
              />
              <label htmlFor="standard-array">
                <strong>Standard Array</strong>
                <br />
                <small>Use the recommended values</small>
              </label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="custom"
                name="abilityMethod"
                value="custom"
                checked={data.abilityScoreMethod === 'custom'}
                onChange={() => handleMethodChange('custom')}
              />
              <label htmlFor="custom">
                <strong>Custom Scores</strong>
                <br />
                <small>Set your own values</small>
              </label>
            </div>
          </RadioGroup>
        </FormGroup>

        {data.abilityScoreMethod === 'standard-array' && (
          <StandardArrayInfo>
            <h4>Standard Array</h4>
            <p>
              Assign these values to your six abilities. Each value can only be used once.
            </p>
            <div className="standard-array-values">
              {STANDARD_ARRAY.map(value => (
                <span key={value}>{value}</span>
              ))}
            </div>
          </StandardArrayInfo>
        )}

        <AbilityScoreGrid>
          {ABILITIES.map(ability => (
            <AbilityScoreBox key={ability}>
              <div className="ability-name">{ability}</div>
              <input
                type="number"
                className="ability-input"
                value={data.abilityScores[ability]}
                onChange={(e) => handleAbilityScoreChange(ability, parseInt(e.target.value) || 3)}
                min={data.abilityScoreMethod === 'standard-array' ? 8 : 3}
                max={data.abilityScoreMethod === 'standard-array' ? 15 : 18}
              />
              <div className="ability-modifier">
                {getAbilityModifier(data.abilityScores[ability])}
              </div>
            </AbilityScoreBox>
          ))}
        </AbilityScoreGrid>

        {data.abilityScoreMethod === 'standard-array' && (
          <div style={{
            marginTop: '0.5rem',
            textAlign: 'center',
            color: '#d4af37',
            fontSize: '0.85rem',
            padding: '0.5rem',
            background: 'rgba(212, 175, 55, 0.1)',
            borderRadius: '4px',
            border: '1px solid rgba(212, 175, 55, 0.2)'
          }}>
            💡 Tip: Put your highest scores in abilities your class uses most.
          </div>
        )}
      </div>
    </StepContainer>
  );
};