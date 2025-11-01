import React from 'react';
import styled from 'styled-components';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface FeatureDetailModalProps {
  feature: {
    name: string;
    description: string;
    category?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

// Styled components
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1e1e1e 0%, #2b2b2b 100%);
  border: 2px solid #ce9016;
  border-radius: 14px;
  max-width: 800px;
  width: 90%;
  max-height: calc(100vh - clamp(5rem, 12vh, 7rem));
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.68);
  color: #f0f0f0;
  margin: 2rem auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem 0 1.5rem;
  flex-shrink: 0;
`;

const HeaderContent = styled.div`
  flex: 1;
  text-align: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ce9016;
  font-size: 1.55rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: #e0a523;
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem 1.5rem 1.35rem;
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

const FeatureTitle = styled.h2`
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: #ce9016;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
`;

const FeatureCategory = styled.div`
  font-size: 0.9rem;
  color: #a0a0a0;
  margin-top: 0.5rem;
  font-style: italic;
`;

const FeatureDescription = styled.div`
  font-size: 1rem;
  line-height: 1.6;
  color: #e0e0e0;
  margin-top: 1rem;

  p {
    margin: 0.75rem 0;
  }

  ul, ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.5rem 0;
  }

  strong {
    color: #ce9016;
  }

  a {
    color: #ce9016;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const FeatureDetailModal: React.FC<FeatureDetailModalProps> = ({
  feature,
  isOpen,
  onClose,
}) => {
  useBodyScrollLock(isOpen, false); // Don't scroll to top

  if (!feature) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <HeaderContent>
            <FeatureTitle>{feature.name}</FeatureTitle>
            {feature.category && <FeatureCategory>{feature.category}</FeatureCategory>}
          </HeaderContent>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <FeatureDescription
            dangerouslySetInnerHTML={{ __html: feature.description }}
          />
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};
