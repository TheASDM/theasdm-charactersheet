import { useNavigate } from 'react-router-dom';
import type { MouseEvent } from 'react';
import styled from 'styled-components';
import { CharacterClass } from '../types/api';

interface ClassCardProps {
  characterClass: CharacterClass;
}

const Card = styled.div`
  background: rgba(45, 45, 45, 0.6);
  border: 1px solid #555;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  color: #f0f0f0;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    border-color: #d4af37;
  }
`;

const ClassHeader = styled.div`
  background: rgba(35, 35, 35, 0.9);
  padding: 1rem;
  text-align: center;
  border-bottom: 2px solid #d4af37;
`;

const ClassName = styled.h3`
  color: #d4af37;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.5px;
  font-family: 'Cinzel', serif;
`;

const ClassType = styled.div`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #f0f0f0;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.3);
`;

const CardBody = styled.div`
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.9rem;

  strong {
    color: #d4af37;
    font-weight: 600;
    min-width: 110px;
  }

  span {
    color: #f0f0f0;
  }
`;

const AbilityTags = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const AbilityTag = styled.span`
  background: rgba(212, 175, 55, 0.2);
  color: #d4af37;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid rgba(212, 175, 55, 0.3);
  letter-spacing: 0.3px;
`;

const SourceTag = styled.div`
  background: rgba(212, 175, 55, 0.2);
  color: #d4af37;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-block;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  border: 1px solid rgba(212, 175, 55, 0.3);
  align-self: flex-start;
  margin-top: auto;
`;

const ButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(35, 35, 35, 0.7);
  border-top: 1px solid #444;
`;

const ActionButton = styled.button`
  background: rgba(212, 175, 55, 0.2);
  color: #d4af37;
  border: 1px solid #d4af37;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  font-size: 0.7rem;
  font-family: 'Cinzel', serif;

  &:hover {
    background: rgba(212, 175, 55, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default function ClassCardComponent({
  characterClass,
}: ClassCardProps) {
  const navigate = useNavigate();

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

  const handleFullDetails = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(`/classes/${characterClass.id}/full-details`);
  };

  const handleSubclasses = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(`/classes/${characterClass.id}/subclasses`);
  };

  return (
    <Card>
      <ClassHeader>
        <ClassName>{characterClass.name}</ClassName>
        <ClassType>{getClassType()}</ClassType>
      </ClassHeader>

      <CardBody>
        <InfoRow>
          <strong>Hit Die:</strong>
          <span>d{characterClass.hitDie}</span>
        </InfoRow>

        <InfoRow>
          <strong>Subclasses:</strong>
          <span>{getSubclassCount()}</span>
        </InfoRow>

        <InfoRow>
          <strong>Primary:</strong>
          <AbilityTags>
            {characterClass.primaryAbility?.map((ability) => (
              <AbilityTag key={ability}>{ability.toUpperCase()}</AbilityTag>
            )) || <AbilityTag>STR</AbilityTag>}
          </AbilityTags>
        </InfoRow>

        <InfoRow>
          <strong>Saves:</strong>
          <AbilityTags>
            {characterClass.savingThrowProficiencies?.map((save) => (
              <AbilityTag key={save}>{save.toUpperCase()}</AbilityTag>
            )) || <AbilityTag>NONE</AbilityTag>}
          </AbilityTags>
        </InfoRow>

        {characterClass.spellcastingAbility && (
          <InfoRow>
            <strong>Spellcasting:</strong>
            <span style={{ textTransform: 'capitalize' }}>
              {characterClass.spellcastingAbility}
            </span>
          </InfoRow>
        )}

        {characterClass.source && <SourceTag>{characterClass.source}</SourceTag>}
      </CardBody>

      <ButtonContainer>
        <ActionButton onClick={handleFullDetails}>
          📖 Full Details
        </ActionButton>
        <ActionButton onClick={handleSubclasses}>
          🎭 Subclasses
        </ActionButton>
      </ButtonContainer>
    </Card>
  );
}
