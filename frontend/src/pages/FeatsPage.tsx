import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { featService } from '../services';
import { Feat } from '../types/api';
import { ResponsiveTable } from '../components';
import { parseDnDTemplateTag } from '../utils/dndTemplateParser';

// Styled components for consistent D&D styling
const PageContainer = styled.div`
  min-height: 50vh;
  background: white;
  font-family: 'Georgia', serif;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
`;

const Title = styled.h1`
  color: #2c3e50;
  padding-top: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 2.5rem;
`;

const MainContent = styled.div`
  padding: 24px;
`;

const PageDescription = styled.p`
  color: #666;
  font-size: 16px;
  margin-bottom: 24px;
  text-align: center;
  line-height: 1.6;
`;

const FilterContainer = styled.div`
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #333;
  }

  select,
  input {
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }

  input[type='text'] {
    min-width: 200px;
  }
`;

const FeatName = styled.div`
  font-weight: bold;
  color: #8b4513;
  font-size: 16px;
  margin-bottom: 4px;
`;

const FeatCategory = styled.div`
  color: #7b1fa2;
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Prerequisites = styled.div`
  color: #d32f2f;
  font-size: 13px;
  line-height: 1.3;
`;

const FeatDescription = styled.div`
  color: #666;
  line-height: 1.4;
  margin-top: 4px;
  white-space: pre-line; /* Preserve line breaks */
`;

const Source = styled.div`
  color: #666;
  font-size: 12px;
  font-style: italic;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #666;
  font-size: 1.1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #f44336;
  text-align: center;
`;

const FeatsPage: React.FC = () => {
  const [feats, setFeats] = useState<Feat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  useEffect(() => {
    const fetchFeats = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (categoryFilter) params.category = categoryFilter;
        if (searchFilter) params.search = searchFilter;
        if (sourceFilter) params.source = sourceFilter;

        const response = await featService.getAll(params);
        setFeats(response.data || []);
      } catch (err) {
        console.error('Error fetching feats:', err);
        setError('Failed to load feats');
      } finally {
        setLoading(false);
      }
    };

    fetchFeats();
  }, [categoryFilter, searchFilter, sourceFilter]);

  // Helper functions to parse the JSON data
  const parsePrerequisites = (prerequisites?: any): string => {
    if (!prerequisites || typeof prerequisites !== 'object') return '—';

    try {
      const parts: string[] = [];

      if (prerequisites.level) {
        parts.push(`${prerequisites.level}th level`);
      }

      if (prerequisites.abilities) {
        const abilities = Array.isArray(prerequisites.abilities)
          ? prerequisites.abilities
          : [prerequisites.abilities];
        abilities.forEach((ability: any) => {
          if (typeof ability === 'object' && ability.score && ability.value) {
            parts.push(
              `${
                ability.score.charAt(0).toUpperCase() + ability.score.slice(1)
              } ${ability.value}+`
            );
          }
        });
      }

      if (prerequisites.spellcasting) {
        parts.push('Spellcasting feature');
      }

      if (prerequisites.features && Array.isArray(prerequisites.features)) {
        prerequisites.features.forEach((feature: string) => {
          parts.push(feature);
        });
      }

      return parts.join(', ') || '—';
    } catch (error) {
      console.error('Error parsing prerequisites:', error);
      return 'Complex prerequisites';
    }
  };

  const parseDescription = (entries: any): string => {
    if (!entries) return 'No description available.';

    if (typeof entries === 'string') {
      return entries;
    }

    if (typeof entries === 'object') {
      // Handle the structure: {description: [...], benefits: [...]}
      const parts: string[] = [];

      if (entries.description && Array.isArray(entries.description)) {
        parts.push(
          ...entries.description.map((desc: string) =>
            parseDnDTemplateTag(desc.trim())
          )
        );
      }

      if (entries.benefits && Array.isArray(entries.benefits)) {
        // Add benefits with bullet points for readability
        const benefits = entries.benefits.map(
          (benefit: string) => `• ${parseDnDTemplateTag(benefit.trim())}`
        );
        if (parts.length > 0) {
          parts.push(''); // Add spacing between description and benefits
        }
        parts.push(...benefits);
      }

      return parts.filter((p) => p).join('\n');
    }

    return 'See source material for details.';
  };

  const formatCategory = (category?: string): string => {
    if (!category) return '';

    // Map single letter categories to full names
    const categoryMap: { [key: string]: string } = {
      G: 'General',
      C: 'Combat',
      M: 'Magic',
      S: 'Skill',
      R: 'Racial',
      F: 'Fighting Style',
    };

    return categoryMap[category] || category;
  };

  const getUniqueCategories = (): string[] => {
    const categories = feats.map((feat) => feat.category).filter(Boolean);
    return [...new Set(categories)].sort();
  };

  const getUniqueSources = (): string[] => {
    const sources = feats
      .map((feat) => feat.source)
      .filter((source): source is string => Boolean(source));
    return [...new Set(sources)].sort();
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentContainer>
          <LoadingContainer>Loading feats...</LoadingContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <ErrorContainer>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </ErrorContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
        <Title>⭐ Feats</Title>
        <MainContent>
          <ResponsiveTable
            keyField="id"
            data={feats}
            columns={[
              {
                key: 'name',
                header: 'Feat Name',
                render: (_value, row) => (
                  <div>
                    <FeatName>{row.name}</FeatName>
                    <FeatCategory>{formatCategory(row.category)}</FeatCategory>
                  </div>
                ),
              },
              {
                key: 'prerequisites',
                header: 'Prerequisites',
                mobile: false, // Hide on mobile to save space
                render: (_value, row) => (
                  <Prerequisites>
                    {parsePrerequisites(row.prerequisites)}
                  </Prerequisites>
                ),
              },
              {
                key: 'description',
                header: 'Description',
                render: (_value, row) => (
                  <FeatDescription>
                    {parseDescription(row.entries)}
                  </FeatDescription>
                ),
              },
              {
                key: 'source',
                header: 'Source',
                mobile: false, // Hide on mobile to save space
                render: (_value, row) => (
                  <Source>
                    {row.source || '—'}
                    {row.page && ` p.${row.page}`}
                  </Source>
                ),
              },
              // Mobile-specific column for prerequisites and source
              {
                key: 'details',
                header: 'Details',
                desktop: false, // Only show on mobile
                render: (_value, row) => (
                  <div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Prerequisites:</strong>
                      <div style={{ marginTop: '0.25rem' }}>
                        {parsePrerequisites(row.prerequisites)}
                      </div>
                    </div>
                    <div>
                      <strong>Source:</strong> {row.source || '—'}
                      {row.page && ` p.${row.page}`}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default FeatsPage;
