import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { listFeats } from '../services/featService';
import { Feat, isError } from '../types/api';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

// Modal Overlay
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  /* No overflow - backdrop doesn't scroll */
`;

// Feat Selection Popup Styles
const FeatPopupModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #ce9016;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 900px;
  width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
`;

const FeatModalHeader = styled.div`
  padding: 20px 20px 0;
  flex-shrink: 0;
`;

const FeatPopupTitle = styled.h3`
  color: #ce9016;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const FeatModalBody = styled.div`
  padding: 0 20px;
  overflow-y: auto;
  flex: 1;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(206, 144, 22, 0.5);
    border-radius: 5px;

    &:hover {
      background: rgba(206, 144, 22, 0.7);
    }
  }
`;

const FeatModalFooter = styled.div`
  padding: 0 20px 20px;
  flex-shrink: 0;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  background: rgba(139, 105, 20, 0.2);
  border: 2px solid #8b6914;
  border-radius: 6px;
  color: #f4e7d1;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
  }

  &::placeholder {
    color: rgba(244, 231, 209, 0.5);
  }
`;

const FeatGrid = styled.div`
  display: grid;
  gap: 15px;
  margin: 20px 0;
`;

const FeatCard = styled.div<{ selected?: boolean }>`
  background: ${props => props.selected ? 'rgba(206, 144, 22, 0.2)' : 'rgba(139, 105, 20, 0.1)'};
  border: 2px solid ${props => props.selected ? '#ce9016' : 'rgba(139, 105, 20, 0.3)'};
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(206, 144, 22, 0.15);
    border-color: #ce9016;
    transform: translateY(-1px);
  }
`;

const FeatName = styled.div`
  font-weight: 600;
  color: #ce9016;
  margin-bottom: 8px;
  font-size: 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FeatCategory = styled.span`
  font-size: 0.8rem;
  color: #8b6914;
  font-weight: 400;
  text-transform: capitalize;
`;

const FeatPrerequisite = styled.div`
  font-size: 0.85rem;
  color: #ff6b6b;
  margin-bottom: 8px;
  font-style: italic;
`;

const FeatDescription = styled.div`
  font-size: 0.9rem;
  color: #c4b49d;
  line-height: 1.5;
  font-family: 'Crimson Text', serif;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #8b6914;
  font-style: italic;
  padding: 40px;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: #ff6b6b;
  padding: 20px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 6px;
  margin: 20px 0;
`;

const CategoryFilter = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
`;

const CategoryButton = styled.button<{ active?: boolean }>`
  padding: 6px 12px;
  background: ${props => props.active ? 'linear-gradient(145deg, #ce9016, #b8860b)' : 'rgba(139, 105, 20, 0.2)'};
  color: ${props => props.active ? '#2c1810' : '#f4e7d1'};
  border: 2px solid ${props => props.active ? '#ce9016' : '#8b6914'};
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: capitalize;

  &:hover {
    background: ${props => props.active ? 'linear-gradient(145deg, #b8860b, #a0801b)' : 'rgba(206, 144, 22, 0.2)'};
    border-color: #ce9016;
  }
`;

const FeatButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
`;

const CancelButton = styled(Button)`
  background: rgba(139, 69, 19, 0.8);
  color: #f4e7d1;

  &:hover {
    background: rgba(139, 69, 19, 1);
    transform: translateY(-2px);
  }
`;

const ConfirmButton = styled(Button)<{ disabled?: boolean }>`
  background: ${props => props.disabled ? 'rgba(206, 144, 22, 0.3)' : 'linear-gradient(145deg, #ce9016, #b8860b)'};
  color: ${props => props.disabled ? '#8a8a8a' : '#2c1810'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, #b8860b, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(206, 144, 22, 0.4);
  }
`;

