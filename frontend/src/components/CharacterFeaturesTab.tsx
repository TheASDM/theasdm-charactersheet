import React, { useMemo, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { CharacterSheetData } from '../types/characterSheet';
import { generateFeaturesForCharacter, SimpleFeature } from '../utils/simpleFeatureGenerator';
import { addFeatureIds, isFeatureHidden, toggleFeatureVisibility, sortFeaturesByOrder, reorderFeatures } from '../utils/featureId';
import { parseComplexDnDEntry } from '../utils/dndTemplateParser';

const FeaturesTabContainer = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(206, 144, 22, 0.1);
  border-left: 3px solid #ce9016;
  border-radius: 4px;
  margin-bottom: 0.75rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: #ce9016;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SectionCount = styled.span`
  color: #888;
  font-size: 0.85rem;
  margin-left: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SectionButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  color: #888;
  border: 1px solid #333;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: #ce9016;
    color: #ce9016;
  }
`;

const FeatureRow = styled.div<{ $isHidden: boolean; $isDragging?: boolean }>`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background: ${({ $isHidden }) =>
    $isHidden ? 'rgba(26, 26, 26, 0.4)' : 'rgba(26, 26, 26, 0.8)'};
  border: 1px solid ${({ $isHidden }) =>
    $isHidden ? 'rgba(51, 51, 51, 0.5)' : '#333'};
  border-radius: 6px;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
  opacity: ${({ $isHidden, $isDragging }) => {
    if ($isDragging) return '0.5';
    return $isHidden ? '0.6' : '1';
  }};
  cursor: ${({ $isDragging }) => $isDragging ? 'grabbing' : 'default'};

  &:hover {
    border-color: ${({ $isHidden }) =>
      $isHidden ? 'rgba(206, 144, 22, 0.3)' : 'rgba(206, 144, 22, 0.5)'};
    background: ${({ $isHidden }) =>
      $isHidden ? 'rgba(26, 26, 26, 0.5)' : 'rgba(26, 26, 26, 0.9)'};
  }

  &:hover .drag-handle {
    opacity: 1;
  }
`;

const DragHandle = styled.div`
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
  padding: 0.25rem;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
  user-select: none;
  transition: color 0.2s ease, opacity 0.2s ease;
  opacity: 0;
  z-index: 10;
  pointer-events: auto;

  &:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  &:active {
    cursor: grabbing;
  }
`;

const FeatureInfo = styled.div`
  flex: 1;
  margin-right: 1rem;
`;

const FeatureName = styled.div<{ $isHidden: boolean }>`
  color: ${({ $isHidden }) => $isHidden ? '#666' : '#ce9016'};
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  text-decoration: ${({ $isHidden }) => $isHidden ? 'line-through' : 'none'};
`;

const FeaturePreview = styled.div<{ $isHidden: boolean }>`
  color: ${({ $isHidden }) => $isHidden ? '#555' : '#b0b0b0'};
  font-size: 0.8rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  flex-shrink: 0;
`;

const ToggleSlider = styled.span<{ $checked: boolean }>`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ $checked }) => $checked ? '#4ade80' : '#444'};
  transition: 0.3s;
  border-radius: 26px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: ${({ $checked }) => $checked ? '28px' : '4px'};
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  &:hover {
    background-color: ${({ $checked }) => $checked ? '#22c55e' : '#555'};
  }
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const EmptyMessage = styled.div`
  padding: 2rem;
  text-align: center;
  color: #888;
  font-style: italic;
  background: rgba(26, 26, 26, 0.5);
  border: 1px dashed #333;
  border-radius: 6px;
`;

interface CharacterFeaturesTabProps {
  character: CharacterSheetData;
  onUpdateCharacter: (updates: Partial<CharacterSheetData>) => void;
}

