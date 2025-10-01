import React, { useMemo } from 'react';
import { CharacterSheetData } from '../types/characterSheet';
import {
  TraitsSection,
  TraitsTitle,
  ProficienciesCard,
  ProficienciesTitle,
  ProficienciesContent,
  EmptyTraitsMessage,
} from '../styles/components';
import { generateFeaturesForCharacter, SimpleFeature } from '../utils/simpleFeatureGenerator';

// Helper function to render markdown-style text with bold and italic
const renderMarkdownText = (text: string) => {
  // First split by bold (**text**), then handle italic in the remaining parts
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    // Handle bold
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} style={{ color: '#f4d469', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    // Handle italic in non-bold parts
    const italicParts = part.split(/(\*.*?\*)/g);
    return italicParts.map((italicPart, italicIndex) => {
      if (italicPart.startsWith('*') && italicPart.endsWith('*') && italicPart.length > 2) {
        return <em key={`${index}-${italicIndex}`} style={{ color: '#aaa', fontStyle: 'italic' }}>{italicPart.slice(1, -1)}</em>;
      }
      return <span key={`${index}-${italicIndex}`}>{italicPart}</span>;
    });
  });
};

interface CharacterProficienciesSectionProps {
  character: CharacterSheetData;
}

export const CharacterProficienciesSection: React.FC<CharacterProficienciesSectionProps> = ({
  character,
}) => {
  // Generate features and extract proficiencies
  const proficienciesFeature = useMemo(() => {
    const features = generateFeaturesForCharacter(character);
    return features.find((feature: SimpleFeature) => feature.category === 'Proficiencies') || null;
  }, [character]);

  return (
    <TraitsSection>
      <TraitsTitle>Proficiencies</TraitsTitle>

      {proficienciesFeature ? (
        <ProficienciesCard $isLastCard={true} $totalCards={1}>
          <ProficienciesContent>
            {proficienciesFeature.description.split('\n\n').map((section: string, index: number) => (
              <div key={index} style={{ marginBottom: '0.3rem' }}>
                {renderMarkdownText(section)}
              </div>
            ))}
          </ProficienciesContent>
        </ProficienciesCard>
      ) : (
        <EmptyTraitsMessage>
          No proficiencies available.
        </EmptyTraitsMessage>
      )}
    </TraitsSection>
  );
};
