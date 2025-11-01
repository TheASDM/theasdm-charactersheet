import React from 'react';
import styled from 'styled-components';
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';

interface ClassDetailsContentProps {
  classData: {
    name: string;
    description?: string;
    hitDie: number;
    primaryAbility?: string | string[]; // Legacy field
    primaryAbilities?: string[]; // New field from API
    savingThrows?: string | string[]; // Can be string or array
    savingThrowProficiencies?: string[];
    features?: string[];
    classFeatures?: Record<string, any>;
    proficiencies?: {
      armor?: string | string[];
      weapons?: string | string[];
      tools?: string | any[];
      savingThrows?: string | string[];
      skills?: string | any;
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

  const formatProficiency = (value: string | string[] | any[] | any | undefined): string => {
    if (!value) return 'None';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      // Filter out any non-string values and join with commas
      const stringValues = value.filter((v: any) => typeof v === 'string');
      return stringValues.length > 0 ? stringValues.join(', ') : 'None';
    }
    // For objects or other types, try to extract meaningful data
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return 'None';
  };

  const getLevel1Features = () => {
    if (features) return features;
    if (classFeatures && classFeatures['1']) {
      return classFeatures['1']
        .map((f: any) => {
          // Handle different feature structures
          if (typeof f === 'string') return f;
          if (f.name) return f.name;
          if (f.choose) return `Choice: ${f.choose.from?.length || 'Multiple'} options`;
          return null;
        })
        .filter(Boolean); // Remove any null values
    }
    return [];
  };

  return (
    <DetailsContainer>
      {description && <Description>{parseComplexDnDEntry(description)}</Description>}

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
                <StatValue>{formatProficiency(proficiencies.armor)}</StatValue>
              </>
            )}
            {proficiencies.weapons && (
              <>
                <StatLabel>Weapons:</StatLabel>
                <StatValue>{formatProficiency(proficiencies.weapons)}</StatValue>
              </>
            )}
            {proficiencies.tools && (
              <>
                <StatLabel>Tools:</StatLabel>
                <StatValue>{formatProficiency(proficiencies.tools)}</StatValue>
              </>
            )}
            {proficiencies.skills && (
              <>
                <StatLabel>Skills:</StatLabel>
                <StatValue>{formatProficiency(proficiencies.skills)}</StatValue>
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
              <FeatureItem key={index}>{parseComplexDnDEntry(feature)}</FeatureItem>
            ))}
          </FeatureList>
        </Section>
      )}
    </DetailsContainer>
  );
};
