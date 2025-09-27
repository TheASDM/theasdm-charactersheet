import styled from 'styled-components';

// Inventory Styles
export const InventorySection = styled.div`
  background: linear-gradient(
    145deg,
    rgba(32, 32, 32, 0.95),
    rgba(45, 45, 45, 0.9)
  );
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);
  position: relative;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="paper"><feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/></filter></defs><rect width="100" height="100" fill="rgba(101,67,33,0.05)" filter="url(%23paper)"/></svg>')
      repeat;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 768px) {
    margin-top: 0.5rem;
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    margin-top: 0.25rem;
    padding: 0.5rem;
  }
`;

export const InventoryTitle = styled.h3`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 2;
`;

export const InventoryList = styled.div`
  position: relative;
  z-index: 2;
  background: rgba(20, 20, 20, 0.8);
  border: 2px solid #8b6914;
  border-radius: 5px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

export const InventoryItem = styled.div`
  color: #f4e7d1;
  font-family: 'Crimson Text', serif;
  font-size: 0.9rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(139, 105, 20, 0.3);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2rem;

  &:last-child {
    border-bottom: none;
  }

  input {
    background: transparent;
    border: none;
    color: #f4e7d1;
    font-family: 'Crimson Text', serif;
    font-size: 0.9rem;
    flex: 1;

    &::placeholder {
      color: rgba(244, 231, 209, 0.5);
    }

    &:focus {
      outline: none;
      background: rgba(139, 105, 20, 0.2);
    }
  }
`;

export const InventoryItemContent = styled.div<{ clickable?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  padding: 2px 4px;
  border-radius: 3px;
  transition: background-color 0.2s ease;

  ${props => props.clickable && `
    &:hover {
      background-color: rgba(139, 105, 20, 0.2);
      color: #d4af37;
    }
  `}
`;

export const DeleteButton = styled.button`
  background: linear-gradient(145deg, #dc3545, #c82333);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  opacity: 0.7;
  margin-left: 8px;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const QuantityContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: 8px;
  gap: 4px;
`;

export const QuantityLabel = styled.span`
  font-size: 0.8rem;
  color: #8b6914;
  font-weight: 600;
`;

export const QuantityInput = styled.input`
  background: rgba(139, 105, 20, 0.2);
  border: 1px solid #8b6914;
  border-radius: 3px;
  color: #d4af37;
  font-size: 0.8rem;
  font-weight: 600;
  width: 30px;
  height: 20px;
  text-align: center;
  padding: 0;

  &:focus {
    outline: none;
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.2);
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type=number] {
    -moz-appearance: textfield;
  }
`;

export const SaveInventoryButton = styled.button`
  background: linear-gradient(145deg, #4CAF50, #388E3C);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  margin-top: 8px;

  &:hover {
    background: linear-gradient(145deg, #388E3C, #2E7D32);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: linear-gradient(145deg, #6c757d, #5a6268);
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const InventoryButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  position: relative;
  z-index: 2;
`;

export const InventoryActionButton = styled.button`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: #f4e7d1;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;

  &:hover {
    background: linear-gradient(145deg, #6d5411, #5a450e);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(139, 105, 20, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;