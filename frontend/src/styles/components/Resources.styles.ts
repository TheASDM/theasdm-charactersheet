import styled from 'styled-components';

// Mana Section
export const ManaSection = styled.div`
  border: 2px solid #6d4c8a;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(109, 76, 138, 0.1);
  position: relative;
  width: 100%;
  margin-top: 1rem;
`;

export const ManaContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

export const ManaDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border: 2px solid #6d4c8a;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);

  .mana-current {
    font-size: 2rem;
    font-weight: 700;
    color: #b19cd9;
    min-width: 3rem;
    text-align: center;
  }

  .mana-current input {
    background: transparent;
    border: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    text-align: inherit;
    width: 100%;
    padding: 0.2rem;
    border-bottom: 1px solid transparent;

    &:focus {
      outline: none;
      border-bottom: 1px solid #b19cd9;
      background: rgba(177, 156, 217, 0.1);
    }
  }

  .mana-separator {
    color: #6d4c8a;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .mana-max {
    font-size: 1.5rem;
    color: #6d4c8a;
    font-weight: 600;
    min-width: 2rem;
    text-align: center;
  }

  .mana-max input {
    background: transparent;
    border: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    text-align: inherit;
    width: 100%;
    padding: 0.2rem;
    border-bottom: 1px solid transparent;

    &:focus {
      outline: none;
      border-bottom: 1px solid #6d4c8a;
      background: rgba(109, 76, 138, 0.1);
    }
  }

  .mana-controls {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: 0.5rem;
  }

  .mana-control-btn {
    background: linear-gradient(145deg, #6d4c8a, #5a3f73);
    color: white;
    border: none;
    width: 20px;
    height: 16px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    line-height: 1;

    &:hover {
      background: linear-gradient(145deg, #5a3f73, #4a3560);
    }

    &:active {
      transform: translateY(1px);
    }
  }
`;

export const ManaTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #b19cd9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #6d4c8a;
`;

// Resource Tracking Section
export const ResourceSection = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
  width: 100%;
  margin-top: 1rem;
`;

export const ResourceContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

export const ResourceTrackerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

export const ResourceName = styled.div`
  font-size: 0.7rem;
  color: #8b6914;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 600;
  text-align: center;
`;

export const ResourceBoxes = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

export const ResourceBox = styled.div<{ filled?: boolean; isWounds?: boolean }>`
  position: relative;

  input[type="checkbox"] {
    width: ${props => props.isWounds ? '28px' : '20px'};
    height: ${props => props.isWounds ? '28px' : '20px'};
    cursor: pointer;
    appearance: none;
    border: 2px solid #8b6914;
    border-radius: ${props => props.isWounds ? '50%' : '3px'};
    background: ${props => props.filled ? '#d4af37' : 'transparent'};
    transition: all 0.3s ease;

    &:hover {
      background: ${props => props.filled ? '#b8941f' : 'rgba(212, 175, 55, 0.3)'};
    }

    &:checked {
      background: #d4af37;
      box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
    }
  }
`;

export const SkullOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1rem;
  pointer-events: none;
  z-index: 1;
`;

export const PoolCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border: 2px solid #8b6914;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);

  .current {
    font-size: 1rem;
    font-weight: 700;
    color: #d4af37;
    min-width: 1.5rem;
    text-align: center;
  }

  .separator {
    color: #8b6914;
    font-weight: 600;
  }

  .max {
    font-size: 0.9rem;
    color: #8b6914;
    font-weight: 600;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-left: 0.25rem;
  }

  .control-btn {
    background: linear-gradient(145deg, #8b6914, #6d5411);
    color: white;
    border: none;
    width: 16px;
    height: 12px;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.6rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    line-height: 1;

    &:hover {
      background: linear-gradient(145deg, #6d5411, #5a430e);
    }
  }
`;

// Two-column layout - First child gets 1/3, Second child gets 2/3 (for Inventory/Traits layout)
export const TwoColumnLayout = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;

  /* First child (Inventory) gets 1/3 of the width (same as Skills) */
  > :first-child {
    flex: 1;
  }

  /* Second child (Traits) gets 2/3 of the width */
  > :nth-child(2) {
    flex: 2;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;

    /* Reset flex when stacked vertically */
    > :first-child,
    > :nth-child(2) {
      flex: 1;
    }
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;