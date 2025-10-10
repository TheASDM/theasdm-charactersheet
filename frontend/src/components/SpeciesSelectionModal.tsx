import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import speciesService from '../services/speciesService';
import { Species as ApiSpecies } from '../types/api';
import { processTraitDescription } from '../utils/textProcessor';
import LoadingSpinner from '@/components/LoadingSpinner';
import { logger } from '../utils/logger';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

// Import modal shared styles - we'll create these later
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
`;

// Species Selection Popup Styles
const SpeciesPopupModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #ce9016;
  border-radius: 10px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 20px 20px 0 20px;
  flex-shrink: 0;
`;

const ModalBody = styled.div`
  padding: 0 20px 20px 20px;
  overflow-y: auto;
  flex: 1;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(35, 35, 35, 0.5);
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ce9016;
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #b8860b;
  }
`;

const SpeciesPopupTitle = styled.h3`
  color: #ce9016;
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  text-align: center;
  text-transform: uppercase;
`;

const SpeciesDescription = styled.p`
  color: #f4e7d1;
  font-size: 0.9rem;
  margin: 10px 0 15px 0;
  line-height: 1.4;
`;


const SpeciesChoicesTitle = styled.h4`
  color: #ce9016;
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  text-transform: uppercase;
`;

const SpeciesChoicesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 15px;
`;

const SpeciesChoice = styled.div<{ selected?: boolean }>`
  background: ${props => props.selected ? 'rgba(206, 144, 22, 0.2)' : 'rgba(42, 37, 32, 0.5)'};
  border: 2px solid ${props => props.selected ? '#ce9016' : 'rgba(206, 144, 22, 0.3)'};
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.15);
    transform: translateY(-1px);
  }
`;

const SpeciesChoiceName = styled.div`
  font-weight: 600;
  color: #ce9016;
  margin-bottom: 4px;
  font-size: 0.9rem;
`;

const SpeciesChoiceDescription = styled.div`
  font-size: 0.75rem;
  color: #c4b49d;
  line-height: 1.3;
`;

const SpeciesButtonsContainer = styled.div`
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

// Loading and error states
const ModalLoadingWrapper = styled.div`
  text-align: center;
  color: #ce9016;
  padding: 2rem;
  font-size: 1.1rem;
`;

const ModalErrorMessage = styled.div`
  text-align: center;
  color: #ff6b6b;
  padding: 2rem;
  font-size: 1rem;
`;

// Trait display components
const TraitsList = styled.div`
  margin-top: 1rem;

  .trait-item {
    background: rgba(26, 26, 26, 0.4);
    border: 1px solid #444;
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;

    .trait-name {
      color: #ce9016;
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }

    .trait-description {
      color: #ccc;
      font-size: 0.8rem;
      line-height: 1.3;
    }
  }
`;

// Props interface
interface SpeciesSelectionModalProps {
  isOpen: boolean;
  onSpeciesSelect: (species: ApiSpecies) => void;
  onCancel: () => void;
}

