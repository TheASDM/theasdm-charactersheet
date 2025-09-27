import styled from 'styled-components';

// Actions Table Styles
export const ActionsSection = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
`;

export const ActionsTitle = styled.h3`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  border-bottom: 2px solid #d4af37;
  padding-bottom: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

export const ActionsTable = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0;
  border: 2px solid #8b6914;
  border-radius: 5px;
  overflow: hidden;
  background: rgba(20, 20, 20, 0.8);

  @media (max-width: 768px) {
    grid-template-columns: 1fr 0.8fr 0.8fr;
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1px;
  }
`;

export const ActionsTableHeader = styled.div<{ column: number }>`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: #f4e7d1;
  padding: 0.5rem;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  border-right: ${props => props.column < 3 ? '1px solid #6d5411' : 'none'};
`;

export const ActionsTableCell = styled.div<{ column: number; editable?: boolean }>`
  padding: 0.4rem;
  border-right: ${props => props.column < 3 ? '1px solid #8b6914' : 'none'};
  border-bottom: 1px solid #8b6914;
  font-family: 'Crimson Text', serif;
  font-size: 0.8rem;
  color: #f4e7d1;
  min-height: 1.5rem;
  display: flex;
  align-items: center;
  background: rgba(30, 30, 30, 0.7);

  ${props => props.column === 1 && `
    font-weight: 600;
    color: #d4af37;
  `}

  ${props => props.column === 2 && `
    text-align: center;
    justify-content: center;
    font-weight: 600;
  `}

  ${props => props.column === 3 && `
    text-align: center;
    justify-content: center;
    font-weight: 600;
  `}

  input {
    background: rgba(20, 20, 20, 0.6);
    border: 1px solid transparent;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    width: 100%;
    padding: 0.2rem;
    border-radius: 3px;

    &:focus {
      outline: none;
      border: 1px solid #d4af37;
      background: rgba(139, 105, 20, 0.3);
      box-shadow: 0 0 5px rgba(212, 175, 55, 0.3);
    }
  }

  textarea {
    background: rgba(20, 20, 20, 0.6);
    border: 1px solid transparent;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    width: 100%;
    padding: 0.2rem;
    resize: vertical;
    min-height: 1.2rem;
    border-radius: 3px;

    &:focus {
      outline: none;
      border: 1px solid #d4af37;
      background: rgba(139, 105, 20, 0.3);
      box-shadow: 0 0 5px rgba(212, 175, 55, 0.3);
    }
  }
`;

export const AddActionButton = styled.button`
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #2c1810;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-top: 0.5rem;

  &:hover {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-1px);
    box-shadow: 0 3px 12px rgba(212, 175, 55, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const RemoveActionButton = styled.button`
  background: linear-gradient(145deg, #dc3545, #c82333);
  color: white;
  border: none;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  margin-left: 0.25rem;

  &:hover {
    background: linear-gradient(145deg, #c82333, #a71e2a);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Traits and Abilities Section Styles
export const TraitsSection = styled.section`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
  width: 100%;
`;

export const TraitsTitle = styled.h2`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #8b6914;
  padding-bottom: 0.25rem;
`;

export const TraitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const TraitCard = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 4px;
  padding: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(139, 105, 20, 0.15);
    border-color: rgba(139, 105, 20, 0.5);
  }
`;

export const TraitName = styled.h3`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  text-transform: capitalize;
  line-height: 1.2;
`;

export const TraitDescription = styled.p`
  color: #f4e7d1;
  font-size: 0.75rem;
  line-height: 1.3;
  margin: 0;
`;

export const EmptyTraitsMessage = styled.div`
  text-align: center;
  color: #8b6914;
  font-style: italic;
  padding: 2rem;
  font-size: 1.1rem;
`;