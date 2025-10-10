import styled from 'styled-components';

// Mana Section
export const ManaSection = styled.div`
  border: 2px solid #333;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
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
  border: 2px solid #333;
  border-radius: 8px;
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);

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
    color: #888;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .mana-max {
    font-size: 1.5rem;
    color: #888;
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
      border-bottom: 1px solid #888;
      background: rgba(136, 136, 136, 0.1);
    }
  }

  .mana-controls {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: 0.5rem;
  }

  .mana-control-btn {
    background: rgba(177, 156, 217, 0.15);
    border: 1px solid #b19cd9;
    color: #b19cd9;
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
      background: rgba(177, 156, 217, 0.25);
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
  border-bottom: 1px solid #333;
`;

// Resource Tracking Section
export const ResourceSection = styled.div`
  border: 2px solid #333;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
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
  color: #888;
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
    border: 2px solid #333;
    border-radius: ${props => props.isWounds ? '50%' : '3px'};
    background: ${props => props.filled ? '#ce9016' : 'rgba(26, 26, 26, 0.8)'};
    transition: all 0.3s ease;

    &:hover {
      background: ${props => props.filled ? '#b8860b' : 'rgba(206, 144, 22, 0.2)'};
    }

    &:checked {
      background: #ce9016;
      box-shadow: 0 0 8px rgba(206, 144, 22, 0.5);
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
  border: 2px solid #333;
  border-radius: 4px;
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);

  .current {
    font-size: 1rem;
    font-weight: 700;
    color: #ce9016;
    min-width: 1.5rem;
    text-align: center;
  }

  .separator {
    color: #888;
    font-weight: 600;
  }

  .max {
    font-size: 0.9rem;
    color: #888;
    font-weight: 600;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-left: 0.25rem;
  }

  .control-btn {
    background: rgba(206, 144, 22, 0.15);
    border: 1px solid #ce9016;
    color: #ce9016;
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
      background: rgba(206, 144, 22, 0.25);
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