import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { SpellCard } from './';
import { Spell } from '../types/api';
import { listSpells, SpellFilters } from '@/services/spellService';
import { useApiCall } from '@/hooks/useApiCall';
import { showError } from '@/utils/errorDisplay';
import { isError } from '@/types/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

// Styled components updated for medieval forest green theme
const ListContainer = styled.div`
  position: relative;
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border-radius: 15px;
  border: 2px solid #8b6914;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(139, 105, 20, 0.3);
  padding: 30px;
  margin: 1rem 0;
  backdrop-filter: blur(10px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="paper"><feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/></filter></defs><rect width="100" height="100" fill="rgba(101,67,33,0.1)" filter="url(%23paper)"/></svg>')
      repeat;
    border-radius: 15px;
    pointer-events: none;
    opacity: 0.6;
    z-index: 1;
  }

  @media (max-width: 768px) {
    padding: 20px;
    margin: 0.5rem 0;
  }

  @media (max-width: 480px) {
    padding: 15px;
    margin: 0.25rem 0;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #ce9016;
  font-size: 1.4rem;
  font-weight: 600;
  font-family: 'Cinzel', serif;
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.6),
    rgba(74, 42, 26, 0.6)
  );
  border-radius: 15px;
  border: 2px solid #8b6914;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  position: relative;
  z-index: 2;
  backdrop-filter: blur(10px);
  letter-spacing: 1px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #ce9016;
  text-align: center;
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border-radius: 15px;
  border: 2px solid #8b6914;
  padding: 2rem;
  font-family: 'Cinzel', serif;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(10px);

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
    background: linear-gradient(145deg, #ce9016, #b8860b);
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
      box-shadow: 0 6px 20px rgba(206, 144, 22, 0.4);
      background: linear-gradient(145deg, #b8860b, #a0801b);
    }
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 25px;
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
  z-index: 2;
`;

const SearchInput = styled.input`
  background: linear-gradient(145deg, #4a2a1a, #3a1a0a);
  border: 2px solid #8b6914;
  border-radius: 12px;
  padding: 16px 20px;
  color: #ce9016;
  font-family: 'Crimson Text', serif;
  font-size: 18px;
  width: 100%;
  transition: all 0.3s ease;
  font-style: italic;
  outline: none;
  display: block;
  margin: 0 auto;
  max-width: 600px;

  &::placeholder {
    color: #a0824a;
    font-style: italic;
  }

  &:focus {
    border-color: #ce9016;
    box-shadow: 0 0 15px rgba(206, 144, 22, 0.3);
    font-style: normal;
    transform: translateY(-1px);
  }

  &:hover {
    border-color: #ce9016;
  }
`;

