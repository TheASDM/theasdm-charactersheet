import React, { useMemo, useState, useCallback } from 'react';
import { CharacterSheetData, InventoryItem } from '../types/characterSheet';
import {
  TraitsSection,
  TraitsTitle,
  TraitsGrid,
  TraitCard,
  TraitName,
  TraitDescription,
  TraitCategory,
  EmptyTraitsMessage,
} from '../styles/components';
import { generateFeaturesForCharacter, SimpleFeature } from '../utils/simpleFeatureGenerator';
import WeaponMasteryModal from './WeaponMasteryModal';
import { FeatureDetailModal } from './FeatureDetailModal';
import styled from 'styled-components';
import { addFeatureIds, isFeatureHidden, sortFeaturesByOrder, reorderFeatures } from '../utils/featureId';

const FeatureButton = styled.button`
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(145deg, #ce9016, #b8860b);
  color: #1a1a2e;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(145deg, #e0a523, #ce9016);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.3);
  }
`;

const FeatureCount = styled.span`
  color: #888;
  font-size: 0.8rem;
  font-weight: 400;
  margin-left: 0.5rem;
  font-style: italic;
`;

const DragHandle = styled.div`
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  cursor: grab;
  padding: 0.25rem;
  color: rgba(255, 255, 255, 0.2);
  font-size: 0.8rem;
  user-select: none;
  transition: color 0.2s ease, opacity 0.2s ease;
  opacity: 0;
  z-index: 10;

  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }

  &:active {
    cursor: grabbing;
  }
`;

const DraggableTraitCard = styled(TraitCard)<{ $isDragging?: boolean }>`
  position: relative;
  padding-left: 2rem;
  cursor: ${({ $isDragging }) => $isDragging ? 'grabbing' : 'default'};
  opacity: ${({ $isDragging }) => $isDragging ? 0.5 : 1};

  &:hover .drag-handle {
    opacity: 1;
  }
`;

interface CharacterTraitsSectionProps {
  character: CharacterSheetData;
  traits: {
    handleManageTraits: () => void;
  };
  onUpdateCharacter?: (updates: Partial<CharacterSheetData>) => void;
  onSpellcastingFeatureExtracted?: (feature: SimpleFeature | null) => void;
}

export const CharacterTraitsSection: React.FC<CharacterTraitsSectionProps> = ({
  character,
  onUpdateCharacter,
  onSpellcastingFeatureExtracted,
}) => {
  const [isWeaponMasteryModalOpen, setIsWeaponMasteryModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<SimpleFeature | null>(null);
  const [generatedFeatures, setGeneratedFeatures] = useState<SimpleFeature[]>([]);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // Add IDs to features for hidden feature tracking
  const featuresWithIds = useMemo(() => {
    return addFeatureIds(allFeatures);
  }, [allFeatures]);

  // Extract spellcasting feature and pass it up to parent
  const spellcastingFeature = useMemo(() => {
    return allFeatures.find((feature: SimpleFeature) =>
      feature.name === 'Spellcasting' || feature.name === 'Pact Magic'
    ) || null;
  }, [allFeatures]);

  // Notify parent component about spellcasting feature
  React.useEffect(() => {
    if (onSpellcastingFeatureExtracted) {
      onSpellcastingFeatureExtracted(spellcastingFeature);
    }
  }, [spellcastingFeature, onSpellcastingFeatureExtracted]);

  // Filter out proficiencies AND spellcasting features - they're displayed in separate sections now
  // Also filter out hidden features and apply custom ordering
  const regularFeatures = useMemo(() => {
    const filtered = featuresWithIds.filter((feature) =>
      feature.category !== 'Proficiencies' &&
      feature.name !== 'Spellcasting' &&
      feature.name !== 'Pact Magic' &&
      !isFeatureHidden(feature.id, character.hiddenFeatures)
    );
    return sortFeaturesByOrder(filtered, character.featureOrder);
  }, [featuresWithIds, character.hiddenFeatures, character.featureOrder]);

  // Calculate total count (before hiding)
  const totalFeatureCount = useMemo(() => {
    return featuresWithIds.filter((feature) =>
      feature.category !== 'Proficiencies' &&
      feature.name !== 'Spellcasting' &&
      feature.name !== 'Pact Magic'
    ).length;
  }, [featuresWithIds]);

  // Count of hidden features
  const hiddenCount = totalFeatureCount - regularFeatures.length;

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

  const ownedWeaponNames = useMemo(() => {
    if (!Array.isArray(character.inventory)) return [] as string[];
    return character.inventory
      .map((item: InventoryItem) => item?.name?.trim())
      .filter((name): name is string => Boolean(name));
  }, [character.inventory]);

  const handleWeaponMasteryConfirm = (masteries: Array<{ weapon: string; property: string }>) => {
    if (onUpdateCharacter) {
      onUpdateCharacter({
        weaponMasteries: {
          max: masteryConfig.max,
          active: masteries
        }
      });
    }
    setIsWeaponMasteryModalOpen(false);
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== toIndex && onUpdateCharacter) {
      const allFeatureIds = featuresWithIds.map(f => f.id);
      const visibleIds = regularFeatures.map(f => f.id);

      // Get current order or create new one
      const currentOrder = character.featureOrder || allFeatureIds;

      // Reorder only the visible features
      const reorderedVisibleIds = reorderFeatures(visibleIds, draggedIndex, toIndex);

      // Build new complete order by preserving hidden/filtered feature positions
      const newOrder = currentOrder.filter(id => !visibleIds.includes(id));

      // Find where to insert the reordered visible features
      const firstVisibleFeature = regularFeatures[0];
      const insertIndex = currentOrder.indexOf(firstVisibleFeature.id);
      newOrder.splice(insertIndex, 0, ...reorderedVisibleIds);

      onUpdateCharacter({ featureOrder: newOrder });
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, featuresWithIds, regularFeatures, character.featureOrder, onUpdateCharacter]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

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
          {hiddenCount > 0 && (
            <FeatureCount>
              Showing {regularFeatures.length} of {totalFeatureCount} features
            </FeatureCount>
          )}
        </TraitsTitle>
      </div>

      {/* Render features (proficiencies are now in a separate section) */}
      {regularFeatures.length > 0 ? (
        <TraitsGrid>
          {regularFeatures.map((feature, index) => {
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <DraggableTraitCard
                key={feature.id}
                $isDragging={isDragging}
                draggable
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop(index)}
                onDragEnd={handleDragEnd}
                style={{
                  borderTop: isDragOver && !isDragging ? '2px solid #ce9016' : undefined,
                }}
              >
                <DragHandle className="drag-handle">⋮⋮</DragHandle>
                <TraitName
                  $clickable
                  onClick={() => setSelectedFeature(feature)}
                >
                  {feature.name}
                </TraitName>
                <TraitDescription
                  dangerouslySetInnerHTML={{ __html: feature.description }}
                />
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
              </DraggableTraitCard>
            );
          })}
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
          ownedWeapons={ownedWeaponNames}
        />
      )}

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        isOpen={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
      />
    </TraitsSection>
  );
};
