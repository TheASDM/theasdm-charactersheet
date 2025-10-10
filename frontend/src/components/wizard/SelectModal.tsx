import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { FocusManager } from '../../utils/focusManagement';

export interface SelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data?: any) => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  isConfirmDisabled?: boolean;
  showCancel?: boolean;
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 1rem 2rem;
  overflow-y: auto;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(206, 144, 22, 0.6);
    border-radius: 6px;

    &:hover {
      background: rgba(206, 144, 22, 0.8);
    }
  }
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2520 100%);
  border: 2px solid #ce9016;
  border-radius: 12px;
  max-width: 600px;
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
  font-size: 1.3rem;
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
  justify-content: space-between;
  gap: 0.75rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${({ variant }) => {
    if (variant === 'primary') {
      return `
        background: linear-gradient(145deg, #ce9016, #b8860b);
        color: #1a1a1a;
        box-shadow: 0 2px 8px rgba(206, 144, 22, 0.3);

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      `;
    }

    // secondary
    return `
      background: rgba(60, 60, 60, 0.8);
      color: #f0f0f0;
      border: 1px solid rgba(206, 144, 22, 0.3);

      &:hover:not(:disabled) {
        background: rgba(80, 80, 80, 0.8);
        border-color: rgba(206, 144, 22, 0.5);
      }

      &:active:not(:disabled) {
        background: rgba(70, 70, 70, 0.8);
      }
    `;
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid #ce9016;
    outline-offset: 2px;
  }
`;

const focusManager = new FocusManager();

export const SelectModal: React.FC<SelectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirm',
  isConfirmDisabled = false,
  showCancel = true,
}) => {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  // Handle escape key (acts as cancel)
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Overlay
      $isOpen={isOpen}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-modal-title"
    >
      <ModalContainer
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader>
          <ModalTitle id="select-modal-title">{title}</ModalTitle>
          {showCancel && (
            <CloseButton
              onClick={onClose}
              aria-label="Cancel and close modal"
              type="button"
            >
              ×
            </CloseButton>
          )}
        </ModalHeader>

        <ModalContent>{children}</ModalContent>

        <ModalFooter>
          {showCancel && (
            <Button
              variant="secondary"
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => onConfirm()}
            disabled={isConfirmDisabled}
            type="button"
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};
