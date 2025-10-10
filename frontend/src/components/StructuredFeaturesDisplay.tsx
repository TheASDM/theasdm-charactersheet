import React, { useState } from 'react';
import styled from 'styled-components';
import {
  CharacterFeature,
  CharacterFeatures,
  FeatureType,
  FeatureSource,
} from '../types/features';
import { renderFeature, RenderedFeature, createCharacterContext } from '../utils/featureTemplateRenderer';

interface StructuredFeaturesDisplayProps {
  features: CharacterFeatures;
  compactMode?: boolean;
  showFilters?: boolean;
  characterData?: any; // Character context for template resolution
}

const FeaturesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  background: ${(props) => (props.$active ? '#ce9016' : 'transparent')};
  color: ${(props) => (props.$active ? '#1a1a1a' : '#ce9016')};
  border: 1px solid #ce9016;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$active ? '#b8860b' : 'rgba(206, 144, 22, 0.1)'};
  }
`;

const FeatureSection = styled.div`
  margin-bottom: 1.5rem;

  .section-header {
    color: #ce9016;
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(206, 144, 22, 0.3);
    padding-bottom: 0.25rem;
  }

  .features-grid {
    display: grid;
    gap: 1rem;
  }
`;

const FeatureCard = styled.div<{ $type: FeatureType }>`
  background: linear-gradient(
    135deg,
    ${(props) => getFeatureTypeColor(props.$type, 0.1)} 0%,
    rgba(26, 26, 26, 0.8) 100%
  );
  border: 1px solid ${(props) => getFeatureTypeColor(props.$type, 0.3)};
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    border-color: ${(props) => getFeatureTypeColor(props.$type, 0.5)};
  }

  .feature-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .feature-name {
    color: ${(props) => getFeatureTypeColor(props.$type, 1)};
    font-weight: 600;
    font-size: 1rem;
    margin: 0;
    font-family: 'Cinzel', serif;
  }

  .feature-badges {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .feature-description {
    color: #ccc;
    font-size: 0.85rem;
    line-height: 1.6;
    margin: 0.75rem 0;
    white-space: pre-line;
    word-wrap: break-word;
  }

  .feature-mechanics {
    display: grid;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .mechanic-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .mechanic-label {
    color: #ce9016;
    font-weight: 500;
  }

  .mechanic-value {
    color: #f0f0f0;
  }
`;

const FeatureBadge = styled.span<{
  $variant: 'type' | 'source' | 'action' | 'resource';
}>`
  background: ${(props) => getBadgeColor(props.$variant)};
  color: #000;
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const CompactFeatureList = styled.div`
  .feature-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid rgba(206, 144, 22, 0.2);

    &:last-child {
      border-bottom: none;
    }
  }

  .feature-name {
    color: #ce9016;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .feature-summary {
    color: #ccc;
    font-size: 0.75rem;
  }
`;

function getFeatureTypeColor(type: FeatureType, alpha: number): string {
  const colors = {
    passive: `rgba(100, 150, 200, ${alpha})`, // Blue
    active: `rgba(220, 100, 100, ${alpha})`, // Red
    reaction: `rgba(200, 150, 50, ${alpha})`, // Gold
    resource: `rgba(150, 100, 200, ${alpha})`, // Purple
    choice: `rgba(100, 200, 150, ${alpha})`, // Green
    conditional: `rgba(200, 150, 100, ${alpha})`, // Orange
    upgrade: `rgba(150, 200, 200, ${alpha})`, // Cyan
  };
  return colors[type] || colors.passive;
}

function getBadgeColor(variant: string): string {
  const colors = {
    type: '#4CAF50',
    source: '#2196F3',
    action: '#FF9800',
    resource: '#9C27B0',
  };
  return colors[variant as keyof typeof colors] || '#757575';
}

function formatResourceDisplay(feature: CharacterFeature): string {
  if (!feature.resource) return '';

  const { type, maxUses, currentUses } = feature.resource;
  const current = currentUses ?? maxUses;

  if (typeof maxUses === 'number') {
    return `${current}/${maxUses} per ${type.replace('per-', '')}`;
  }

  return `${type.replace('per-', '')}`;
}

export const StructuredFeaturesDisplay: React.FC<
  StructuredFeaturesDisplayProps
> = ({ features, compactMode = false, showFilters = true, characterData }) => {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showSources] = useState<Set<FeatureSource>>(
    new Set(['class', 'species', 'feat'])
  );

  // Create character context for template resolution
  const characterContext = characterData ? createCharacterContext(characterData) : null;

  const allFeatures = [
    ...features.classFeatures,
    ...features.subclassFeatures,
    ...features.speciesTraits,
    ...features.backgroundFeatures,
    ...features.feats,
    ...features.magicItemFeatures,
    ...features.customFeatures,
  ];

  // Note: filteredFeatures is not used in current implementation
  // const filteredFeatures = allFeatures.filter(feature => {
  //   if (activeFilters.size > 0 && !activeFilters.has(feature.type)) {
  //     return false;
  //   }
  //   return showSources.has(feature.source);
  // });

  const toggleFilter = (filter: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setActiveFilters(newFilters);
  };

  // Note: toggleSource is not used in current implementation
  // const toggleSource = (source: FeatureSource) => {
  //   const newSources = new Set(showSources);
  //   if (newSources.has(source)) {
  //     newSources.delete(source);
  //   } else {
  //     newSources.add(source);
  //   }
  //   setShowSources(newSources);
  // };

  const renderFeatureComponent = (feature: CharacterFeature) => {
    // Render feature with template resolution if character context is available
    const renderedFeature: RenderedFeature = characterContext
      ? renderFeature(feature, characterContext)
      : feature as RenderedFeature;

    if (compactMode) {
      return (
        <div key={feature.id} className="feature-item">
          <div>
            <div className="feature-name">{renderedFeature.resolvedName || renderedFeature.name}</div>
            <div className="feature-summary">
              {renderedFeature.resolvedShortDescription || renderedFeature.shortDescription ||
                (typeof renderedFeature.resolvedDescription === 'string'
                  ? renderedFeature.resolvedDescription.substring(0, 60) + '...'
                  : typeof renderedFeature.description === 'string'
                  ? renderedFeature.description.substring(0, 60) + '...'
                  : JSON.stringify(renderedFeature.description).substring(0, 60) + '...')}
            </div>
          </div>
          <FeatureBadge $variant="type">{feature.type}</FeatureBadge>
        </div>
      );
    }

    return (
      <FeatureCard key={feature.id} $type={feature.type}>
        <div className="feature-header">
          <h4 className="feature-name">{renderedFeature.resolvedName || renderedFeature.name}</h4>
          <div className="feature-badges">
            <FeatureBadge $variant="type">{feature.type}</FeatureBadge>
            <FeatureBadge $variant="source">{feature.source}</FeatureBadge>
            {(renderedFeature.resolvedAction || feature.action) && (
              <FeatureBadge $variant="action">
                {(renderedFeature.resolvedAction || feature.action)?.type}
              </FeatureBadge>
            )}
            {(renderedFeature.resolvedResource || feature.resource) && (
              <FeatureBadge $variant="resource">Limited</FeatureBadge>
            )}
          </div>
        </div>

        <div className="feature-description">
          {renderedFeature.resolvedDescription ||
           (typeof feature.description === 'string'
            ? feature.description
            : JSON.stringify(feature.description))
          }
        </div>

        {/* Enhanced mechanics display with resolved values */}
        {((renderedFeature.resolvedAction || feature.action) ||
          (renderedFeature.resolvedResource || feature.resource) ||
          feature.effects?.length ||
          renderedFeature.resolvedCurrentDamage ||
          renderedFeature.resolvedCurrentSaveDC ||
          renderedFeature.resolvedCurrentUses) && (
          <div className="feature-mechanics">
            {(renderedFeature.resolvedAction || feature.action) && (
              <div className="mechanic-row">
                <span className="mechanic-label">Action Type:</span>
                <span className="mechanic-value">
                  {(renderedFeature.resolvedAction || feature.action)?.type}
                </span>
              </div>
            )}

            {renderedFeature.resolvedCurrentDamage && (
              <div className="mechanic-row">
                <span className="mechanic-label">Damage:</span>
                <span className="mechanic-value">
                  {renderedFeature.resolvedCurrentDamage} {renderedFeature.resolvedAction?.damage?.type || ''}
                </span>
              </div>
            )}

            {renderedFeature.resolvedCurrentSaveDC && (
              <div className="mechanic-row">
                <span className="mechanic-label">Save DC:</span>
                <span className="mechanic-value">
                  {renderedFeature.resolvedCurrentSaveDC} ({renderedFeature.resolvedAction?.savingThrow?.ability})
                </span>
              </div>
            )}

            {(renderedFeature.resolvedCurrentUses || (renderedFeature.resolvedResource || feature.resource)) && (
              <div className="mechanic-row">
                <span className="mechanic-label">Usage:</span>
                <span className="mechanic-value">
                  {renderedFeature.resolvedCurrentUses
                    ? `${renderedFeature.resolvedCurrentUses} uses per ${(renderedFeature.resolvedResource || feature.resource)?.type.replace('per-', '')}`
                    : formatResourceDisplay(feature)}
                </span>
              </div>
            )}

            {feature.effects && feature.effects.length > 0 && (
              <div className="mechanic-row">
                <span className="mechanic-label">Effects:</span>
                <span className="mechanic-value">
                  {feature.effects.map((effect) =>
                    typeof effect.type === 'object'
                      ? JSON.stringify(effect.type)
                      : effect.type
                  ).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </FeatureCard>
    );
  };

  const renderFeaturesBySource = () => {
    const sections = [
      {
        key: 'class',
        title: 'Class Features',
        features: features.classFeatures,
      },
      {
        key: 'subclass',
        title: 'Subclass Features',
        features: features.subclassFeatures,
      },
      {
        key: 'species',
        title: 'Species Traits',
        features: features.speciesTraits,
      },
      {
        key: 'background',
        title: 'Background Features',
        features: features.backgroundFeatures,
      },
      { key: 'feat', title: 'Feats', features: features.feats },
      {
        key: 'magic-item',
        title: 'Magic Items',
        features: features.magicItemFeatures,
      },
      {
        key: 'custom',
        title: 'Custom Features',
        features: features.customFeatures,
      },
    ];

    return sections
      .filter(
        (section) =>
          section.features.length > 0 &&
          showSources.has(section.key as FeatureSource)
      )
      .map((section) => (
        <FeatureSection key={section.key}>
          <div className="section-header">{section.title}</div>
          <div className={compactMode ? '' : 'features-grid'}>
            {compactMode ? (
              <CompactFeatureList>
                {section.features
                  .filter(
                    (feature) =>
                      activeFilters.size === 0 ||
                      activeFilters.has(feature.type)
                  )
                  .map(renderFeatureComponent)}
              </CompactFeatureList>
            ) : (
              section.features
                .filter(
                  (feature) =>
                    activeFilters.size === 0 || activeFilters.has(feature.type)
                )
                .map(renderFeatureComponent)
            )}
          </div>
        </FeatureSection>
      ));
  };

  if (allFeatures.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
        No features available
      </div>
    );
  }

  return (
    <FeaturesContainer>
      {showFilters && (
        <FilterBar>
          <div
            style={{ color: '#ce9016', fontWeight: 600, marginRight: '0.5rem' }}
          >
            Filter by type:
          </div>
          {(
            [
              'passive',
              'active',
              'reaction',
              'resource',
              'choice',
              'conditional',
              'upgrade',
            ] as FeatureType[]
          ).map((type) => (
            <FilterButton
              key={type}
              $active={activeFilters.has(type)}
              onClick={() => toggleFilter(type)}
            >
              {type}
            </FilterButton>
          ))}
        </FilterBar>
      )}

      {renderFeaturesBySource()}
    </FeaturesContainer>
  );
};
