import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import backgroundService from '../services/backgroundService';
import { Background as ApiBackground } from '../types/api';
import { processTraitDescription } from '../utils/textProcessor';

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
  border: 3px solid #d4af37;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 800px;
  width: 85%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
`;

const BackgroundPopupTitle = styled.h3`
  color: #d4af37;
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
  color: #d4af37;
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
  background: ${props => props.selected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(139, 105, 20, 0.1)'};
  border: 2px solid ${props => props.selected ? '#d4af37' : 'rgba(139, 105, 20, 0.3)'};
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-size: 0.9rem;
  color: ${props => props.selected ? '#d4af37' : '#f4e7d1'};

  &:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: #d4af37;
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
  background: ${props => props.disabled ? 'rgba(212, 175, 55, 0.3)' : 'linear-gradient(145deg, #d4af37, #b8941f)'};
  color: ${props => props.disabled ? '#8a8a8a' : '#2c1810'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  }
`;

// Loading and error states
const LoadingSpinner = styled.div`
  text-align: center;
  color: #d4af37;
  padding: 2rem;
  font-size: 1.1rem;
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
      background: rgba(212, 175, 55, 0.2);
      border: 1px solid rgba(212, 175, 55, 0.4);
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      color: #d4af37;
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
      color: #d4af37;
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
  const [backgrounds, setBackgrounds] = useState<ApiBackground[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<ApiBackground | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBackgrounds();
    }
  }, [isOpen]);

  const fetchBackgrounds = async () => {
    try {
      setIsLoading(true);
      const response = await backgroundService.getAll();
      if (response.data) {
        setBackgrounds(response.data);
      } else {
        setError(response.error || 'Failed to load backgrounds');
      }
    } catch (err) {
      console.error('Error fetching backgrounds:', err);
      setError('Failed to load backgrounds');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
        <BackgroundPopupModal onClick={(e) => e.stopPropagation()}>
          <LoadingSpinner>Loading backgrounds...</LoadingSpinner>
        </BackgroundPopupModal>
      </ModalOverlay>
    );
  }

  if (error) {
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
          <BackgroundPopupTitle>
            {selectedBackground.name} Background
          </BackgroundPopupTitle>

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
        </BackgroundPopupModal>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
      <BackgroundPopupModal onClick={(e) => e.stopPropagation()}>
        <BackgroundPopupTitle>
          Choose Your Background
        </BackgroundPopupTitle>

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
      </BackgroundPopupModal>
    </ModalOverlay>
  );
};

export default BackgroundSelectionModal;