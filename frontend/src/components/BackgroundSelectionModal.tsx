import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { listBackgrounds } from '@/services/backgroundService';
import { Background as ApiBackground, isError } from '../types/api';
import { processTraitDescription } from '../utils/textProcessor';
import { useApiCall } from '@/hooks/useApiCall';
import LoadingSpinner from '@/components/LoadingSpinner';
import { showError } from '@/utils/errorDisplay';
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
`;

// Background Selection Popup Styles
const BackgroundPopupModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #ce9016;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 800px;
  width: 85%;
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

const BackgroundPopupTitle = styled.h3`
  color: #ce9016;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const BackgroundDescription = styled.p`
  color: #f4e7d1;
  font-size: 0.9rem;
  margin: 10px 0 20px 0;
  line-height: 1.4;
  text-align: center;
  font-style: italic;
`;


const BackgroundChoicesTitle = styled.h4`
  color: #ce9016;
  margin: 0 0 10px 0;
  font-size: 1rem;
  text-align: center;
  text-transform: uppercase;
`;

const BackgroundChoicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin: 10px 0;
`;

const BackgroundChoice = styled.div<{ selected?: boolean }>`
  background: ${props => props.selected ? 'rgba(206, 144, 22, 0.2)' : 'rgba(139, 105, 20, 0.1)'};
  border: 2px solid ${props => props.selected ? '#ce9016' : 'rgba(139, 105, 20, 0.3)'};
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-size: 0.9rem;
  color: ${props => props.selected ? '#ce9016' : '#f4e7d1'};

  &:hover {
    background: rgba(206, 144, 22, 0.15);
    border-color: #ce9016;
    transform: translateY(-1px);
  }
`;

const BackgroundButtonsContainer = styled.div`
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

const ErrorMessage = styled.div`
  text-align: center;
  color: #ff6b6b;
  padding: 2rem;
  font-size: 1rem;
`;

// Background details display
const BackgroundDetails = styled.div`
  margin-top: 1rem;

  .skill-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.5rem 0;

    .skill-item {
      background: rgba(206, 144, 22, 0.2);
      border: 1px solid rgba(206, 144, 22, 0.4);
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      color: #ce9016;
    }
  }

  .tool-proficiency {
    background: rgba(26, 26, 26, 0.6);
    border: 1px solid #444;
    border-radius: 4px;
    padding: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #ccc;

    .label {
      color: #ce9016;
      font-weight: 600;
      margin-right: 0.5rem;
    }
  }
`;

// Props interface
interface BackgroundSelectionModalProps {
  isOpen: boolean;
  onBackgroundSelect: (background: ApiBackground) => void;
  onCancel: () => void;
}

const BackgroundSelectionModal: React.FC<BackgroundSelectionModalProps> = ({
  isOpen,
  onBackgroundSelect,
  onCancel
}) => {
  useBodyScrollLock(isOpen);

  const [selectedBackground, setSelectedBackground] = useState<ApiBackground | null>(null);
  const {
    data: backgroundData,
    error,
    isLoading,
    execute: fetchBackgrounds,
  } = useApiCall(listBackgrounds, {
    onError: (result) => {
      if (isError(result)) {
        showError(result.error ?? 'Failed to load backgrounds', result.statusCode, result.errorCode);
      }
    },
  });
  const backgrounds = backgroundData ?? [];

  useEffect(() => {
    if (isOpen) {
      fetchBackgrounds();
    }
  }, [fetchBackgrounds, isOpen]);

  const handleBackgroundClick = (background: ApiBackground) => {
    setSelectedBackground(background);
  };

  const handleConfirm = () => {
    if (selectedBackground) {
      onBackgroundSelect(selectedBackground);
      handleCancel();
    }
  };

  const handleCancel = () => {
    setSelectedBackground(null);
    onCancel();
  };

  const formatSkillProficiencies = (skillProficiencies: any): string[] => {
    if (!skillProficiencies) return [];

    if (Array.isArray(skillProficiencies)) {
      return skillProficiencies.map(skill =>
        typeof skill === 'string' ? skill :
        skill.name || JSON.stringify(skill)
      );
    }

    if (typeof skillProficiencies === 'object' && skillProficiencies.choose) {
      return skillProficiencies.choose.from || [];
    }

    return [skillProficiencies.toString()];
  };

  const formatToolProficiencies = (toolProficiencies: any): string => {
    if (!toolProficiencies) return 'None';

    if (Array.isArray(toolProficiencies)) {
      return toolProficiencies.map(tool =>
        typeof tool === 'string' ? tool :
        tool.name || JSON.stringify(tool)
      ).join(', ');
    }

    if (typeof toolProficiencies === 'string') {
      return toolProficiencies;
    }

    return JSON.stringify(toolProficiencies);
  };

  if (!isOpen) return null;

  if (isLoading && backgrounds.length === 0) {
    return (
      <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
        <BackgroundPopupModal onClick={(e) => e.stopPropagation()}>
          <LoadingSpinner message="Loading backgrounds..." />
        </BackgroundPopupModal>
      </ModalOverlay>
    );
  }

  if (error && backgrounds.length === 0) {
    return (
      <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
        <BackgroundPopupModal onClick={(e) => e.stopPropagation()}>
          <ErrorMessage>Error: {error}</ErrorMessage>
          <BackgroundButtonsContainer>
            <CancelButton onClick={handleCancel}>Close</CancelButton>
          </BackgroundButtonsContainer>
        </BackgroundPopupModal>
      </ModalOverlay>
    );
  }

  if (selectedBackground) {
    const skills = formatSkillProficiencies(selectedBackground.skillProficiencies);
    const tools = formatToolProficiencies(selectedBackground.equipment);

    return (
      <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
        <BackgroundPopupModal onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <BackgroundPopupTitle>
              {selectedBackground.name} Background
            </BackgroundPopupTitle>
          </ModalHeader>

          <ModalBody>
            <BackgroundDescription
              dangerouslySetInnerHTML={{
                __html: processTraitDescription(selectedBackground.description)
              }}
            />

            <BackgroundDetails>
              <BackgroundChoicesTitle>Skills:</BackgroundChoicesTitle>
              <div className="skill-list">
                {skills.map((skill, index) => (
                  <div key={index} className="skill-item">{skill}</div>
                ))}
              </div>

              <div className="tool-proficiency">
                <span className="label">Tool Proficiency:</span>
                {tools}
              </div>
            </BackgroundDetails>

            <BackgroundButtonsContainer>
              <CancelButton onClick={() => setSelectedBackground(null)}>
                Back
              </CancelButton>
              <ConfirmButton onClick={handleConfirm}>
                Select {selectedBackground.name}
              </ConfirmButton>
            </BackgroundButtonsContainer>
          </ModalBody>
        </BackgroundPopupModal>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
      <BackgroundPopupModal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <BackgroundPopupTitle>
            Choose Your Background
          </BackgroundPopupTitle>
        </ModalHeader>

        <ModalBody>
          <BackgroundDescription>
            Select your character's background from the available options below.
          </BackgroundDescription>

          <BackgroundChoicesGrid>
            {backgrounds.map((background) => (
              <BackgroundChoice
                key={background.id}
                onClick={() => handleBackgroundClick(background)}
              >
                {background.name}
              </BackgroundChoice>
            ))}
          </BackgroundChoicesGrid>

          <BackgroundButtonsContainer>
            <CancelButton onClick={handleCancel}>
              Cancel
            </CancelButton>
          </BackgroundButtonsContainer>
        </ModalBody>
      </BackgroundPopupModal>
    </ModalOverlay>
  );
};

export default BackgroundSelectionModal;
