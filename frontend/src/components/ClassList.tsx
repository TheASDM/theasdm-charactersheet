import React, { useState, useEffect } from 'react';
import ClassCard from './ClassCard';
import { CharacterClass } from '../types/api';
import { classService } from '../services';

interface ClassListProps {
  onLevelsClick?: (characterClass: CharacterClass) => void;
  onDetailsClick?: (characterClass: CharacterClass) => void;
  showSearch?: boolean;
  compact?: boolean;
}

const ClassList: React.FC<ClassListProps> = ({
  onLevelsClick,
  onDetailsClick,
  showSearch = false,
  compact = false,
}) => {
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<CharacterClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    // Filter classes based on search term
    if (searchTerm.trim() === '') {
      setFilteredClasses(classes);
    } else {
      const filtered = classes.filter(
        (cls) =>
          cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.primaryAbility.some((ability) =>
            ability.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          (cls.spellcastingAbility &&
            cls.spellcastingAbility
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
      setFilteredClasses(filtered);
    }
  }, [searchTerm, classes]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await classService.getAll();

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setClasses(response.data);
        setFilteredClasses(response.data);
      }
    } catch (err) {
      setError('Failed to load classes');
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
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
        <div>Loading classes...</div>
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
          onClick={loadClasses}
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
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 16px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '16px',
            marginTop: '40px',
          }}
        >
          {searchTerm
            ? 'No classes found matching your search.'
            : 'No classes available.'}
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
            {filteredClasses.map((characterClass) => (
              <ClassCard
                key={characterClass.id}
                characterClass={characterClass}
                onLevelsClick={
                  onLevelsClick
                    ? () => onLevelsClick(characterClass)
                    : undefined
                }
                onDetailsClick={
                  onDetailsClick
                    ? () => onDetailsClick(characterClass)
                    : undefined
                }
                compact={compact}
              />
            ))}
          </div>

          {/* Results Summary */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '20px',
              color: '#666',
              fontSize: '14px',
            }}
          >
            Showing {filteredClasses.length} of {classes.length} classes
          </div>
        </>
      )}
    </div>
  );
};

export default ClassList;
