import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { listFeats } from '@/services/featsService';
import { Feat } from '@/types/api';
import { parseDnDTemplateTag } from '@/utils/dndTemplateParser';
import { useApiCall } from '@/hooks/useApiCall';
import LoadingSpinner from '@/components/LoadingSpinner';
import { isError } from '@/types/api';
import { logger } from '../utils/logger';

// Main page container matching Generator theme
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
`;

// Header section
const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-family: 'Cinzel', serif;
    font-size: 3rem;
    color: #d4af37;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  p {
    font-size: 1.2rem;
    color: #ccc;
    max-width: 600px;
    margin: 0 auto;
  }
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

// Main container matching Generator's WizardContent
const MainContainer = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 3rem;
  min-height: 500px;
  backdrop-filter: blur(10px);
`;

// Filter section
const FilterSection = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchInput = styled.input`
  background: rgba(45, 45, 45, 0.8);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 10px 14px;
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  flex: 1;
  min-width: 200px;
  transition: all 0.3s ease;

  &::placeholder {
    color: #888;
  }

  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
  }

  &:hover {
    border-color: #666;
  }
`;

const FilterSelect = styled.select`
  background: rgba(45, 45, 45, 0.8);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 10px 14px;
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
  }

  &:hover {
    border-color: #666;
  }

  option {
    background: #2d2d2d;
    color: #f0f0f0;
  }
`;

// Feat cards grid
const FeatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Individual feat card
const FeatCard = styled.div`
  background: rgba(45, 45, 45, 0.6);
  border: 2px solid #444;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f0f0f0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
    border-color: #d4af37;
  }
`;

const FeatHeader = styled.div`
  background: rgba(35, 35, 35, 0.9);
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #444;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
`;

const FeatName = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #d4af37;
  font-family: 'Cinzel', serif;
  flex: 1;
`;

const FeatCategory = styled.div`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #f0f0f0;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.3);
`;

const FeatContent = styled.div`
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Prerequisites = styled.div`
  background: rgba(35, 35, 35, 0.5);
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #d4af37;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;

  .label {
    color: #d4af37;
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
    display: block;
  }

  .content {
    color: #f0f0f0;
    font-weight: 400;
    line-height: 1.4;
  }
`;

const FeatDescription = styled.div`
  color: #f0f0f0;
  line-height: 1.5;
  margin-bottom: 0.75rem;
  white-space: pre-line;
  flex: 1;
  font-size: 0.85rem;
`;

const FeatSource = styled.div`
  margin-top: auto;
  padding: 0.5rem 0.75rem;
  font-size: 0.7rem;
  color: #888;
  font-style: italic;
  text-align: center;
  background: rgba(35, 35, 35, 0.5);
  border-top: 1px solid #444;
  border-radius: 0 0 8px 8px;

  strong {
    color: #d4af37;
    font-weight: 600;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.65rem;
  }
`;

