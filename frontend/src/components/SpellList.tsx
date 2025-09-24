import React, { useState, useEffect } from 'react';
import SpellCard from './SpellCard';
import { Spell } from '../types/api';
import { spellService, SpellFilters } from '../services';

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
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: '#666',
        }}
      >
        <div>Loading spells...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: '#f44336',
        }}
      >
        <div>Error: {error}</div>
        <button
          onClick={loadSpells}
          style={{
            marginTop: '12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Search Bar */}
      {showSearch && (
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search spells..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>
      )}

      {/* Spell Grid */}
      {spells.length === 0 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            color: '#666',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            No spells found
          </div>
          <div style={{ fontSize: '14px' }}>
            Try adjusting your search or filter criteria.
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: compact
                ? 'repeat(auto-fill, minmax(250px, 1fr))'
                : 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '16px',
            }}
          >
            {spells.map((spell) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                onClick={onSpellClick ? () => onSpellClick(spell) : undefined}
                compact={compact}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '24px',
                gap: '8px',
              }}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                style={{
                  backgroundColor: currentPage <= 1 ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>

              <span style={{ margin: '0 16px', color: '#666' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{
                  backgroundColor:
                    currentPage >= totalPages ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SpellList;
