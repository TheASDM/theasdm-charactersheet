import React, { useState } from 'react';
import { CharacterSheetData } from '../types/characterSheet';
import {
  TraitsSection,
  TraitsTitle,
  ProficienciesCard,
  ProficienciesContent,
  EmptyTraitsMessage,
} from '../styles/components';
import { generateFeaturesForCharacter, SimpleFeature } from '../utils/simpleFeatureGenerator';

interface CharacterProficienciesSectionProps {
  character: CharacterSheetData;
}

export const CharacterProficienciesSection: React.FC<CharacterProficienciesSectionProps> = ({
  character,
}) => {
  const [proficienciesFeature, setProficienciesFeature] = useState<SimpleFeature | null>(null);

  // Generate features and extract proficiencies - now async!
  React.useEffect(() => {
    let cancelled = false;

    generateFeaturesForCharacter(character).then((features) => {
      if (!cancelled) {
        const prof = features.find((feature: SimpleFeature) => feature.category === 'Proficiencies') || null;
        setProficienciesFeature(prof);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [character]);

  return (
    <TraitsSection>
      <TraitsTitle>Proficiencies</TraitsTitle>

      {proficienciesFeature ? (
        <ProficienciesCard $isLastCard={true} $totalCards={1}>
          <ProficienciesContent
            dangerouslySetInnerHTML={{ __html: proficienciesFeature.description }}
          />
        </ProficienciesCard>
      ) : (
        <EmptyTraitsMessage>
          No proficiencies available.
        </EmptyTraitsMessage>
      )}
    </TraitsSection>
  );
};
