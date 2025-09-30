import React, { useMemo } from 'react';
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
  ProficienciesCard,
  ProficienciesTitle,
  ProficienciesContent,
} from '../styles/components';
import { generateFeaturesForCharacter, SimpleFeature } from '../utils/simpleFeatureGenerator';

// Helper function to render markdown-style bold text
const renderMarkdownText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

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
  // Generate features directly from character data - no complex templates!
  const generatedFeatures = useMemo(() => {
    return generateFeaturesForCharacter(character);
  }, [character]);

  // Check which categories have generated features
  const hasGeneratedSpeciesFeatures = generatedFeatures.some(f => f.category === 'Species Trait');
  const hasGeneratedClassFeatures = generatedFeatures.some(f => f.category === 'Class Feature');
  const hasGeneratedFeatFeatures = generatedFeatures.some(f => f.category === 'Feat');

  // Only include legacy features if we don't have generated features for that category
  const legacyFeatures: SimpleFeature[] = useMemo(() => {
    const features: SimpleFeature[] = [];

    // Only add legacy species traits if we don't have generated ones
    if (!hasGeneratedSpeciesFeatures && character.speciesTraits) {
      character.speciesTraits.forEach((trait: string) => {
        const colonIndex = trait.indexOf(':');
        const hasName = colonIndex > 0 && colonIndex < trait.length - 1;

        features.push({
          name: hasName ? trait.substring(0, colonIndex).trim() : `${character.species} Trait`,
          description: hasName ? trait.substring(colonIndex + 1).trim() : trait,
          category: 'Species Trait (Legacy)'
        });
      });
    }

    // Only add legacy class features if we don't have generated ones
    if (!hasGeneratedClassFeatures && character.classFeatures) {
      character.classFeatures.forEach((feature: string) => {
        const colonIndex = feature.indexOf(':');
        const hasDescription = colonIndex > 0 && colonIndex < feature.length - 1;

        features.push({
          name: hasDescription ? feature.substring(0, colonIndex).trim() : feature,
          description: hasDescription ? feature.substring(colonIndex + 1).trim() : `Level 1 ${character.class} feature`,
          category: 'Class Feature (Legacy)'
        });
      });
    }

    // Only add legacy feats if we don't have generated ones
    if (!hasGeneratedFeatFeatures && character.feats) {
      character.feats.forEach((feat: string) => {
        const colonIndex = feat.indexOf(':');
        const hasDescription = colonIndex > 0 && colonIndex < feat.length - 1;

        features.push({
          name: hasDescription ? feat.substring(0, colonIndex).trim() : feat,
          description: hasDescription ? feat.substring(colonIndex + 1).trim() : 'Feat',
          category: 'Feat (Legacy)'
        });
      });
    }

    return features;
  }, [character, hasGeneratedSpeciesFeatures, hasGeneratedClassFeatures, hasGeneratedFeatFeatures]);

  const allFeatures = [...generatedFeatures, ...legacyFeatures];

  // Separate proficiencies from other features
  const { regularFeatures, proficienciesFeature } = useMemo(() => {
    const regular: SimpleFeature[] = [];
    let proficiencies: SimpleFeature | null = null;

    allFeatures.forEach((feature: SimpleFeature) => {
      if (feature.category === 'Proficiencies') {
        proficiencies = feature;
      } else {
        regular.push(feature);
      }
    });

    return {
      regularFeatures: regular,
      proficienciesFeature: proficiencies
    };
  }, [allFeatures]);

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

      {/* Render features with special handling for proficiencies */}
      {(regularFeatures.length > 0 || proficienciesFeature) ? (
        <TraitsGrid>
          {/* Render regular features first */}
          {regularFeatures.map((feature, index) => (
            <TraitCard key={`feature-${index}`}>
              <TraitName>{feature.name}</TraitName>
              <TraitDescription>{feature.description}</TraitDescription>
              {feature.category && !feature.category.includes('Legacy') && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#d4af37',
                  fontStyle: 'italic'
                }}>
                  {feature.category}
                </div>
              )}
            </TraitCard>
          ))}

          {/* Render proficiencies feature last with special styling */}
          {proficienciesFeature && (
            <ProficienciesCard
              $isLastCard={true}
              $totalCards={regularFeatures.length + 1}
            >
              <ProficienciesTitle>{(proficienciesFeature as SimpleFeature).name}</ProficienciesTitle>
              <ProficienciesContent>
                {(proficienciesFeature as SimpleFeature).description.split('\n\n').map((section: string, index: number) => (
                  <div key={index} style={{ marginBottom: '0.3rem' }}>
                    {renderMarkdownText(section)}
                  </div>
                ))}
              </ProficienciesContent>
            </ProficienciesCard>
          )}
        </TraitsGrid>
      ) : (
        <EmptyTraitsMessage>
          No features or traits available. Add them through the 🌟 button above.
        </EmptyTraitsMessage>
      )}
    </TraitsSection>
  );
};