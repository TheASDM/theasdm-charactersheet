import React from 'react';
import { CharacterSheetData } from '../types/characterSheet';
import {
  TraitsSection,
  TraitsTitle,
  SectionEditButton,
  TraitsGrid,
  TraitCard,
  TraitName,
  TraitDescription,
  EmptyTraitsMessage,
} from '../styles/components';

interface CharacterTraitsSectionProps {
  character: CharacterSheetData;
  traits: {
    handleManageTraits: () => void;
  };
}

export const CharacterTraitsSection: React.FC<CharacterTraitsSectionProps> = ({
  character,
  traits,
}) => {
  return (
    <TraitsSection>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <TraitsTitle
          style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}
        >
          Features & Traits
        </TraitsTitle>
        <SectionEditButton
          onClick={traits.handleManageTraits}
          style={{
            background: 'linear-gradient(145deg, #8a2be2, #7b1fa2)',
          }}
        >
          🌟
        </SectionEditButton>
      </div>
      {(character.speciesTraits && character.speciesTraits.length > 0) ||
      (character.classFeatures && character.classFeatures.length > 0) ? (
        <TraitsGrid>
          {/* Render Species Traits */}
          {character.speciesTraits &&
            character.speciesTraits.map((trait: string, index: number) => {
              // Try to parse trait as "Name: Description" format
              const colonIndex = trait.indexOf(':');
              const hasName =
                colonIndex > 0 && colonIndex < trait.length - 1;

              return (
                <TraitCard key={`species-${index}`}>
                  {hasName ? (
                    <>
                      <TraitName>
                        {trait.substring(0, colonIndex).trim()}
                      </TraitName>
                      <TraitDescription>
                        {trait.substring(colonIndex + 1).trim()}
                      </TraitDescription>
                    </>
                  ) : (
                    <>
                      <TraitName>{character.species} Trait</TraitName>
                      <TraitDescription>{trait}</TraitDescription>
                    </>
                  )}
                </TraitCard>
              );
            })}

          {/* Render Class Features */}
          {character.classFeatures &&
            character.classFeatures.map((feature: string, index: number) => (
              <TraitCard key={`class-${index}`}>
                <TraitName>{feature}</TraitName>
                <TraitDescription>
                  Level 1 {character.class} feature
                </TraitDescription>
              </TraitCard>
            ))}
        </TraitsGrid>
      ) : (
        <EmptyTraitsMessage>
          No features or traits yet. Choose a species and class to see your
          abilities!
        </EmptyTraitsMessage>
      )}
    </TraitsSection>
  );
};