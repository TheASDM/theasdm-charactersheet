import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { featService } from '../services';
import { Feat } from '../types/api';
import { Hero } from '../components';
import { parseDnDTemplateTag } from '../utils/dndTemplateParser';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

// Main page container with forest green background
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #363636ff 0%,
    #4b4b4bff 25%,
    #323232ff 50%,
    #222222ff 75%,
    #0e0e0eff 100%
  );
  padding: 0;
  font-family: 'Crimson Text', serif;
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

// Main container that holds everything below the hero
const MainContainer = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border: 2px solid #8b6914;
  border-radius: 20px 20px 15px 15px;
  margin: 0 20px;
  margin-top: -5px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(139, 105, 20, 0.3);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  /* Medieval parchment texture */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="paper"><feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/></filter></defs><rect width="100" height="100" fill="rgba(101,67,33,0.1)" filter="url(%23paper)"/></svg>')
      repeat;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 768px) {
    margin: 0 10px;
    margin-top: -2px;
  }

  @media (max-width: 480px) {
    margin: 0 5px;
    margin-top: -2px;
  }
`;

// Content inside the main container
const ContainerContent = styled.div`
  position: relative;
  z-index: 2;
  padding: 30px;

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 15px;
  }
`;

// Search and filter section
const FilterSection = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border: 2px solid #8b6914;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  padding: 30px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 15px;
  }
`;

const SearchInput = styled.input`
  background: linear-gradient(145deg, #4a2a1a, #3a1a0a);
  border: 2px solid #8b6914;
  border-radius: 12px;
  padding: 16px 20px;
  color: #d4af37;
  font-family: 'Crimson Text', serif;
  font-size: 18px;
  width: 100%;
  transition: all 0.3s ease;
  font-style: italic;
  margin-bottom: 20px;

  &::placeholder {
    color: #a0824a;
    font-style: italic;
  }

  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
    font-style: normal;
  }

  &:hover {
    border-color: #d4af37;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
`;

const FilterLabel = styled.label`
  font-weight: 600;
  color: #d4af37;
  font-size: 1.2rem;
  font-family: 'Cinzel', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  min-width: 100px;

  @media (max-width: 480px) {
    min-width: auto;
  }
`;

const FilterSelect = styled.select`
  background: linear-gradient(145deg, #4a2a1a, #3a1a0a);
  border: 2px solid #8b6914;
  border-radius: 8px;
  padding: 12px 16px;
  color: #d4af37;
  font-family: 'Crimson Text', serif;
  font-size: 16px;
  min-width: 180px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
  }

  &:hover {
    border-color: #d4af37;
  }

  option {
    background: #3a1a0a;
    color: #d4af37;
  }

  @media (max-width: 480px) {
    min-width: auto;
    width: 100%;
  }
`;

// Feat cards grid
const FeatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
  margin-bottom: 2rem;
  contain: layout style;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  @media (max-width: 480px) {
    gap: 15px;
  }
`;

// Individual feat card
const FeatCard = styled.div`
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 3px solid #8b6914;
  border-radius: 15px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  font-family: 'Crimson Text', serif;
  overflow: hidden;
  position: relative;
  color: #2c1810;
  will-change: transform;
  contain: layout style paint;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    border-color: #d4af37;
  }
`;

const FeatHeader = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.9),
    rgba(74, 42, 26, 0.9)
  );
  color: #d4af37;
  padding: 20px 25px;
  border-bottom: 2px solid #8b6914;
  position: relative;

  @media (max-width: 480px) {
    padding: 15px 20px;
  }
`;

const FeatName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #d4af37;
  font-family: 'Cinzel', serif;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
