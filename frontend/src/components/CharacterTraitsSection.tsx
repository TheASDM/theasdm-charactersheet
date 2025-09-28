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
      (character.classFeatures && character.classFeatures.length > 0) ||
      (character.feats && character.feats.length > 0) ? (
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
            character.classFeatures.map((feature: string, index: number) => {
              // Try to parse feature as "Name: Description" format
              const colonIndex = feature.indexOf(':');
              const hasDescription =
                colonIndex > 0 && colonIndex < feature.length - 1;

              return (
                <TraitCard key={`class-${index}`}>
                  {hasDescription ? (
                    <>
                      <TraitName>
                        {feature.substring(0, colonIndex).trim()}
                      </TraitName>
                      <TraitDescription>
                        {feature.substring(colonIndex + 1).trim()}
                      </TraitDescription>
                    </>
                  ) : (
                    <>
                      <TraitName>{feature}</TraitName>
                      <TraitDescription>
                        Level 1 {character.class} feature
                      </TraitDescription>
                    </>
                  )}
                </TraitCard>
              );
            })}

          {/* Render Feats */}
          {character.feats &&
            character.feats.map((feat: string, index: number) => {
              // Try to parse feat as "Name: Description" format
              const colonIndex = feat.indexOf(':');
              const hasDescription =
                colonIndex > 0 && colonIndex < feat.length - 1;

              return (
                <TraitCard key={`feat-${index}`}>
                  {hasDescription ? (
                    <>
                      <TraitName>
                        {feat.substring(0, colonIndex).trim()}
                      </TraitName>
                      <TraitDescription>
                        {feat.substring(colonIndex + 1).trim()}
                      </TraitDescription>
                    </>
                  ) : (
                    <>
                      <TraitName>{feat}</TraitName>
                      <TraitDescription>
                        Feat
                      </TraitDescription>
                    </>
                  )}
                </TraitCard>
              );
            })}
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