// Props interface
interface FeatSelectionModalProps {
  isOpen: boolean;
  selectedFeats: string[];
  maxFeats?: number;
  onFeatToggle: (featName: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  level?: number; // Filter feats by character level
}

const FeatSelectionModal: React.FC<FeatSelectionModalProps> = ({
  isOpen,
  selectedFeats,
  maxFeats = 1,
  onFeatToggle,
  onConfirm,
  onCancel,
}) => {
  const [feats, setFeats] = useState<Feat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  // Fetch feats when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFeats();
    }
  }, [isOpen]);

  const fetchFeats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listFeats();

      if (isError(result)) {
        setError(result.error ?? 'Failed to load feats');
        return;
      }

      setFeats(result.data);
    } catch (err) {
      setError('Error fetching feats: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from feats
  const categories = ['all', ...new Set(feats.map(feat => feat.category || 'general'))];

  // Filter feats based on search and category
  const filteredFeats = feats.filter(feat => {
    const matchesSearch = searchTerm === '' ||
      feat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (feat.entries && feat.entries.some((entry: any) =>
        typeof entry === 'string' && entry.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    const matchesCategory = selectedCategory === 'all' ||
      (feat.category || 'general') === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Format prerequisite text
  const formatPrerequisite = (feat: Feat) => {
    const prereqs = [];
    if (feat.prerequisites) {
      // Parse prerequisite from JSON if needed
      try {
        const prereqData = typeof feat.prerequisites === 'string' ?
          JSON.parse(feat.prerequisites) : feat.prerequisites;

        if (prereqData.level) prereqs.push(`Level ${prereqData.level}+`);
        if (prereqData.ability) prereqs.push(prereqData.ability);
        if (prereqData.proficiency) prereqs.push(prereqData.proficiency);
        if (prereqData.spellcasting) prereqs.push('Spellcasting');
        if (prereqData.other) prereqs.push(prereqData.other);
      } catch {
        // If not JSON, use as is
        if (feat.prerequisites) prereqs.push(feat.prerequisites.toString());
      }
    }
    return prereqs.length > 0 ? `Prerequisite: ${prereqs.join(', ')}` : '';
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <FeatPopupModal>
        <FeatModalHeader>
          <FeatPopupTitle>
            Select {maxFeats > 1 ? `Up to ${maxFeats} Feats` : 'a Feat'}
            {selectedFeats.length > 0 && ` (${selectedFeats.length}/${maxFeats})`}
          </FeatPopupTitle>
        </FeatModalHeader>

        <FeatModalBody>
          {loading ? (
            <LoadingMessage>⚔️ Loading feats...</LoadingMessage>
          ) : error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : (
            <>
              <SearchBar
                type="text"
                placeholder="Search feats by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <CategoryFilter>
                {categories.map(category => (
                  <CategoryButton
                    key={category}
                    active={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </CategoryButton>
                ))}
              </CategoryFilter>

              <FeatGrid>
                {filteredFeats.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#8b6914', padding: '20px' }}>
                    No feats found matching your criteria
                  </div>
                ) : (
                  filteredFeats.map((feat) => (
                    <FeatCard
                      key={feat.id}
                      selected={selectedFeats.includes(feat.name)}
                      onClick={() => onFeatToggle(feat.name)}
                    >
                      <FeatName>
                        {feat.name}
                        {feat.category && <FeatCategory>{feat.category}</FeatCategory>}
                      </FeatName>
                      {formatPrerequisite(feat) && (
                        <FeatPrerequisite>{formatPrerequisite(feat)}</FeatPrerequisite>
                      )}
                      <FeatDescription>
                        {feat.entries ? (
                          Array.isArray(feat.entries) ?
                            feat.entries.map((entry: any, idx: number) =>
                              <div key={idx}>{typeof entry === 'string' ? entry : JSON.stringify(entry)}</div>
                            ) :
                            <div>{typeof feat.entries === 'string' ? feat.entries : JSON.stringify(feat.entries)}</div>
                        ) : 'No description available'}
                      </FeatDescription>
                    </FeatCard>
                  ))
                )}
              </FeatGrid>
            </>
          )}
        </FeatModalBody>

        <FeatModalFooter>
          <FeatButtonsContainer>
            <CancelButton onClick={onCancel}>
              Cancel
            </CancelButton>
            <ConfirmButton
              onClick={onConfirm}
              disabled={selectedFeats.length === 0 || selectedFeats.length > maxFeats}
            >
              Confirm Selection
            </ConfirmButton>
          </FeatButtonsContainer>
        </FeatModalFooter>
      </FeatPopupModal>
    </ModalOverlay>
  );
};

export default FeatSelectionModal;
