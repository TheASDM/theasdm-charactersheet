import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ClassCard from './ClassCard';
import { CharacterClass } from '../types/api';
import { useApiCall } from '@/hooks/useApiCall';
import { listClasses } from '@/services/classService';

// Search and filter section
const FilterSection = styled.div`
  margin-bottom: 2rem;
`;

const SearchInput = styled.input`
  background: rgba(45, 45, 45, 0.8);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px 16px;
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
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

// Classes grid
const ClassesGrid = styled.div<{ compact?: boolean }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
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

const ResultsSummary = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: #d4af37;
  font-size: 0.95rem;
  background: rgba(45, 45, 45, 0.5);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #444;
`;

interface ClassListProps {
  showSearch?: boolean;
  compact?: boolean;
}

const ClassList: React.FC<ClassListProps> = ({
  showSearch = false,
  compact = false,
}) => {
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<CharacterClass[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: classData,
    error,
    isLoading,
    execute: fetchClasses,
  } = useApiCall(listClasses, {
    onSuccess: (fetched) => {
      setClasses(fetched);
    },
  });

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

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

  useEffect(() => {
    if (classData) {
      setClasses(classData);
    }
  }, [classData]);

  if (isLoading) {
    return (
      <LoadingContainer>
        Loading classes...
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <div className="error-title">Error Loading Classes</div>
        <div className="error-message">{error}</div>
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
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FilterSection>
      )}

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <NoResultsMessage>
          <div className="title">No Classes Found</div>
          <div className="subtitle">
            Try different search terms to find classes
          </div>
        </NoResultsMessage>
      ) : (
        <>
          <ClassesGrid compact={compact}>
            {filteredClasses.map((characterClass) => (
              <ClassCard
                key={characterClass.id}
                characterClass={characterClass}
              />
            ))}
          </ClassesGrid>

          {/* Results Summary */}
          <ResultsSummary>
            Showing {filteredClasses.length} of {classes.length} classes
          </ResultsSummary>
        </>
      )}
    </>
  );
};

export default ClassList;
