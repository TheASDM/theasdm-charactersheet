import { ReactNode, MouseEvent } from 'react';
import styled from 'styled-components';

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
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1.5rem;
  backdrop-filter: blur(2px);
`;

const Dialog = styled.div<{ $maxWidth: string }>`
  width: 100%;
  max-width: ${(props) => props.$maxWidth};
  max-height: 90vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid #d4af37;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  color: #f0f0f0;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.75rem 1.75rem 0 1.75rem;
`;

const Title = styled.h2`
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 1.85rem;
  color: #d4af37;
`;

const Subtitle = styled.p`
  margin: 0.35rem 0 0;
  color: #ccc;
  font-size: 1rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #d4af37;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;

  &:hover {
    color: #f0c851;
  }
`;

const Body = styled.div`
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  flex: 1;
`;

const Footer = styled.div`
  padding: 0 1.75rem 1.75rem;
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
