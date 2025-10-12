import { CharacterSheetData, calculateModifier, formatModifier } from '../types/characterSheet';
import {
  AbilityScoresSection as StyledAbilityScoresSection,
  AbilityScoresGrid,
  AbilityScore,
  AbilityArrows,
  AbilityArrow,
  SectionTitle,
} from '../styles/components';

interface AbilityScoresSectionProps {
  character: CharacterSheetData;
  editingSections: { abilities: boolean };
  toggleSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  cancelSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  abilities: {
    adjustAbilityScore: (ability: keyof CharacterSheetData['abilityScores'], direction: 'up' | 'down') => void;
  };
}

export default function CharacterAbilityScores({
  character,
  editingSections,
  abilities,
}: AbilityScoresSectionProps) {
  return (
    <StyledAbilityScoresSection>
      <SectionTitle>Ability Scores</SectionTitle>
      <AbilityScoresGrid>
        {(
          [
            'strength',
            'dexterity',
            'constitution',
            'intelligence',
            'wisdom',
            'charisma',
          ] as const
        ).map((ability) => {
          const score = character.abilityScores[ability];
          const modifier = calculateModifier(score);

          return (
            <AbilityScore key={ability}>
              <div className="ability-name">{ability}</div>

              {editingSections.abilities ? (
                <>
                  <div className="score">{score}</div>
                  <div className="modifier">
                    {formatModifier(modifier)}
                  </div>
                </>
              ) : (
                <div
                  className="score"
                  style={{
                    fontSize: 'clamp(1.4rem, 3vw, 2.5rem)',
                    marginBottom: '0.3rem',
                  }}
                >
                  {formatModifier(modifier)}
                </div>
              )}

              {editingSections.abilities && (
                <AbilityArrows>
                  <AbilityArrow
                    direction="up"
                    onClick={() =>
                      abilities.adjustAbilityScore(ability, 'up')
                    }
                  >
                    ▲
                  </AbilityArrow>
                  <AbilityArrow
                    direction="down"
                    onClick={() =>
                      abilities.adjustAbilityScore(ability, 'down')
                    }
                  >
                    ▼
                  </AbilityArrow>
                </AbilityArrows>
              )}
            </AbilityScore>
          );
        })}
      </AbilityScoresGrid>

    </StyledAbilityScoresSection>
  );
}