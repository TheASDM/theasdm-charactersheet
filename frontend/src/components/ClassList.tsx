import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ClassCard from './ClassCard';
import { CharacterClass } from '../types/api';
import { classService } from '../services';

// Search and filter section (matching feats page)
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

// Classes grid (matching feats page)
const ClassesGrid = styled.div<{ compact?: boolean }>`
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

// Loading and error states (matching feats page)
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

const ResultsSummary = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: #d4af37;
  font-size: 0.95rem;
  font-family: 'Cinzel', serif;
  font-style: italic;
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.6),
    rgba(74, 42, 26, 0.6)
  );
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #8b6914;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
`;

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
      setError('Failed to load classes from the ancient tomes.');
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        📚 Gathering Ancient Knowledge from the Guild Halls...
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <div className="error-title">⚔️ Ancient Scrolls Unavailable</div>
        <div className="error-message">{error}</div>
        <button onClick={loadClasses}>Retry Incantation</button>
      </ErrorContainer>
    );
  }

  return (
    <>
      {/* Search Bar */}
      {showSearch && (
        <FilterSection>
          <SearchInput
            type="text"
            placeholder="Search the guild archives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FilterSection>
      )}

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <NoResultsMessage>
          <div className="title">⚔️ No Classes Found in the Archives</div>
          <div className="subtitle">
            The ancient knowledge remains hidden. Try different search terms to
            find your destined path.
          </div>
        </NoResultsMessage>
      ) : (
        <>
          <ClassesGrid compact={compact}>
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
          </ClassesGrid>

          {/* Results Summary */}
          <ResultsSummary>
            Revealing {filteredClasses.length} of {classes.length} legendary
            classes
          </ResultsSummary>
        </>
      )}
    </>
  );
};

export default ClassList;
