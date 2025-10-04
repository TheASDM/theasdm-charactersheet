import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { SpellCard, SpellModal } from '../components';
import { CHARACTER_CLASSES, SPELL_LEVELS } from '../services';
import { Spell, isError } from '../types/api';
import { listSpells, SpellFilters } from '@/services/spellService';
import { useApiCall } from '@/hooks/useApiCall';
import LoadingSpinner from '@/components/LoadingSpinner';
import { showError } from '@/utils/errorDisplay';

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

// Filters section
const FiltersSection = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterSelect = styled.select`
  background: rgba(45, 45, 45, 0.8);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 10px 14px;
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  min-width: 150px;
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

// Search section
const SearchSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  background: rgba(45, 45, 45, 0.8);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 10px 14px;
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  width: 100%;
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

// Spells grid
const SpellsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Loading and error states
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #d4af37;
  font-size: 1.4rem;
  font-weight: 600;
  font-family: 'Cinzel', serif;
`;

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

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;
  gap: 0.5rem;
  color: #ccc;
`;

const PageButton = styled.button<{ isActive?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${(props) => (props.isActive ? '#d4af37' : '#555')};
  background: ${(props) =>
    props.isActive ? 'rgba(212, 175, 55, 0.2)' : 'rgba(35, 35, 35, 0.8)'};
  color: ${(props) => (props.isActive ? '#d4af37' : '#f0f0f0')};
  cursor: pointer;
  font-size: 0.9rem;
  min-width: 40px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.2);
    border-color: #d4af37;
    color: #d4af37;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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

const SpellsPageNew: React.FC = () => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(
    undefined
  );
  const [selectedSchool, setSelectedSchool] = useState<string | undefined>(
    undefined
  );
  const [selectedClass, setSelectedClass] = useState<string | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);

  const {
    error,
    isLoading,
    execute: fetchSpells,
  } = useApiCall(listSpells, {
    onSuccess: (payload) => {
      const spellResults = payload.spells ?? payload.items ?? [];
      setSpells(spellResults);
      if (payload.pagination) {
        setTotalPages(payload.pagination.pages);
        if (payload.pagination.page && payload.pagination.page !== currentPage) {
          setCurrentPage(payload.pagination.page);
        }
      } else {
        setTotalPages(1);
      }
    },
    onError: (result) => {
      if (isError(result)) {
        showError(result.error ?? 'Failed to load spells from the magical archives.', result.statusCode, result.errorCode);
      }
      setSpells([]);
      setTotalPages(1);
    },
  });

  const filters = useMemo<SpellFilters>(
    () => ({
      ...(selectedLevel !== undefined && { level: selectedLevel }),
      ...(selectedSchool && { school: selectedSchool }),
      ...(selectedClass && { className: selectedClass }),
      ...(searchTerm && { search: searchTerm }),
      page: currentPage,
      limit: itemsPerPage,
    }),
    [selectedLevel, selectedSchool, selectedClass, searchTerm, currentPage, itemsPerPage]
  );

  useEffect(() => {
    void fetchSpells(filters);
  }, [fetchSpells, filters]);

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
    <PageContainer>
      <ContentContainer>
        <Header>
          <h1>D&D Spells</h1>
          <p>Discover the Magic Within</p>
        </Header>

        <MainContainer>
          {/* Filters Section */}
          <FiltersSection>
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

            <FilterSelect
              value={selectedClass || ''}
              onChange={(e) =>
                setSelectedClass(
                  e.target.value === '' ? undefined : e.target.value
                )
              }
            >
              <option value="">All Classes</option>
              {CHARACTER_CLASSES.filter(c => !['Barbarian', 'Fighter', 'Monk', 'Rogue'].includes(c)).map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </FilterSelect>
          </FiltersSection>

          {/* Search Section */}
          <SearchSection>
            <SearchInput
              type="text"
              placeholder="Search spells..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchSection>

          {/* Content */}
          {isLoading && spells.length === 0 && (
            <LoadingContainer>
              <LoadingSpinner message="Loading spells..." />
            </LoadingContainer>
          )}

          {error && spells.length === 0 && (
            <ErrorContainer>
              <div className="error-title">Error Loading Spells</div>
              <div className="error-message">{error}</div>
              <button onClick={() => fetchSpells(filters)}>Retry Incantation</button>
            </ErrorContainer>
          )}

          {!isLoading && !error && spells.length === 0 && (
            <NoResultsMessage>
              <div className="title">No Spells Found</div>
              <div className="subtitle">
                Try different search terms or adjust your filters
              </div>
            </NoResultsMessage>
          )}

          {spells.length > 0 && (
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
        </MainContainer>
      </ContentContainer>
      <SpellModal
        spell={selectedSpell}
        onClose={handleCloseModal}
        isOpen={selectedSpell !== null}
      />
    </PageContainer>
  );
};

export default SpellsPageNew;