`;

const FeatCategory = styled.div`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: white;
  font-family: 'Cinzel', serif;
  background: linear-gradient(145deg, #8b6914, #6d5411);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const FeatContent = styled.div`
  padding: 25px;
  background: transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Prerequisites = styled.div`
  background: rgba(139, 105, 20, 0.1);
  padding: 12px 15px;
  border-radius: 8px;
  border-left: 4px solid #8b6914;
  margin-bottom: 15px;
  font-size: 0.95rem;

  .label {
    color: #8b6914;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Cinzel', serif;
    margin-bottom: 5px;
    display: block;
  }

  .content {
    color: #2c1810;
    font-weight: 500;
    line-height: 1.4;
  }
`;

const FeatDescription = styled.div`
  color: #2c1810;
  line-height: 1.6;
  margin-bottom: 20px;
  white-space: pre-line;
  flex: 1;
  font-size: 1rem;
`;

const FeatSource = styled.div`
  margin-top: auto;
  padding: 12px 16px;
  font-size: 0.8rem;
  color: #6d5411;
  font-style: italic;
  text-align: center;
  background: linear-gradient(
    145deg,
    rgba(139, 105, 20, 0.1),
    rgba(139, 105, 20, 0.05)
  );
  border-top: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 0 0 12px 12px;

  strong {
    color: #8b6914;
    font-weight: 600;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.75rem;
    font-family: 'Cinzel', serif;
  }
`;

// Loading and error states
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #d4af37;
  font-size: 1.4rem;
  font-weight: 600;
  font-family: 'Cinzel', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #d4af37;
  text-align: center;
  font-family: 'Cinzel', serif;

  .error-title {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .error-message {
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  button {
    background: linear-gradient(145deg, #d4af37, #b8941f);
    color: #2c1810;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Cinzel', serif;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
      background: linear-gradient(145deg, #b8941f, #a0801b);
    }
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  color: #a0824a;
  font-size: 1.4rem;
  margin-top: 60px;
  padding: 60px 20px;
  font-family: 'Cinzel', serif;
  font-style: italic;

  .title {
    font-size: 1.6rem;
    color: #d4af37;
    margin-bottom: 15px;
    font-weight: 600;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #c9a961;
    line-height: 1.5;
  }
`;

const FeatsPage: React.FC = () => {
  const [feats, setFeats] = useState<Feat[]>([]);
  const [filteredFeats, setFilteredFeats] = useState<Feat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    const fetchFeats = async () => {
      try {
        setLoading(true);
        const response = await featService.getAll();
        const featsData = response.data || [];
        setFeats(featsData);
        setFilteredFeats(featsData);
      } catch (err) {
        console.error('Error fetching feats:', err);
        setError('Failed to load feats from the ancient tomes.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeats();
  }, []);

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

  if (loading) {
    return (
      <>
        <FontImport />
        <PageContainer>
          <ContentContainer>
            <Hero
              title="D&D FEATS"
              subtitle="Unlock Your Potential"
              height="280px"
            />
            <MainContainer>
              <ContainerContent>
                <LoadingContainer>
                  📚 Gathering Ancient Knowledge from the Libraries...
                </LoadingContainer>
              </ContainerContent>
            </MainContainer>
          </ContentContainer>
        </PageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <FontImport />
        <PageContainer>
          <ContentContainer>
            <Hero
              title="D&D FEATS"
              subtitle="Unlock Your Potential"
              height="280px"
            />
            <MainContainer>
              <ContainerContent>
                <ErrorContainer>
                  <div className="error-title">
                    📜 Ancient Scrolls Unavailable
                  </div>
                  <div className="error-message">{error}</div>
                  <button onClick={() => window.location.reload()}>
                    Retry Incantation
                  </button>
                </ErrorContainer>
              </ContainerContent>
            </MainContainer>
          </ContentContainer>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <FontImport />
      <PageContainer>
        <ContentContainer>
          <Hero
            title="D&D FEATS"
            subtitle="Unlock Your Potential"
            height="280px"
          />

          <MainContainer>
            <ContainerContent>
              {/* Search and Filter Section */}
              <FilterSection>
                <SearchInput
                  type="text"
                  placeholder="Search the halls of knowledge..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <FilterGroup>
                  <FilterLabel>Category:</FilterLabel>
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
                </FilterGroup>
              </FilterSection>

              {/* Content */}
              {filteredFeats.length === 0 ? (
                <NoResultsMessage>
                  <div className="title">📜 No Feats Found in the Archives</div>
                  <div className="subtitle">
                    The ancient knowledge remains hidden. Try different search
                    terms or adjust your mystical filters.
                  </div>
                </NoResultsMessage>
              ) : (
                <FeatsGrid>
                  {filteredFeats.map((feat, index) => (
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
              )}
            </ContainerContent>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export default FeatsPage;
