import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { FocusManager } from '../../utils/focusManagement';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
}

const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2520 100%);
  border: 2px solid #ce9016;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(206, 144, 22, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #ce9016;
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #ce9016;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: all 0.2s ease;
  border-radius: 4px;

  &:hover {
    background: rgba(206, 144, 22, 0.1);
    transform: scale(1.1);
  }

  &:focus-visible {
    outline: 2px solid #ce9016;
    outline-offset: 2px;
  }
`;

const ModalContent = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  color: #e0d9c6;
  line-height: 1.6;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(206, 144, 22, 0.5);
    border-radius: 4px;

    &:hover {
      background: rgba(206, 144, 22, 0.7);
    }
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(206, 144, 22, 0.3);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const FooterButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background: linear-gradient(145deg, #ce9016, #b8860b);
  color: #1a1a1a;
  box-shadow: 0 2px 8px rgba(206, 144, 22, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid #ce9016;
    outline-offset: 2px;
  }
`;

const focusManager = new FocusManager();

export const DetailsModal: React.FC<DetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  footer,
}) => {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Save and restore focus
  useEffect(() => {
    if (isOpen) {
      focusManager.save();
    } else {
      focusManager.restore();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Overlay
      isOpen={isOpen}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <ModalContainer
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader>
          <ModalTitle id="modal-title">{title}</ModalTitle>
          <CloseButton
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </CloseButton>
        </ModalHeader>

        <ModalContent>{content}</ModalContent>

        {footer ? (
          <ModalFooter>{footer}</ModalFooter>
        ) : (
          <ModalFooter>
            <FooterButton onClick={onClose} type="button">
              Close
            </FooterButton>
          </ModalFooter>
        )}
      </ModalContainer>
    </Overlay>
  );
};
