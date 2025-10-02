import React from 'react';
import styled from 'styled-components';

interface AbilityScoreMethodModalProps {
  isOpen: boolean;
  onSelect: (method: 'standard-array' | 'custom') => void;
  onClose?: () => void;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid #d4af37;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  color: #f0f0f0;
  text-align: center;
  position: relative;

  h2 {
    font-family: 'Cinzel', serif;
    color: #d4af37;
    font-size: 1.8rem;
    margin: 0 0 1rem 0;
  }

  .modal-description {
    color: #ccc;
    margin-bottom: 2rem;
    font-size: 1rem;
    line-height: 1.4;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #d4af37;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: all 0.3s ease;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #f0c851;
    transform: scale(1.1);
  }
`;

const MethodGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 2rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const MethodCard = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid #444;
  border-radius: 8px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(212, 175, 55, 0.3);
  }

  .method-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .method-title {
    font-family: 'Cinzel', serif;
    color: #d4af37;
    font-size: 1.3rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  .method-description {
    color: #ccc;
    font-size: 0.9rem;
    line-height: 1.4;
    margin-bottom: 1rem;
  }

  .method-details {
    color: #aaa;
    font-size: 0.8rem;
    font-style: italic;
  }
`;

export const AbilityScoreMethodModal: React.FC<AbilityScoreMethodModalProps> = ({
  isOpen,
  onSelect,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        {onClose && (
          <CloseButton onClick={onClose} aria-label="Close">
            ✕
          </CloseButton>
        )}
        <h2>Choose Ability Score Method</h2>
        <div className="modal-description">
          How would you like to determine your character's ability scores?
        </div>

        <MethodGrid>
          <MethodCard onClick={() => onSelect('standard-array')}>
            <div className="method-icon">📊</div>
            <div className="method-title">Standard Array</div>
            <div className="method-description">
              Use the official D&D 2024 standard array values for balanced, competitive play.
            </div>
            <div className="method-details">
              Values: 15, 14, 13, 12, 10, 8
            </div>
          </MethodCard>

          <MethodCard onClick={() => onSelect('custom')}>
            <div className="method-icon">🎲</div>
            <div className="method-title">Roll / Custom</div>
            <div className="method-description">
              Roll for random stats using 4d6 drop lowest, or set custom values manually.
            </div>
            <div className="method-details">
              More random, potentially higher or lower stats
            </div>
          </MethodCard>
        </MethodGrid>
      </ModalContent>
    </ModalOverlay>
  );
};