const SpellsGrid = styled.div<{ compact?: boolean }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.compact
      ? 'repeat(auto-fit, minmax(300px, 1fr))'
      : 'repeat(auto-fit, minmax(350px, 1fr))'};
  gap: 25px;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
  justify-items: stretch;
  width: 100%;
  contain: layout style;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 0 10px;
  }

  @media (max-width: 480px) {
    padding: 0 5px;
    gap: 15px;
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  color: #a0824a;
  font-size: 1.4rem;
  margin-top: 60px;
  padding: 60px 20px;
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.6),
    rgba(74, 42, 26, 0.6)
  );
  border: 2px solid #8b6914;
  border-radius: 15px;
  font-family: 'Cinzel', serif;
  font-style: italic;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 2;

  .title {
    font-size: 1.6rem;
    color: #ce9016;
    margin-bottom: 15px;
    font-weight: 600;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #b8860b;
    line-height: 1.5;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 40px;
  padding: 25px;
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border: 2px solid #8b6914;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 2;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  padding: 12px 20px;
  border: 2px solid ${(props) => (props.active ? '#ce9016' : '#8b6914')};
  border-radius: 8px;
  background: ${(props) =>
    props.active
      ? 'linear-gradient(145deg, #ce9016, #b8860b)'
      : 'linear-gradient(145deg, #4a2a1a, #3a1a0a)'};
  color: ${(props) => (props.active ? '#2c1810' : '#ce9016')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-shadow: ${(props) =>
    props.active ? '1px 1px 2px rgba(0, 0, 0, 0.5)' : 'none'};
  min-width: 80px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 14px;
  box-shadow: ${(props) =>
    props.active
      ? '0 4px 15px rgba(206, 144, 22, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.3)'};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${(props) =>
      props.active
        ? '0 6px 20px rgba(206, 144, 22, 0.4)'
        : '0 4px 15px rgba(139, 105, 20, 0.3)'};
    background: ${(props) =>
      props.active
        ? 'linear-gradient(145deg, #b8860b, #a0801b)'
        : 'linear-gradient(145deg, #5a3a2a, #4a2a1a)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;

    &:hover {
      transform: none;
      box-shadow: ${(props) =>
        props.active
          ? '0 4px 15px rgba(206, 144, 22, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)'};
    }
  }
`;

const PaginationInfo = styled.span`
  color: #ce9016;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
  padding: 0 20px;

  @media (max-width: 480px) {
    padding: 0;
    text-align: center;
  }
`;

interface SpellListProps {
  filters?: {
    level?: number;
    school?: string;
  };
  onSpellClick: (spell: Spell) => void;
  showSearch?: boolean;
}

const SpellList: React.FC<SpellListProps> = ({
  filters = {},
  onSpellClick,
  showSearch = false,
}) => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const debouncedSearchUpdate = useDebouncedCallback((term: string) => {
    setDebouncedSearchTerm(term);
    setCurrentPage(1);
  }, 300);

  useEffect(() => {
    debouncedSearchUpdate(searchTerm);
  }, [searchTerm, debouncedSearchUpdate]);

  const {
    error,
    isLoading,
    execute: fetchSpells,
  } = useApiCall(listSpells, {
    showErrorToast: false,
    onSuccess: (payload) => {
      const results = payload.spells ?? payload.items ?? [];
      setSpells(results);
      if (payload.pagination) {
        setTotalPages(payload.pagination.pages);
      } else {
        setTotalPages(Math.max(1, latestFiltersRef.current.page ?? 1));
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

  const latestFiltersRef = useRef<SpellFilters>({ page: 1 });

  const searchFilters = useMemo<SpellFilters>(
    () => ({
      ...filters,
      ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      page: currentPage,
    }),
    [filters, debouncedSearchTerm, currentPage]
  );

  const runSearch = useCallback(
    (nextFilters: SpellFilters) => {
      latestFiltersRef.current = nextFilters;
      void fetchSpells(nextFilters);
    },
    [fetchSpells]
  );

  useEffect(() => {
    runSearch(searchFilters);
  }, [runSearch, searchFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !isLoading) {
      setCurrentPage(newPage);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading && spells.length === 0) {
    return (
      <LoadingContainer>
        <LoadingSpinner message="Summoning spells from the arcane library..." />
      </LoadingContainer>
    );
  }

  if (error && spells.length === 0) {
    return (
      <ErrorContainer>
        <div className="error-title">🔮 Magical Interference Detected</div>
        <div className="error-message">{error}</div>
        <button onClick={() => runSearch(latestFiltersRef.current)}>Retry Incantation</button>
      </ErrorContainer>
    );
  }

  return (
    <ListContainer>
      {/* Search Bar */}
      {showSearch && (
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search the ancient grimoire..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </SearchContainer>
      )}

      {/* Spell Grid */}
      {spells.length === 0 ? (
        <NoResultsMessage>
          <div className="title">📜 No Spells Found in the Archives</div>
          <div className="subtitle">
            The magical energies have shifted. Try different search terms or
            adjust your mystical filters.
          </div>
        </NoResultsMessage>
      ) : (
        <>
          <SpellsGrid compact={false}>
            {spells.map((spell) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                onClick={onSpellClick ? () => onSpellClick(spell) : undefined}
                compact={false}
              />
            ))}
          </SpellsGrid>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <PaginationContainer>
              <PaginationButton
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
              >
                ← Previous
              </PaginationButton>

              <div
                style={{ display: 'flex', gap: '5px', alignItems: 'center' }}
              >
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <PaginationButton
                      onClick={() => handlePageChange(1)}
                      disabled={isLoading}
                    >
                      1
                    </PaginationButton>
                    {currentPage > 4 && (
                      <span style={{ color: '#ce9016', padding: '0 5px' }}>
                        ...
                      </span>
                    )}
                  </>
                )}

                {/* Pages around current */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageStart = Math.max(
                    1,
                    Math.min(currentPage - 2, totalPages - 4)
                  );
                  const pageNum = pageStart + i;

                  if (pageNum > totalPages) return null;

                  return (
                    <PaginationButton
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                    >
                      {pageNum}
                    </PaginationButton>
                  );
                })}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span style={{ color: '#ce9016', padding: '0 5px' }}>
                        ...
                      </span>
                    )}
                    <PaginationButton
                      onClick={() => handlePageChange(totalPages)}
                      disabled={isLoading}
                    >
                      {totalPages}
                    </PaginationButton>
                  </>
                )}
              </div>

              <PaginationInfo>
                Tome {currentPage} of {totalPages} ({spells.length} spells)
              </PaginationInfo>

              <PaginationButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
              >
                Next →
              </PaginationButton>
            </PaginationContainer>
          )}
        </>
      )}
    </ListContainer>
  );
};

export default SpellList;