const SpeciesSelectionModal: React.FC<SpeciesSelectionModalProps> = ({
  isOpen,
  onSpeciesSelect,
  onCancel
}) => {
  useBodyScrollLock(isOpen);

  const [species, setSpecies] = useState<ApiSpecies[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<ApiSpecies | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSpecies();
    }
  }, [isOpen]);

  const fetchSpecies = async () => {
    try {
      setIsLoading(true);
      const response = await speciesService.getAll();
      if (response.data) {
        setSpecies(response.data);
      } else {
        setError(response.error || 'Failed to load species');
      }
    } catch (err) {
      logger.error('Error fetching species:', err);
      setError('Failed to load species');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeciesClick = (speciesData: ApiSpecies) => {
    setSelectedSpecies(speciesData);
  };

  const handleConfirm = () => {
    if (selectedSpecies) {
      onSpeciesSelect(selectedSpecies);
      handleCancel();
    }
  };

  const handleCancel = () => {
    setSelectedSpecies(null);
    onCancel();
  };

  const getSpeciesSize = (size: string | string[]): string => {
    if (Array.isArray(size)) {
      return size.join(' or ');
    }
    return size === 'Medium' ? 'Medium' : 'Small';
  };

  const renderTraits = (traits: any[]) => {
    if (!traits || traits.length === 0) return null;

    return (
      <TraitsList>
        {traits.slice(0, 3).map((trait, index) => (
          <div key={index} className="trait-item">
            <div className="trait-name">{trait.name || `Trait ${index + 1}`}</div>
            <div
              className="trait-description"
              dangerouslySetInnerHTML={{
                __html: processTraitDescription(trait.description)
              }}
            />
          </div>
        ))}
      </TraitsList>
    );
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
        <SpeciesPopupModal onClick={(e) => e.stopPropagation()}>
          <ModalLoadingWrapper>
            <LoadingSpinner message="Loading species..." />
          </ModalLoadingWrapper>
        </SpeciesPopupModal>
      </ModalOverlay>
    );
  }

  if (error) {
    return (
      <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
        <SpeciesPopupModal onClick={(e) => e.stopPropagation()}>
          <ModalErrorMessage>Error: {error}</ModalErrorMessage>
          <SpeciesButtonsContainer>
            <CancelButton onClick={handleCancel}>Close</CancelButton>
          </SpeciesButtonsContainer>
        </SpeciesPopupModal>
      </ModalOverlay>
    );
  }

  if (selectedSpecies) {
    return (
      <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
        <SpeciesPopupModal onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <SpeciesPopupTitle>
              {selectedSpecies.name}
            </SpeciesPopupTitle>
          </ModalHeader>

          <ModalBody>
            <SpeciesDescription>
              {getSpeciesSize(selectedSpecies.size)} {selectedSpecies.creatureType} • {selectedSpecies.speed} ft Speed
            </SpeciesDescription>

            {selectedSpecies.traits && selectedSpecies.traits.length > 0 && (
              <>
                <SpeciesChoicesTitle>Species Traits:</SpeciesChoicesTitle>
                {renderTraits(selectedSpecies.traits)}
              </>
            )}

            <SpeciesButtonsContainer>
              <CancelButton onClick={() => setSelectedSpecies(null)}>
                Back
              </CancelButton>
              <ConfirmButton onClick={handleConfirm}>
                Select {selectedSpecies.name}
              </ConfirmButton>
            </SpeciesButtonsContainer>
          </ModalBody>
        </SpeciesPopupModal>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
      <SpeciesPopupModal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <SpeciesPopupTitle>
            Choose Your Species
          </SpeciesPopupTitle>
        </ModalHeader>

        <ModalBody>
          <SpeciesDescription>
            Select your character's species from the available options below.
          </SpeciesDescription>

          <SpeciesChoicesGrid>
            {species.map((speciesOption) => (
              <SpeciesChoice
                key={speciesOption.id}
                onClick={() => handleSpeciesClick(speciesOption)}
              >
                <SpeciesChoiceName>{speciesOption.name}</SpeciesChoiceName>
                <SpeciesChoiceDescription>
                  {getSpeciesSize(speciesOption.size)} • {speciesOption.speed} ft Speed
                  {speciesOption.traits && speciesOption.traits.length > 0 && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>
                      {speciesOption.traits.slice(0, 2).map((trait: any) => trait.name).join(', ')}
                      {speciesOption.traits.length > 2 && '...'}
                    </div>
                  )}
                </SpeciesChoiceDescription>
              </SpeciesChoice>
            ))}
          </SpeciesChoicesGrid>

          <SpeciesButtonsContainer>
            <CancelButton onClick={handleCancel}>
              Cancel
            </CancelButton>
          </SpeciesButtonsContainer>
        </ModalBody>
      </SpeciesPopupModal>
    </ModalOverlay>
  );
};

export default SpeciesSelectionModal;