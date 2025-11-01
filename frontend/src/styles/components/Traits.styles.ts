import styled from 'styled-components';

// Actions Section Styles - Redesigned to match sheet aesthetic
export const ActionsSection = styled.div`
  border: 1px solid rgba(206, 144, 22, 0.25);
  border-radius: 8px;
  padding: 0.6rem;
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(8px);
  position: relative;
  display: flex;
  flex-direction: column;
`;

export const ActionsTitle = styled.h3`
  color: #ce9016;
  font-family: 'Cinzel', serif;
  font-size: 0.92rem;
  font-weight: 600;
  margin: 0 0 0.45rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  border-bottom: 1px solid rgba(206, 144, 22, 0.2);
  padding-bottom: 0.3rem;
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
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid #333;
  border-radius: 4px;
  margin-bottom: 0.25rem;

  .header-cell {
    color: #ce9016;
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
  grid-template-columns: 2fr 1fr 1.2fr;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem;
  background: rgba(18, 18, 18, 0.85);
  border: 1px solid rgba(206, 144, 22, 0.2);
  border-radius: 6px;
  align-items: center;
  font-size: 0.76rem;
  color: #f0f0f0;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(206, 144, 22, 0.08);
    border-color: rgba(206, 144, 22, 0.35);
  }

  /* Show drag handle on hover for draggable rows */
  &.draggable-row:hover {
    & > div:first-child {
      opacity: 1 !important;
    }
  }

  .cell-name {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .name-line {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 600;
    color: #f7f4e8;
    min-height: 1rem;
  }

  .name-line input {
    flex: 1;
    min-width: 0;
  }

  .cell-metric {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    align-items: ${({ $editable }) => ($editable ? 'stretch' : 'center')};
    text-align: center;
  }

  .metric-primary {
    font-weight: 600;
    color: #f5e8c5;
  }

  .metric-secondary {
    font-size: 0.62rem;
    font-weight: 600;
    color: rgba(123, 237, 159, 0.85);
  }

  .notes {
    font-size: 0.65rem;
    color: rgba(229, 210, 170, 0.75);
  }

  .tag-row {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  input {
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(206, 144, 22, 0.25);
    border-radius: 4px;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    width: 100%;
    padding: 0.25rem 0.35rem;

    &:focus {
      outline: none;
      border-color: rgba(206, 144, 22, 0.6);
      box-shadow: 0 0 4px rgba(206, 144, 22, 0.3);
    }
  }
`;

export const AddActionButton = styled.button`
  background: rgba(206, 144, 22, 0.18);
  border: 1px solid rgba(206, 144, 22, 0.45);
  color: #f4d27a;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  margin-top: 0.3rem;
  align-self: flex-start;

  &:hover {
    background: rgba(206, 144, 22, 0.28);
    transform: translateY(-1px);
    box-shadow: 0 3px 9px rgba(206, 144, 22, 0.25);
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
  border: 2px solid #333;
  border-radius: 6px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  position: relative;
  width: 100%;
  height: fit-content;
`;

export const TraitsTitle = styled.h2`
  color: #ce9016;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #333;
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
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid #333;
  border-radius: 4px;
  padding: 0.4rem;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    background: rgba(206, 144, 22, 0.08);
    border-color: rgba(206, 144, 22, 0.3);
  }
`;

export const TraitName = styled.h3<{ $clickable?: boolean }>`
  color: #ce9016 !important;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0 0 0.2rem 0;
  text-transform: capitalize;
  line-height: 1.2;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: opacity 0.2s ease;

  ${({ $clickable }) =>
    $clickable &&
    `
    &:hover {
      opacity: 0.8;
    }
  `}

  /* Prevent visited link color from changing */
  &:visited {
    color: #ce9016 !important;
  }
`;

export const TraitDescription = styled.div`
  color: #e0e0e0;
  font-size: 0.7rem;
  line-height: 1.3;
  margin: 0;
  flex: 1;
`;

export const TraitCategory = styled.div`
  margin-top: 0.5rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(206, 144, 22, 0.2);
  font-size: 0.75rem;
  color: #ce9016;
  font-style: italic;
  font-weight: 500;
  text-align: right;
  align-self: flex-end;
`;

export const EmptyTraitsMessage = styled.div`
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 2rem;
  font-size: 1.1rem;
`;

// Proficiencies Card Styles with flexible sizing
export const ProficienciesCard = styled.div<{ $isLastCard?: boolean; $totalCards?: number }>`
  background: rgba(76, 100, 139, 0.1); /* Different blue-tinted background */
  backdrop-filter: blur(10px);
  border: 1px solid rgba(76, 100, 139, 0.3); /* Blue border to match */
  border-radius: 4px;
  padding: 0.5rem;
  transition: all 0.2s ease;

  /* Flexible sizing logic */
  grid-column: ${props => {
    if (!props.$isLastCard || !props.$totalCards) return 'span 1';

    // If total cards is odd and this is the last card, span 2 columns
    const isOddTotal = props.$totalCards % 2 === 1;
    return isOddTotal ? 'span 2' : 'span 1';
  }};

  &:hover {
    background: rgba(76, 100, 139, 0.15);
    border-color: rgba(76, 100, 139, 0.5);
  }
`;

export const ProficienciesTitle = styled.h3`
  color: #6fa8dc; /* Light blue color to distinguish from other features */
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0 0 0.3rem 0;
  text-transform: capitalize;
  line-height: 1.2;
  text-align: center;
  border-bottom: 1px solid rgba(76, 100, 139, 0.3);
  padding-bottom: 0.2rem;
`;

export const ProficienciesContent = styled.div`
  color: #e0e0e0;
  font-size: 0.7rem;
  line-height: 1.4;
  margin: 0;

  /* Handle bold markdown formatting */
  strong {
    color: #ce9016;
    font-weight: 600;
  }

  /* Add spacing between proficiency sections */
  p {
    margin: 0.3rem 0;
  }
`;
