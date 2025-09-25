import styled from 'styled-components';
import { CharacterClass } from '../types/api';

interface ClassCardProps {
  characterClass: CharacterClass;
  onLevelsClick?: (() => void) | undefined;
  onDetailsClick?: (() => void) | undefined;
  compact?: boolean;
}

// Individual class card (matching FeatCard)
const ClassCard = styled.div`
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 3px solid #8b6914;
  border-radius: 15px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  font-family: 'Crimson Text', serif;
  overflow: hidden;
  position: relative;
  color: #2c1810;
  will-change: transform;
  contain: layout style paint;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    border-color: #d4af37;
  }
`;

const ClassHeader = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.9),
    rgba(74, 42, 26, 0.9)
  );
  color: #d4af37;
  padding: 20px 25px;
  border-bottom: 2px solid #8b6914;
  position: relative;

  @media (max-width: 480px) {
    padding: 15px 20px;
  }
`;

const ClassName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #d4af37;
  font-family: 'Cinzel', serif;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
`;

const ClassType = styled.div`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: white;
  font-family: 'Cinzel', serif;
  background: linear-gradient(145deg, #8b6914, #6d5411);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const ClassContent = styled.div`
  padding: 25px;
  background: transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const InfoBox = styled.div`
  background: rgba(139, 105, 20, 0.1);
  padding: 12px 15px;
  border-radius: 8px;
  border-left: 4px solid #8b6914;
  text-align: center;

  .label {
    color: #8b6914;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Cinzel', serif;
    margin-bottom: 5px;
    display: block;
  }

  .value {
    color: #2c1810;
    font-weight: 700;
    font-size: 1.1rem;
    line-height: 1.4;
  }
`;

const DetailsList = styled.div`
  margin-bottom: 20px;
`;

const DetailsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(139, 105, 20, 0.2);

  &:last-child {
    border-bottom: none;
  }
`;

const DetailsLabel = styled.span`
  color: #8b6914;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Cinzel', serif;
  min-width: 100px;
`;

const AbilityTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const AbilityTag = styled.span`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  font-family: 'Cinzel', serif;
  letter-spacing: 0.5px;
`;

const SpellcastingInfo = styled.div`
  background: rgba(139, 105, 20, 0.1);
  padding: 12px 15px;
  border-radius: 8px;
  border-left: 4px solid #8b6914;
  margin-bottom: 15px;

  .label {
    color: #8b6914;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Cinzel', serif;
    margin-bottom: 5px;
    display: block;
  }

  .content {
    color: #2c1810;
    font-weight: 600;
    line-height: 1.4;
    text-transform: capitalize;
  }
`;

const ClassSource = styled.div`
  margin-top: auto;
  padding: 12px 16px;
  font-size: 0.8rem;
  color: #6d5411;
  font-style: italic;
  text-align: center;
  background: linear-gradient(
    145deg,
    rgba(139, 105, 20, 0.1),
    rgba(139, 105, 20, 0.05)
  );
  border-top: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 0 0 12px 12px;

  strong {
    color: #8b6914;
    font-weight: 600;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.75rem;
    font-family: 'Cinzel', serif;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid rgba(139, 105, 20, 0.2);
`;

const ActionButton = styled.button`
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #2c1810;
  border: none;
  padding: 12px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  font-size: 0.8rem;
  text-align: center;
  line-height: 1.2;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
    background: linear-gradient(145deg, #b8941f, #a0801b);
  }

  &:active {
    transform: translateY(0);
  }

  .icon {
    display: block;
    font-size: 1.2rem;
    margin-bottom: 4px;
  }

  .text {
    display: block;
    font-size: 0.75rem;
  }
`;

export default function ClassCardComponent({
  characterClass,
  onLevelsClick,
  onDetailsClick,
}: ClassCardProps) {
  const getSubclassCount = (): number => {
    if (!characterClass.subclassFeatures) return 0;
    if (
      typeof characterClass.subclassFeatures === 'object' &&
      characterClass.subclassFeatures !== null
    ) {
      return Object.keys(characterClass.subclassFeatures).length;
    }
    return 0;
  };

  const getClassType = (): string => {
    // Determine class type based on spellcasting ability or other characteristics
    if (characterClass.spellcastingAbility) {
      return 'Spellcaster';
    } else if (characterClass.hitDie === 12) {
      return 'Tank';
    } else if (characterClass.hitDie === 6) {
      return 'Scholar';
    } else if (characterClass.hitDie === 8) {
      return 'Versatile';
    } else {
      return 'Warrior';
    }
  };

  return (
    <ClassCard>
      <ClassHeader>
        <ClassName>{characterClass.name}</ClassName>
        <ClassType>{getClassType()}</ClassType>
      </ClassHeader>

      <ClassContent>
        <InfoGrid>
          <InfoBox>
            <span className="label">Subclasses</span>
            <div className="value">{getSubclassCount()}</div>
          </InfoBox>
          <InfoBox>
            <span className="label">Hit Die</span>
            <div className="value">d{characterClass.hitDie}</div>
          </InfoBox>
        </InfoGrid>

        {characterClass.spellcastingAbility && (
          <SpellcastingInfo>
            <span className="label">Spellcasting Ability:</span>
            <div className="content">{characterClass.spellcastingAbility}</div>
          </SpellcastingInfo>
        )}

        <DetailsList>
          <DetailsItem>
            <DetailsLabel>Primary Ability</DetailsLabel>
            <AbilityTags>
              {characterClass.primaryAbility?.map((ability) => (
                <AbilityTag key={ability}>{ability.toUpperCase()}</AbilityTag>
              )) || <AbilityTag>STR</AbilityTag>}
            </AbilityTags>
          </DetailsItem>

          <DetailsItem>
            <DetailsLabel>Saving Throws</DetailsLabel>
            <AbilityTags>
              {characterClass.savingThrowProficiencies?.map((save) => (
                <AbilityTag key={save}>{save.toUpperCase()}</AbilityTag>
              )) || <AbilityTag>NONE</AbilityTag>}
            </AbilityTags>
          </DetailsItem>
        </DetailsList>

        <ActionButtons>
          {onDetailsClick && (
            <ActionButton onClick={onDetailsClick}>
              <span className="icon">📖</span>
              <span className="text">Class Details</span>
            </ActionButton>
          )}
          {onLevelsClick && (
            <ActionButton onClick={onLevelsClick}>
              <span className="icon">🎭</span>
              <span className="text">Subclasses</span>
            </ActionButton>
          )}
        </ActionButtons>

        <ClassSource>
          <strong>Source:</strong> {characterClass.source}
          {characterClass.page && ` p.${characterClass.page}`}
        </ClassSource>
      </ClassContent>
    </ClassCard>
  );
}
