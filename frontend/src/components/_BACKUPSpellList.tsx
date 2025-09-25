import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SpellCard from './SpellCard';
import { Spell } from '../types/api';
import { spellService, SpellFilters } from '../services';

// Styled components for parchment theme
const ListContainer = styled.div`
  position: relative;

  @media (max-width: 768px) {
    padding: 0 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 0 0.25rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #8b7355;
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Georgia', serif;
  background: rgba(255, 248, 240, 0.8);
  border-radius: 12px;
  border: 2px solid rgba(139, 115, 85, 0.3);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #8b4513;
  text-align: center;
  background: rgba(255, 235, 220, 0.9);
  border-radius: 12px;
  border: 2px solid #d4af7a;
  padding: 2rem;
  font-family: 'Georgia', serif;

  button {
    background: linear-gradient(135deg, #d4af7a 0%, #8b7355 100%);
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    font-family: 'Georgia', serif;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #cd853f 100%);
  border-radius: 12px;
  border: 2px solid #654321;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(205, 133, 63, 0.4);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="paper"><feTurbulence baseFrequency="0.04" numOctaves="5" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="1"/></filter></defs><rect width="100" height="100" fill="rgba(160,82,45,0.1)" filter="url(%23paper)"/></svg>')
      repeat;
    border-radius: 12px;
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 500px;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-family: 'Georgia', serif;
  border: 2px solid #654321;
  border-radius: 8px;
  background: linear-gradient(135deg, #f5f5dc 0%, #fffacd 100%);
  color: #4a4a4a;
  outline: none;
  position: relative;
  z-index: 1;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &::placeholder {
    color: #8b4513;
    font-style: italic;
    opacity: 0.7;
  }

  &:focus {
    border-color: #8b4513;
    box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.2),
      inset 0 2px 4px rgba(0, 0, 0, 0.1);
    background: linear-gradient(135deg, #fffacd 0%, #fff8dc 100%);
    transform: translateY(-1px);
  }
`;

const SpellsGrid = styled.div<{ compact?: boolean }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.compact
      ? 'repeat(auto-fill, minmax(300px, 1fr))'
      : 'repeat(auto-fill, minmax(400px, 1fr))'};
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 0 0.25rem;
    gap: 0.75rem;
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  color: #8b7355;
  font-size: 1.1rem;
  margin-top: 3rem;
  padding: 2rem;
  background: rgba(255, 248, 240, 0.8);
  border-radius: 12px;
  border: 2px solid rgba(139, 115, 85, 0.3);
  font-family: 'Georgia', serif;
  font-style: italic;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #cd853f 100%);
  border-radius: 12px;
  border: 2px solid #654321;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(205, 133, 63, 0.4);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="paper"><feTurbulence baseFrequency="0.04" numOctaves="5" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="1"/></filter></defs><rect width="100" height="100" fill="rgba(160,82,45,0.1)" filter="url(%23paper)"/></svg>')
      repeat;
    border-radius: 12px;
    pointer-events: none;
  }
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  padding: 0.75rem 1rem;
  border: 2px solid ${(props) => (props.active ? '#654321' : '#8B4513')};
  border-radius: 8px;
  background: ${(props) =>
    props.active
      ? 'linear-gradient(135deg, #654321 0%, #4A4A4A 100%)'
      : 'linear-gradient(135deg, #F5F5DC 0%, #FFFACD 100%)'};
  color: ${(props) => (props.active ? '#F5F5DC' : '#4A4A4A')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-shadow: ${(props) =>
    props.active ? '2px 2px 4px rgba(0, 0, 0, 0.5)' : 'none'};
  min-width: 45px;
  position: relative;
  z-index: 1;
  box-shadow: ${(props) =>
    props.active
      ? '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(205, 133, 63, 0.2)'
      : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3),
      ${(props) =>
        props.active
          ? 'inset 0 1px 0 rgba(205, 133, 63, 0.2)'
          : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'};
    background: ${(props) =>
      props.active
        ? 'linear-gradient(135deg, #4A4A4A 0%, #2F2F2F 100%)'
        : 'linear-gradient(135deg, #FFFACD 0%, #FFF8DC 100%)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PaginationInfo = styled.span`
  color: #f5f5dc;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 0.95rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
`;

interface SpellListProps {
  filters?: SpellFilters;
  onSpellClick?: (spell: Spell) => void;
  compact?: boolean;
  showSearch?: boolean;
}

const SpellList: React.FC<SpellListProps> = ({
  filters = {},
  onSpellClick,
  compact = false,
  showSearch = false,
}) => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadSpells();
  }, [filters, searchTerm, currentPage]);

  const loadSpells = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchFilters: SpellFilters = {
        ...filters,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.search && !searchTerm && { search: filters.search }),
        page: currentPage,
      };

      const response = await spellService.getAll(searchFilters);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setSpells(response.data.spells || []);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      setError('Failed to load spells');
      console.error('Error loading spells:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return <LoadingContainer>Loading spells...</LoadingContainer>;
  }

  if (error) {
    return (
      <ErrorContainer>
        <div>Error: {error}</div>
        <button onClick={loadSpells}>Retry</button>
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
            placeholder="Search spells..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </SearchContainer>
      )}

      {/* Spell Grid */}
      {spells.length === 0 ? (
        <NoResultsMessage>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            No spells found
          </div>
          <div>Try adjusting your search or filter criteria.</div>
        </NoResultsMessage>
      ) : (
        <>
          <SpellsGrid compact={compact}>
            {spells.map((spell) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                onClick={onSpellClick ? () => onSpellClick(spell) : undefined}
                compact={compact}
              />
            ))}
          </SpellsGrid>

          {/* Pagination */}
          {totalPages > 1 && (
            <PaginationContainer>
              <PaginationButton
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </PaginationButton>

              <PaginationInfo>
                Page {currentPage} of {totalPages}
              </PaginationInfo>

              <PaginationButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </PaginationButton>
            </PaginationContainer>
          )}
        </>
      )}
    </ListContainer>
  );
};

export default SpellList;
