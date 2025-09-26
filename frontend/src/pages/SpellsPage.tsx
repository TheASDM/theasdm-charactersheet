import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { SpellCard, Hero, SpellModal } from '../components';
import { spellService, SPELL_LEVELS } from '../services';
import { Spell } from '../types/api';
import type { SpellFilters } from '../services/spellService';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

// Main page container with complementary dark forest background
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #353535ff 0%,
    #454545ff 25%,
    #2c2c2cff 50%,
    #2b2b2bff 75%,
    #101010ff 100%
  );
  padding: 0;
  font-family: 'Crimson Text', serif;
`;

// Content wrapper - no padding around hero
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
  border-radius: 20px 20px 15px 15px; /* Rounded top corners */
  margin: 0 20px;
  margin-top: -5px; /* Reduce overlap for subtle transition */
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3),
    /* Shadow going upward */ 0 8px 32px rgba(0, 0, 0, 0.4),
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

// Filters section with medieval styling
const FiltersSection = styled.div`
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 25px;
  flex-wrap: wrap;
  padding: 30px;
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border-radius: 15px;
  border: 2px solid #8b6914;
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  position: relative;

  @media (max-width: 768px) {
    padding: 20px;
    gap: 20px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
    padding: 15px;
  }
`;

const FiltersLabel = styled.span`
  font-weight: 600;
  color: #d4af37;
  font-size: 1.2rem;
  font-family: 'Cinzel', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

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
  min-width: 80px;

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
  min-width: 150px;
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

// Search section
const SearchSection = styled.div`
  margin-bottom: 30px;
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

// Spells grid
const SpellsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  @media (max-width: 480px) {
    gap: 15px;
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

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  padding: 0.5rem;
  gap: 0.25rem;
  font-family: 'Crimson Text', serif;
  color: #8b6914;
`;

const PageButton = styled.button<{ isActive?: boolean }>`
  padding: 0.25rem 0.5rem;
  border: none;
  background: none;
  color: ${(props) => (props.isActive ? '#d4af37' : '#8b6914')};
  cursor: pointer;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  min-width: 24px;
  margin: 0 2px;

  &:hover {
    color: #d4af37;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: #8b6914;
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

const SpellsPageNew: React.FC = () => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(
    undefined
  );
  const [selectedSchool, setSelectedSchool] = useState<string | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadSpells();
  }, [searchTerm, selectedLevel, selectedSchool, currentPage]);

  const loadSpells = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: SpellFilters = {
        ...(selectedLevel !== undefined && { level: selectedLevel }),
        ...(selectedSchool && { school: selectedSchool }),
        ...(searchTerm && { search: searchTerm }),
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await spellService.getAll(filters);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setSpells(response.data.spells || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages);
        }
      }
    } catch (err) {
      setError('Failed to load spells from the magical archives.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpellClick = (spell: Spell) => {
    setSelectedSpell(spell);
  };

  const handleCloseModal = () => {
    setSelectedSpell(null);
  };

  // Create school options
  const schoolOptions = [
    { value: 'A', label: 'Abjuration' },
    { value: 'C', label: 'Conjuration' },
    { value: 'D', label: 'Divination' },
    { value: 'E', label: 'Enchantment' },
    { value: 'V', label: 'Evocation' },
    { value: 'I', label: 'Illusion' },
    { value: 'N', label: 'Necromancy' },
    { value: 'T', label: 'Transmutation' },
  ];

  return (
    <>
      <FontImport />
      <PageContainer>
        <ContentContainer>
          {/* Hero Section - No padding/margin around it */}
          <Hero
            title="D&D SPELLS"
            subtitle="Discover the Magic Within"
            height="280px"
          />

          {/* Main Content Container */}
          <MainContainer>
            <ContainerContent>
              {/* Filters Section */}
              <FiltersSection>
                <FiltersLabel>Filters:</FiltersLabel>

                <FilterGroup>
                  <FilterLabel>Level:</FilterLabel>
                  <FilterSelect
                    value={selectedLevel !== undefined ? selectedLevel : ''}
                    onChange={(e) =>
                      setSelectedLevel(
                        e.target.value === ''
                          ? undefined
                          : parseInt(e.target.value)
                      )
                    }
                  >
                    <option value="">All Levels</option>
                    {SPELL_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level === 0 ? 'Cantrip' : `Level ${level}`}
                      </option>
                    ))}
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel>School:</FilterLabel>
                  <FilterSelect
                    value={selectedSchool || ''}
                    onChange={(e) =>
                      setSelectedSchool(
                        e.target.value === '' ? undefined : e.target.value
                      )
                    }
                  >
                    <option value="">All Schools</option>
                    {schoolOptions.map((school) => (
                      <option key={school.value} value={school.value}>
                        {school.label}
                      </option>
                    ))}
                  </FilterSelect>
                </FilterGroup>
              </FiltersSection>

              {/* Search Section */}
              <SearchSection>
                <SearchInput
                  type="text"
                  placeholder="Search the ancient grimoire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchSection>

              {/* Content */}
              {loading && (
                <LoadingContainer>
                  ✨ Summoning Spells from the Arcane Library...
                </LoadingContainer>
              )}

              {error && (
                <ErrorContainer>
                  <div className="error-title">
                    🔮 Magical Interference Detected
                  </div>
                  <div className="error-message">{error}</div>
                  <button onClick={loadSpells}>Retry Incantation</button>
                </ErrorContainer>
              )}

              {!loading && !error && spells.length === 0 && (
                <NoResultsMessage>
                  <div className="title">
                    📜 No Spells Found in the Archives
                  </div>
                  <div className="subtitle">
                    The magical energies have shifted. Try different search
                    terms or adjust your mystical filters.
                  </div>
                </NoResultsMessage>
              )}

              {!loading && !error && spells.length > 0 && (
                <>
                  <SpellsGrid>
                    {spells.map((spell, index) => (
                      <SpellCard
                        key={spell.name || index}
                        spell={spell}
                        onClick={() => handleSpellClick(spell)}
                        compact={false}
                      />
                    ))}
                  </SpellsGrid>
                  <PaginationContainer>
                    <PageButton
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </PageButton>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      if (currentPage <= 3) {
                        // Start of the list
                        return i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // End of the list
                        return totalPages - (4 - i);
                      } else {
                        // Middle of the list
                        return currentPage - 2 + i;
                      }
                    })
                      .filter((page) => page > 0 && page <= totalPages)
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index === 0 && page > 1 && (
                            <>
                              <PageButton
                                onClick={() => setCurrentPage(1)}
                                isActive={false}
                              >
                                1
                              </PageButton>
                              {page > 2 && <span>...</span>}
                            </>
                          )}
                          <PageButton
                            onClick={() => setCurrentPage(page)}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PageButton>
                          {index === array.length - 1 && page < totalPages && (
                            <>
                              {page < totalPages - 1 && <span>...</span>}
                              <PageButton
                                onClick={() => setCurrentPage(totalPages)}
                                isActive={false}
                              >
                                {totalPages}
                              </PageButton>
                            </>
                          )}
                        </React.Fragment>
                      ))}

                    <PageButton
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      &gt;
                    </PageButton>
                  </PaginationContainer>
                </>
              )}
            </ContainerContent>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
      <SpellModal
        spell={selectedSpell}
        onClose={handleCloseModal}
        isOpen={selectedSpell !== null}
      />
    </>
  );
};

export default SpellsPageNew;
