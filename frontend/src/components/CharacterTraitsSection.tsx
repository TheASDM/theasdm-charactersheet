import React, { useMemo, useState } from 'react';
import { CharacterSheetData } from '../types/characterSheet';
import {
  TraitsSection,
  TraitsTitle,
  SectionEditButton,
  TraitsGrid,
  TraitCard,
  TraitName,
  TraitDescription,
  TraitCategory,
  EmptyTraitsMessage,
} from '../styles/components';
import { generateFeaturesForCharacter, SimpleFeature } from '../utils/simpleFeatureGenerator';
import WeaponMasteryModal from './WeaponMasteryModal';
import styled from 'styled-components';

const FeatureButton = styled.button`
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #1a1a2e;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(145deg, #f4d469, #d4af37);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }
`;

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

interface CharacterTraitsSectionProps {
  character: CharacterSheetData;
  traits: {
    handleManageTraits: () => void;
  };
  onUpdateCharacter?: (updates: Partial<CharacterSheetData>) => void;
}

export const CharacterTraitsSection: React.FC<CharacterTraitsSectionProps> = ({
  character,
  traits,
  onUpdateCharacter,
}) => {
  const [isWeaponMasteryModalOpen, setIsWeaponMasteryModalOpen] = useState(false);
  const [generatedFeatures, setGeneratedFeatures] = useState<SimpleFeature[]>([]);

  // Generate features directly from character data - now async to support choice system!
  React.useEffect(() => {
    let cancelled = false;

    generateFeaturesForCharacter(character).then((features) => {
      if (!cancelled) {
        setGeneratedFeatures(features);
      }
    });

    return () => {
      cancelled = true;
    };
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

  // Filter out proficiencies - they're displayed in a separate section now
  const regularFeatures = useMemo(() => {
    return allFeatures.filter((feature: SimpleFeature) => feature.category !== 'Proficiencies');
  }, [allFeatures]);

  // Determine max masteries and restrictions based on class
  const getMasteryConfig = () => {
    const characterClass = character.class?.toLowerCase() || '';

    if (characterClass.includes('fighter')) {
      return { max: 3, restriction: null };
    } else if (characterClass.includes('barbarian')) {
      return { max: 2, restriction: 'melee' as const };
    } else if (characterClass.includes('rogue')) {
      return { max: 2, restriction: 'finesse' as const };
    } else if (characterClass.includes('paladin') || characterClass.includes('ranger')) {
      return { max: 2, restriction: null };
    }
    return { max: 0, restriction: null };
  };

  const masteryConfig = getMasteryConfig();

  const handleWeaponMasteryConfirm = (masteries: Array<{ weapon: string; property: string }>) => {
    if (onUpdateCharacter) {
      onUpdateCharacter({
        weaponMasteries: {
          available: masteryConfig.max,
          active: masteries
        }
      });
    }
    setIsWeaponMasteryModalOpen(false);
  };

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

      {/* Render features (proficiencies are now in a separate section) */}
      {regularFeatures.length > 0 ? (
        <TraitsGrid>
          {regularFeatures.map((feature, index) => (
            <TraitCard key={`feature-${index}`}>
              <TraitName>{feature.name}</TraitName>
              <TraitDescription>
                {feature.description.split('\n\n').map((section: string, sectionIndex: number) => (
                  <div key={sectionIndex} style={{ marginBottom: sectionIndex < feature.description.split('\n\n').length - 1 ? '0.5rem' : 0 }}>
                    {renderMarkdownText(section)}
                  </div>
                ))}
              </TraitDescription>
              {feature.category && !feature.category.includes('Legacy') && (
                <TraitCategory>
                  {feature.category}
                </TraitCategory>
              )}
              {/* Add button for Weapon Mastery feature */}
              {feature.name === 'Weapon Mastery' && masteryConfig.max > 0 && onUpdateCharacter && (
                <FeatureButton onClick={() => setIsWeaponMasteryModalOpen(true)}>
                  ⚔️ Manage Weapon Masteries
                </FeatureButton>
              )}
            </TraitCard>
          ))}
        </TraitsGrid>
      ) : (
        <EmptyTraitsMessage>
          No features or traits available. Add them through the 🌟 button above.
        </EmptyTraitsMessage>
      )}

      {/* Weapon Mastery Modal */}
      {masteryConfig.max > 0 && (
        <WeaponMasteryModal
          isOpen={isWeaponMasteryModalOpen}
          maxMasteries={masteryConfig.max}
          currentMasteries={character.weaponMasteries?.active || []}
          onConfirm={handleWeaponMasteryConfirm}
          onCancel={() => setIsWeaponMasteryModalOpen(false)}
          classRestrictions={masteryConfig.restriction}
        />
      )}
    </TraitsSection>
  );
};