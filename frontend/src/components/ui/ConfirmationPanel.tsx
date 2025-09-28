import React from 'react';
import styled from 'styled-components';

interface ConfirmationPanelProps {
  title: string;
  description?: string;
  confirmText?: string;
  onConfirm: () => void;
  isComplete: boolean;
  children?: React.ReactNode;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

const ConfirmationContainer = styled.div<{ isComplete: boolean }>`
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid rgba(212, 175, 55, 0.3);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #d4af37, #f4d03f);
    opacity: ${props => props.isComplete ? 1 : 0.7};
    transition: all 0.3s ease;
  }
`;

const ConfirmationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ConfirmationIcon = styled.div<{ isComplete: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #1a1a1a;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  transition: all 0.3s ease;
`;

const ConfirmationContent = styled.div`
  flex: 1;
`;

const ConfirmationTitle = styled.h3<{ isComplete: boolean }>`
  margin: 0 0 0.5rem 0;
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  transition: color 0.3s ease;
`;

const ConfirmationDescription = styled.p`
  margin: 0;
  color: #ccc;
  font-size: 0.95rem;
  line-height: 1.4;
`;

const ConfirmationDetails = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const ConfirmButton = styled.button<{ isComplete: boolean }>`
  margin-top: 1rem;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #1a1a1a;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const AutoAdvanceIndicator = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  text-align: center;
  color: #d4af37;
  font-size: 0.9rem;
  font-weight: 500;
`;

export const ConfirmationPanel: React.FC<ConfirmationPanelProps> = ({
  title,
  description,
  confirmText = "Continue to Next Step",
  onConfirm,
  isComplete,
  children,
  autoAdvance = false,
  autoAdvanceDelay = 2000
}) => {
  React.useEffect(() => {
    if (isComplete && autoAdvance) {
      const timer = setTimeout(() => {
        onConfirm();
      }, autoAdvanceDelay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isComplete, autoAdvance, autoAdvanceDelay, onConfirm]);

  return (
    <ConfirmationContainer isComplete={isComplete}>
      <ConfirmationHeader>
        <ConfirmationIcon isComplete={isComplete}>
          {isComplete ? '✓' : '⚡'}
        </ConfirmationIcon>
        <ConfirmationContent>
          <ConfirmationTitle isComplete={isComplete}>
            {isComplete ? 'Selection Complete!' : title}
          </ConfirmationTitle>
          {description && (
            <ConfirmationDescription>
              {isComplete ? 'Your selections have been saved.' : description}
            </ConfirmationDescription>
          )}
        </ConfirmationContent>
      </ConfirmationHeader>

      {children && (
        <ConfirmationDetails>
          {children}
        </ConfirmationDetails>
      )}

      {isComplete && autoAdvance && (
        <AutoAdvanceIndicator>
          🚀 Automatically advancing to next step in {autoAdvanceDelay / 1000} seconds...
        </AutoAdvanceIndicator>
      )}

      {isComplete && !autoAdvance && (
        <ConfirmButton isComplete={isComplete} onClick={onConfirm}>
          {confirmText}
        </ConfirmButton>
      )}
    </ConfirmationContainer>
  );
};