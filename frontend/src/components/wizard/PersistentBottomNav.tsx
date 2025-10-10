import React from 'react';
import styled from 'styled-components';

export interface WizardStepInfo {
  key: string;
  label: string;
  isComplete: boolean;
  isCurrent: boolean;
  isNotApplicable?: boolean;
}

export interface PersistentBottomNavProps {
  canGoBack: boolean;
  canGoNext: boolean;
  canReview: boolean;
  onBack: () => void;
  onNext: () => void;
  onReview: () => void;
  currentStepLabel: string;
  isNextDisabled?: boolean;
  nextLabel?: string;
  steps?: WizardStepInfo[];
  onStepClick?: (stepKey: string) => void;
}

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(206, 144, 22, 0.3);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5);
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const NavSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StepLabel = styled.span`
  color: #c0aa70;
  font-size: 0.9rem;
  font-weight: 500;
  display: none;

  @media (min-width: 640px) {
    display: inline;
  }
`;

const NavButton = styled.button<{ variant?: 'primary' | 'secondary' | 'review' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  white-space: nowrap;

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

    if (variant === 'review') {
      return `
        background: linear-gradient(145deg, #6aa84f, #548c3a);
        color: #fff;
        box-shadow: 0 2px 8px rgba(106, 168, 79, 0.3);

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(106, 168, 79, 0.4);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      `;
    }

    // secondary (default)
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

  @media (max-width: 640px) {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }
`;

const ProgressSteps = styled.div`
  display: none;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
  max-width: 600px;
  margin: 0 1rem;

  @media (min-width: 768px) {
    display: flex;
  }
`;

const ProgressStep = styled.div<{ $isComplete: boolean; $isCurrent: boolean; $isNotApplicable: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: ${({ $isNotApplicable }) => ($isNotApplicable ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  opacity: ${({ $isNotApplicable }) => ($isNotApplicable ? '0.5' : '1')};

  &:hover {
    opacity: ${({ $isNotApplicable }) => ($isNotApplicable ? '0.5' : '0.8')};
  }

  &:not(:last-child)::after {
    content: '→';
    color: ${({ $isComplete }) => ($isComplete ? '#6aa84f' : '#666')};
    margin-left: 0.5rem;
    font-size: 0.8rem;
  }
`;

const StepDot = styled.div<{ $isComplete: boolean; $isCurrent: boolean; $isNotApplicable: boolean }>`
  width: ${({ $isCurrent }) => ($isCurrent ? '12px' : '8px')};
  height: ${({ $isCurrent }) => ($isCurrent ? '12px' : '8px')};
  border-radius: 50%;
  background: ${({ $isComplete, $isCurrent, $isNotApplicable }) => {
    if ($isNotApplicable) return '#444';
    if ($isCurrent) return '#ce9016';
    if ($isComplete) return '#6aa84f';
    return '#666';
  }};
  border: 2px solid ${({ $isComplete, $isCurrent, $isNotApplicable }) => {
    if ($isNotApplicable) return '#333';
    if ($isCurrent) return '#ce9016';
    if ($isComplete) return '#6aa84f';
    return '#444';
  }};
  transition: all 0.2s ease;
  box-shadow: ${({ $isCurrent }) =>
    $isCurrent ? '0 0 8px rgba(206, 144, 22, 0.5)' : 'none'};
  position: relative;

  ${({ $isNotApplicable }) =>
    $isNotApplicable &&
    `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: -2px;
      right: -2px;
      height: 2px;
      background: #666;
      transform: translateY(-50%) rotate(-45deg);
    }
  `}
`;

const StepLabelCompact = styled.span<{ $isComplete: boolean; $isCurrent: boolean; $isNotApplicable: boolean }>`
  font-size: 0.75rem;
  color: ${({ $isComplete, $isCurrent, $isNotApplicable }) => {
    if ($isNotApplicable) return '#666';
    if ($isCurrent) return '#ce9016';
    if ($isComplete) return '#6aa84f';
    return '#999';
  }};
  font-weight: ${({ $isCurrent }) => ($isCurrent ? '600' : '400')};
  white-space: nowrap;
  display: none;
  text-decoration: ${({ $isNotApplicable }) => ($isNotApplicable ? 'line-through' : 'none')};

  @media (min-width: 1024px) {
    display: inline;
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

export const PersistentBottomNav: React.FC<PersistentBottomNavProps> = ({
  canGoBack,
  canGoNext,
  canReview,
  onBack,
  onNext,
  onReview,
  currentStepLabel,
  isNextDisabled = false,
  nextLabel = 'Next',
  steps = [],
  onStepClick,
}) => {
  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+Left = Back
      if (e.altKey && e.key === 'ArrowLeft' && canGoBack) {
        e.preventDefault();
        onBack();
      }

      // Alt+Right = Next
      if (e.altKey && e.key === 'ArrowRight' && canGoNext && !isNextDisabled) {
        e.preventDefault();
        onNext();
      }

      // Alt+R = Review
      if (e.altKey && e.key === 'r' && canReview) {
        e.preventDefault();
        onReview();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canGoNext, canReview, isNextDisabled, onBack, onNext, onReview]);

  return (
    <NavContainer id="persistent-bottom-nav" aria-label="Wizard navigation">
      <NavContent>
        {/* Left: Back button */}
        <NavSection>
          <NavButton
            variant="secondary"
            onClick={onBack}
            disabled={!canGoBack}
            aria-label="Go to previous step"
            aria-disabled={!canGoBack}
          >
            ← Back
          </NavButton>
        </NavSection>

        {/* Center: Progress steps or current step label */}
        {steps.length > 0 ? (
          <ProgressSteps>
            {steps.map((step) => {
              const isNotApplicable = step.isNotApplicable ?? false;
              return (
                <ProgressStep
                  key={step.key}
                  $isComplete={step.isComplete}
                  $isCurrent={step.isCurrent}
                  $isNotApplicable={isNotApplicable}
                  onClick={() => !isNotApplicable && onStepClick?.(step.key)}
                  role="button"
                  tabIndex={isNotApplicable ? -1 : 0}
                  aria-label={`${step.label}${step.isCurrent ? ' (current)' : ''}${step.isComplete ? ' (complete)' : ''}${isNotApplicable ? ' (not applicable)' : ''}`}
                  aria-disabled={isNotApplicable}
                  title={isNotApplicable ? `${step.label} (not applicable)` : undefined}
                >
                  <StepDot $isComplete={step.isComplete} $isCurrent={step.isCurrent} $isNotApplicable={isNotApplicable} />
                  <StepLabelCompact $isComplete={step.isComplete} $isCurrent={step.isCurrent} $isNotApplicable={isNotApplicable}>
                    {step.label}
                  </StepLabelCompact>
                </ProgressStep>
              );
            })}
          </ProgressSteps>
        ) : (
          <Spacer>
            <StepLabel aria-live="polite">{currentStepLabel}</StepLabel>
          </Spacer>
        )}

        {/* Right: Next/Review buttons */}
        <NavSection>
          {canReview && (
            <NavButton
              variant="review"
              onClick={onReview}
              aria-label="Go to review step"
            >
              📋 Review
            </NavButton>
          )}

          <NavButton
            variant="primary"
            onClick={onNext}
            disabled={!canGoNext || isNextDisabled}
            aria-label={`Go to next step${isNextDisabled ? ' (complete current step first)' : ''}`}
            aria-disabled={!canGoNext || isNextDisabled}
          >
            {nextLabel} →
          </NavButton>
        </NavSection>
      </NavContent>
    </NavContainer>
  );
};