// Loading and error states
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #ff6b6b;
  text-align: center;
  font-family: 'Cinzel', serif;

  .error-title {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .error-message {
    color: #ccc;
    margin-bottom: 1rem;
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  color: #888;
  font-size: 1.2rem;
  margin-top: 60px;
  padding: 60px 20px;

  .title {
    font-size: 1.6rem;
    color: #d4af37;
    margin-bottom: 15px;
    font-weight: 600;
    font-family: 'Cinzel', serif;
  }

  .subtitle {
    font-size: 1.1rem;
    color: #ccc;
    line-height: 1.5;
  }
`;

// Pagination controls
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #444;
`;

const PaginationButton = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active
    ? 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)'
    : 'rgba(45, 45, 45, 0.8)'};
  color: ${props => props.$active ? '#1a1a1a' : '#f0f0f0'};
  border: 1px solid ${props => props.$active ? '#d4af37' : '#444'};
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 40px;

  &:hover:not(:disabled) {
    background: ${props => props.$active
      ? 'linear-gradient(135deg, #b8941f 0%, #a0801b 100%)'
      : 'rgba(212, 175, 55, 0.2)'};
    border-color: #d4af37;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: #ccc;
  font-size: 0.9rem;
  margin: 0 1rem;
`;

const FeatsPage: React.FC = () => {
  const [feats, setFeats] = useState<Feat[]>([]);
  const [filteredFeats, setFilteredFeats] = useState<Feat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const featsPerPage = 12;

  const {
    error,
    isLoading,
    execute: fetchFeats,
  } = useApiCall(listFeats, {
    onSuccess: (featList) => {
      setFeats(featList);
      setFilteredFeats(featList);
    },
    onError: (result) => {
      if (isError(result)) {
        logger.error('Failed to load feats:', result.error);
      }
    },
  });

  useEffect(() => {
    fetchFeats();
  }, [fetchFeats]);

  // Filter feats based on search and category
  useEffect(() => {
    let filtered = feats;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (feat) =>
          feat.name?.toLowerCase().includes(search) ||
          parseDescription(feat.entries).toLowerCase().includes(search) ||
          parsePrerequisites(feat.prerequisites).toLowerCase().includes(search)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (feat) => formatCategory(feat.category) === selectedCategory
      );
    }

    setFilteredFeats(filtered);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [feats, searchTerm, selectedCategory]);

  // Helper functions
  const parsePrerequisites = (prerequisites?: any): string => {
    if (!prerequisites || typeof prerequisites !== 'object') return 'None';

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

      return parts.join(', ') || 'None';
    } catch (error) {
      logger.error('Error parsing prerequisites:', error);
      return 'Complex prerequisites';
    }
  };

  const parseDescription = (entries: any): string => {
    if (!entries) return 'No description available.';

    if (typeof entries === 'string') {
      return entries;
    }

    if (typeof entries === 'object') {
      const parts: string[] = [];

      if (entries.description && Array.isArray(entries.description)) {
        parts.push(
          ...entries.description.map((desc: string) =>
            parseDnDTemplateTag(desc.trim())
          )
        );
      }

      if (entries.benefits && Array.isArray(entries.benefits)) {
        const benefits = entries.benefits.map(
          (benefit: string) => `• ${parseDnDTemplateTag(benefit.trim())}`
        );
        if (parts.length > 0) {
          parts.push('');
        }
        parts.push(...benefits);
      }

      return parts.filter((p) => p).join('\n');
    }

    return 'See source material for details.';
  };

  const formatCategory = (category?: string): string => {
    if (!category) return 'General';

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

  // Get unique categories for filter
  const categories = Array.from(
    new Set(feats.map((feat) => formatCategory(feat.category)))
  ).sort();

  // Pagination calculations
  const totalPages = Math.ceil(filteredFeats.length / featsPerPage);
  const indexOfLastFeat = currentPage * featsPerPage;
  const indexOfFirstFeat = indexOfLastFeat - featsPerPage;
  const currentFeats = filteredFeats.slice(indexOfFirstFeat, indexOfLastFeat);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ContentContainer>
          <Header>
            <h1>D&D Feats</h1>
            <p>Unlock Your Potential</p>
          </Header>
          <MainContainer>
            <LoadingSpinner message="Loading feats data..." />
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <Header>
            <h1>D&D Feats</h1>
            <p>Unlock Your Potential</p>
          </Header>
          <MainContainer>
            <ErrorContainer>
              <div className="error-title">Error Loading Feats</div>
              <div className="error-message">{error}</div>
            </ErrorContainer>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <h1>D&D Feats</h1>
          <p>Choose from {feats.length} powerful feats</p>
        </Header>

        <MainContainer>
          {/* Search and Filter Section */}
          <FilterSection>
            <SearchInput
              type="text"
              placeholder="Search feats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FilterSelect
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </FilterSelect>
          </FilterSection>

          {/* Content */}
          {filteredFeats.length === 0 ? (
            <NoResultsMessage>
              <div className="title">No Feats Found</div>
              <div className="subtitle">
                Try different search terms or adjust your filters
              </div>
            </NoResultsMessage>
          ) : (
            <>
              <FeatsGrid>
                {currentFeats.map((feat, index) => (
                  <FeatCard key={feat.id || feat.name || index}>
                    <FeatHeader>
                      <FeatName>{feat.name}</FeatName>
                      <FeatCategory>
                        {formatCategory(feat.category)}
                      </FeatCategory>
                    </FeatHeader>

                    <FeatContent>
                      <Prerequisites>
                        <span className="label">Prerequisites:</span>
                        <span className="content">
                          {parsePrerequisites(feat.prerequisites)}
                        </span>
                      </Prerequisites>

                      <FeatDescription>
                        {parseDescription(feat.entries)}
                      </FeatDescription>

                      {feat.source && (
                        <FeatSource>
                          <strong>Source:</strong> {feat.source}
                          {feat.page && ` p.${feat.page}`}
                        </FeatSource>
                      )}
                    </FeatContent>
                  </FeatCard>
                ))}
              </FeatsGrid>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <PaginationContainer>
                  <PaginationButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Prev
                  </PaginationButton>

                  {getPageNumbers().map((page, index) => (
                    typeof page === 'number' ? (
                      <PaginationButton
                        key={index}
                        $active={currentPage === page}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationButton>
                    ) : (
                      <PageInfo key={index}>{page}</PageInfo>
                    )
                  ))}

                  <PaginationButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </PaginationButton>
                </PaginationContainer>
              )}
            </>
          )}
        </MainContainer>
      </ContentContainer>
    </PageContainer>
  );
};

export default FeatsPage;