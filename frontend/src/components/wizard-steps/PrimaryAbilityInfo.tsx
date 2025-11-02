import React, { useEffect } from 'react';
import styled from 'styled-components';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { useApiCall } from '@/hooks/useApiCall';
import { listClasses } from '@/services/classService';

interface PrimaryAbilityInfoProps {
  data: CharacterBuilderData;
}

const PrimaryAbilitiesBox = styled.div`
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(26, 26, 26, 0.8) 100%);
  border: 2px solid rgba(76, 175, 80, 0.4);
  border-radius: 10px;
  padding: 1.25rem;
  margin: 1.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  h4 {
    color: #6aa84f;
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &::before {
      content: '⚔️';
      font-size: 1.2rem;
    }
  }

  p {
    color: #c0aa70;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.6;

    strong {
      color: #6aa84f;
      font-weight: 600;
    }
  }
`;

export const PrimaryAbilityInfo: React.FC<PrimaryAbilityInfoProps> = ({ data }) => {
  // Fetch class data from API
  const {
    data: fetchedClasses,
    execute: fetchClasses,
  } = useApiCall(listClasses);

  useEffect(() => {
    if (data.selectedClass && !fetchedClasses) {
      fetchClasses();
    }
  }, [data.selectedClass, fetchedClasses, fetchClasses]);

  // Don't show if no class is selected
  if (!data.selectedClass) {
    return null;
  }

  const apiClasses = fetchedClasses ?? [];

  // Find the actual class data from API
  const apiClass = apiClasses.find((c: any) => c.name === data.selectedClass || c.className === data.selectedClass);
  const primaryAbilities = apiClass?.primaryAbilities || [];
  const primaryAbilityText = primaryAbilities.length > 0
    ? primaryAbilities.join(' or ')
    : 'Various';

  return (
    <PrimaryAbilitiesBox>
      <h4>Primary {primaryAbilities.length > 1 ? 'Abilities' : 'Ability'}</h4>
      <p>
        Your <strong>{data.selectedClass}</strong> primarily uses <strong>{primaryAbilityText}</strong> for class features and abilities.
        Focus on {primaryAbilities.length > 1 ? 'these ability scores' : 'this ability score'} during character creation for optimal effectiveness.
      </p>
    </PrimaryAbilitiesBox>
  );
};
