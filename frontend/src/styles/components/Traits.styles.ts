import styled from 'styled-components';

// Actions Section Styles - Redesigned to match sheet aesthetic
export const ActionsSection = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.5rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
  display: flex;
  flex-direction: column;
`;

export const ActionsTitle = styled.h3`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  border-bottom: 1px solid #8b6914;
  padding-bottom: 0.25rem;
`;

export const ActionsTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

export const ActionsTableHeader = styled.div<{ $column: number }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  background: rgba(139, 105, 20, 0.2);
  border: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 4px;
  margin-bottom: 0.25rem;

  .header-cell {
    color: #d4af37;
    font-family: 'Cinzel', serif;
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    text-align: center;
  }
`;

export const ActionsTableCell = styled.div<{ $column: number; $editable?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(139, 105, 20, 0.2);
  border-radius: 3px;
  align-items: center;
  font-size: 0.75rem;
  color: #f4e7d1;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(139, 105, 20, 0.08);
    border-color: rgba(139, 105, 20, 0.3);
  }

  .action-name {
    font-weight: 600;
    color: #d4af37;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-bonus, .action-damage {
    text-align: center;
    font-weight: 500;
  }

  input {
    background: rgba(40, 40, 40, 0.5);
    border: 1px solid transparent;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    width: 100%;
    padding: 0.2rem 0.3rem;
    border-radius: 3px;
    text-align: inherit;

    &:focus {
      outline: none;
      border: 1px solid #d4af37;
      background: rgba(139, 105, 20, 0.2);
      box-shadow: 0 0 3px rgba(212, 175, 55, 0.3);
    }
  }
`;

export const AddActionButton = styled.button`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: #f4e7d1;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  margin-top: 0.25rem;
  align-self: flex-start;

  &:hover {
    background: linear-gradient(145deg, #6d5411, #5a430e);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(139, 105, 20, 0.3);
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
  padding: 0.5rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
  width: 100%;
  height: fit-content;
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
  grid-template-columns: 1fr;
  gap: 0.4rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const TraitCard = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 4px;
  padding: 0.4rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(139, 105, 20, 0.15);
    border-color: rgba(139, 105, 20, 0.5);
  }
`;

export const TraitName = styled.h3`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0 0 0.2rem 0;
  text-transform: capitalize;
  line-height: 1.2;
`;

export const TraitDescription = styled.p`
  color: #f4e7d1;
  font-size: 0.7rem;
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