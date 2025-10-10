import styled from 'styled-components';

// Inventory Styles
export const InventorySection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 2px solid #333;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);
  position: relative;
  display: flex;
  flex-direction: column;

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
  color: #ce9016;
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
  background: rgba(15, 15, 15, 0.95);
  border: 2px solid #333;
  border-radius: 5px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

export const InventoryItem = styled.div`
  color: #e0e0e0;
  font-family: 'Crimson Text', serif;
  font-size: 0.9rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(51, 51, 51, 0.3);
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
    color: #e0e0e0;
    font-family: 'Crimson Text', serif;
    font-size: 0.9rem;
    flex: 1;

    &::placeholder {
      color: rgba(224, 224, 224, 0.5);
    }

    &:focus {
      outline: none;
      background: rgba(206, 144, 22, 0.1);
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
      background-color: rgba(206, 144, 22, 0.15);
      color: #ce9016;
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
  color: #888;
  font-weight: 600;
`;

export const QuantityInput = styled.input`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #333;
  border-radius: 3px;
  color: #ce9016;
  font-size: 0.8rem;
  font-weight: 600;
  width: 30px;
  height: 20px;
  text-align: center;
  padding: 0;

  &:focus {
    outline: none;
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.15);
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
  background: rgba(206, 144, 22, 0.15);
  border: 1px solid #ce9016;
  color: #ce9016;
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
    background: rgba(206, 144, 22, 0.25);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(206, 144, 22, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;