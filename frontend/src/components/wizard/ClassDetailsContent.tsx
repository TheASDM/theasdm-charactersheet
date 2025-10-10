import React from 'react';
import styled from 'styled-components';

interface ClassDetailsContentProps {
  classData: {
    name: string;
    description?: string;
    hitDie: number;
    primaryAbility: string | string[];
    savingThrows?: string;
    savingThrowProficiencies?: string[];
    features?: string[];
    classFeatures?: Record<string, any>;
    proficiencies?: {
      armor?: string;
      weapons?: string;
      tools?: string;
      savingThrows?: string;
      skills?: string;
    };
  };
}

const DetailsContainer = styled.div`
  color: #e0d9c6;
  line-height: 1.6;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  color: #e0a523;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(206, 144, 22, 0.3);
  padding-bottom: 0.5rem;
`;

const Description = styled.p`
  color: #c0aa70;
  font-size: 1rem;
  margin-bottom: 1rem;
  font-style: italic;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  margin-bottom: 1rem;
`;

const StatLabel = styled.div`
  color: #e0a523;
  font-weight: 600;
`;

const StatValue = styled.div`
  color: #e0d9c6;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  padding: 0.5rem;
  background: rgba(206, 144, 22, 0.1);
  border-left: 3px solid #ce9016;
  margin-bottom: 0.5rem;
  border-radius: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ClassDetailsContent: React.FC<ClassDetailsContentProps> = ({ classData }) => {
  const {
    description,
    hitDie,
    primaryAbility,
    savingThrows,
    savingThrowProficiencies,
    features,
    classFeatures,
    proficiencies,
  } = classData;

  const formatSavingThrows = () => {
    if (savingThrows) return savingThrows;
    if (savingThrowProficiencies) {
      return savingThrowProficiencies
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(', ');
    }
    return 'N/A';
  };

  const formatPrimaryAbility = () => {
    if (Array.isArray(primaryAbility)) {
      return primaryAbility.map(a => a.toUpperCase()).join(', ');
    }
    return primaryAbility;
  };

  const getLevel1Features = () => {
    if (features) return features;
    if (classFeatures && classFeatures['1']) {
      return classFeatures['1'].map((f: any) => f.name);
    }
    return [];
  };

  return (
    <DetailsContainer>
      {description && <Description>{description}</Description>}

      <Section>
        <SectionTitle>Basic Information</SectionTitle>
        <StatGrid>
          <StatLabel>Hit Die:</StatLabel>
          <StatValue>d{hitDie}</StatValue>

          <StatLabel>Primary Ability:</StatLabel>
          <StatValue>{formatPrimaryAbility()}</StatValue>

          <StatLabel>Saving Throws:</StatLabel>
          <StatValue>{formatSavingThrows()}</StatValue>
        </StatGrid>
      </Section>

      {proficiencies && (
        <Section>
          <SectionTitle>Proficiencies</SectionTitle>
          <StatGrid>
            {proficiencies.armor && (
              <>
                <StatLabel>Armor:</StatLabel>
                <StatValue>{proficiencies.armor}</StatValue>
              </>
            )}
            {proficiencies.weapons && (
              <>
                <StatLabel>Weapons:</StatLabel>
                <StatValue>{proficiencies.weapons}</StatValue>
              </>
            )}
            {proficiencies.tools && (
              <>
                <StatLabel>Tools:</StatLabel>
                <StatValue>{proficiencies.tools}</StatValue>
              </>
            )}
            {proficiencies.skills && (
              <>
                <StatLabel>Skills:</StatLabel>
                <StatValue>{proficiencies.skills}</StatValue>
              </>
            )}
          </StatGrid>
        </Section>
      )}

      {getLevel1Features().length > 0 && (
        <Section>
          <SectionTitle>Level 1 Features</SectionTitle>
          <FeatureList>
            {getLevel1Features().map((feature: string, index: number) => (
              <FeatureItem key={index}>{feature}</FeatureItem>
            ))}
          </FeatureList>
        </Section>
      )}
    </DetailsContainer>
  );
};