export const CharacterFeaturesTab: React.FC<CharacterFeaturesTabProps> = ({
  character,
  onUpdateCharacter,
}) => {
  const [generatedFeatures, setGeneratedFeatures] = useState<SimpleFeature[]>([]);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);

  // Generate features from character data
  useEffect(() => {
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

  // Add IDs to features
  const featuresWithIds = useMemo(() => {
    return addFeatureIds(generatedFeatures);
  }, [generatedFeatures]);

  // Group features by category and apply custom ordering
  const featuresByCategory = useMemo(() => {
    const groups: Record<string, Array<SimpleFeature & { id: string }>> = {
      'Class Features': [],
      'Species Traits': [],
      'Background Features': [],
      'Feats': [],
    };

    featuresWithIds.forEach(feature => {
      if (feature.category.includes('Class')) {
        groups['Class Features'].push(feature);
      } else if (feature.category.includes('Subclass')) {
        groups['Class Features'].push(feature);
      } else if (feature.category.includes('Species')) {
        groups['Species Traits'].push(feature);
      } else if (feature.category.includes('Background')) {
        groups['Background Features'].push(feature);
      } else if (feature.category.includes('Feat')) {
        groups['Feats'].push(feature);
      }
    });

    // Apply custom ordering to each category
    Object.keys(groups).forEach(categoryName => {
      groups[categoryName] = sortFeaturesByOrder(groups[categoryName], character.featureOrder);
    });

    return groups;
  }, [featuresWithIds, character.featureOrder]);

  // Debounced save to avoid API spam
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback((updates: Partial<CharacterSheetData>) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      onUpdateCharacter(updates);
    }, 500);

    setSaveTimeout(timeout);
  }, [saveTimeout, onUpdateCharacter]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Toggle individual feature
  const handleToggleFeature = useCallback((featureId: string) => {
    const newHiddenFeatures = toggleFeatureVisibility(featureId, character.hiddenFeatures);

    // Optimistic update
    onUpdateCharacter({ hiddenFeatures: newHiddenFeatures });
  }, [character.hiddenFeatures, onUpdateCharacter]);

  // Show all features in a category
  const handleShowAll = useCallback((categoryName: string) => {
    const categoryFeatures = featuresByCategory[categoryName] || [];
    const categoryIds = categoryFeatures.map(f => f.id);
    const newHiddenFeatures = (character.hiddenFeatures || []).filter(
      id => !categoryIds.includes(id)
    );

    debouncedSave({ hiddenFeatures: newHiddenFeatures });
  }, [featuresByCategory, character.hiddenFeatures, debouncedSave]);

  // Hide all features in a category
  const handleHideAll = useCallback((categoryName: string) => {
    const categoryFeatures = featuresByCategory[categoryName] || [];
    const categoryIds = categoryFeatures.map(f => f.id);
    const currentHidden = character.hiddenFeatures || [];
    const newHiddenFeatures = [
      ...currentHidden,
      ...categoryIds.filter(id => !currentHidden.includes(id))
    ];

    debouncedSave({ hiddenFeatures: newHiddenFeatures });
  }, [featuresByCategory, character.hiddenFeatures, debouncedSave]);

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number, categoryName: string) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    setDraggedCategory(categoryName);
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

  const handleDrop = useCallback((toIndex: number, categoryName: string) => (e: React.DragEvent) => {
    e.preventDefault();

    if (
      draggedIndex !== null &&
      draggedIndex !== toIndex &&
      draggedCategory === categoryName
    ) {
      const categoryFeatures = featuresByCategory[categoryName] || [];
      const allFeatureIds = featuresWithIds.map(f => f.id);

      // Get current order or create new one
      const currentOrder = character.featureOrder || allFeatureIds;

      // Reorder the features
      const categoryIds = categoryFeatures.map(f => f.id);
      const reorderedCategoryIds = reorderFeatures(categoryIds, draggedIndex, toIndex);

      // Build new complete order by replacing the category's portion
      const newOrder = currentOrder.filter(id => !categoryIds.includes(id));

      // Insert reordered category IDs in the right place
      const firstCategoryFeature = categoryFeatures[0];
      const insertIndex = currentOrder.indexOf(firstCategoryFeature.id);
      newOrder.splice(insertIndex, 0, ...reorderedCategoryIds);

      onUpdateCharacter({ featureOrder: newOrder });
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggedCategory(null);
  }, [draggedIndex, draggedCategory, featuresByCategory, featuresWithIds, character.featureOrder, onUpdateCharacter]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggedCategory(null);
  }, []);

  // Truncate description for preview
  const truncateDescription = (description: string, maxLength: number = 100): string => {
    const parsed = parseComplexDnDEntry(description);
    const text = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);

    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Count visible vs total for each category
  const getCategoryCounts = (categoryName: string) => {
    const features = featuresByCategory[categoryName] || [];
    const hidden = features.filter(f => isFeatureHidden(f.id, character.hiddenFeatures)).length;
    const visible = features.length - hidden;
    return { visible, total: features.length, hidden };
  };

  return (
    <FeaturesTabContainer>
      {Object.entries(featuresByCategory).map(([categoryName, features]) => {
        if (features.length === 0) return null;

        const counts = getCategoryCounts(categoryName);

        return (
          <SectionContainer key={categoryName}>
            <SectionHeader>
              <SectionTitle>
                {categoryName}
                <SectionCount>
                  ({counts.visible} visible, {counts.hidden} hidden)
                </SectionCount>
              </SectionTitle>
              <ButtonGroup>
                <SectionButton onClick={() => handleShowAll(categoryName)}>
                  Show All
                </SectionButton>
                <SectionButton onClick={() => handleHideAll(categoryName)}>
                  Hide All
                </SectionButton>
              </ButtonGroup>
            </SectionHeader>

            {features.map((feature, index) => {
              const hidden = isFeatureHidden(feature.id, character.hiddenFeatures);
              const isDragging = draggedIndex === index && draggedCategory === categoryName;
              const isDragOver = dragOverIndex === index && draggedCategory === categoryName;

              return (
                <FeatureRow
                  key={feature.id}
                  $isHidden={hidden}
                  $isDragging={isDragging}
                  draggable
                  onDragStart={handleDragStart(index, categoryName)}
                  onDragOver={handleDragOver(index)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop(index, categoryName)}
                  onDragEnd={handleDragEnd}
                  style={{
                    borderTop: isDragOver && !isDragging ? '2px solid #ce9016' : undefined,
                  }}
                >
                  <DragHandle className="drag-handle">⋮⋮</DragHandle>
                  <FeatureInfo>
                    <FeatureName $isHidden={hidden}>
                      {feature.name}
                    </FeatureName>
                    <FeaturePreview $isHidden={hidden}>
                      {truncateDescription(feature.description)}
                    </FeaturePreview>
                  </FeatureInfo>
                  <ToggleSwitch>
                    <ToggleInput
                      type="checkbox"
                      checked={!hidden}
                      onChange={() => handleToggleFeature(feature.id)}
                    />
                    <ToggleSlider $checked={!hidden} />
                  </ToggleSwitch>
                </FeatureRow>
              );
            })}
          </SectionContainer>
        );
      })}

      {featuresWithIds.length === 0 && (
        <EmptyMessage>
          No features found for this character.
        </EmptyMessage>
      )}
    </FeaturesTabContainer>
  );
};

export default CharacterFeaturesTab;
