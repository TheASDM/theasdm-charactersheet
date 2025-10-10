import { ReactNode, MouseEvent } from 'react';
import styled from 'styled-components';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  hideCloseButton?: boolean;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: clamp(2.5rem, 8vh, 4.5rem) 1.5rem 2.25rem;
  backdrop-filter: blur(2px);
  /* No overflow - backdrop doesn't scroll */
`;

const Dialog = styled.div<{ $maxWidth: string }>`
  width: 100%;
  max-width: ${(props) => props.$maxWidth};
  max-height: calc(100vh - clamp(5rem, 12vh, 7rem));
  background: linear-gradient(135deg, #1e1e1e 0%, #2b2b2b 100%);
  border: 2px solid #ce9016;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.68);
  display: flex;
  flex-direction: column;
  color: #f0f0f0;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem 0 1.5rem;
  flex-shrink: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: clamp(1.35rem, 2.4vw, 1.6rem);
  color: #ce9016;
`;

const Subtitle = styled.p`
  margin: 0.25rem 0 0;
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.45;
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

  &:hover {
    color: #e0a523;
  }
`;

const Body = styled.div`
  padding: 1.25rem 1.5rem 1.35rem;
  overflow-y: auto;
  flex: 1;

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

const Footer = styled.div`
  padding: 0 1.5rem 1.35rem;
  flex-shrink: 0;
`;

const WizardModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '840px',
  hideCloseButton = false,
}: WizardModalProps) => {
  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = () => {
    onClose();
  };

  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Dialog $maxWidth={maxWidth} onClick={handleContentClick}>
        {(title || subtitle || !hideCloseButton) && (
          <Header>
            <div>
              {title && (typeof title === 'string' ? <Title>{title}</Title> : title)}
              {subtitle && (typeof subtitle === 'string' ? <Subtitle>{subtitle}</Subtitle> : subtitle)}
            </div>
            {!hideCloseButton && (
              <CloseButton type="button" onClick={onClose} aria-label="Close modal">
                ×
              </CloseButton>
            )}
          </Header>
        )}
        <Body>{children}</Body>
        {footer && <Footer>{footer}</Footer>}
      </Dialog>
    </Overlay>
  );
};

export default WizardModal;
