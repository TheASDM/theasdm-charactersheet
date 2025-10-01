import styled from 'styled-components';

// Character Name Section Container
export const CharacterNameSection = styled.div`
  text-align: center;
  padding: 1rem 0;
  border-bottom: 2px solid #333;
  margin-bottom: 1rem;
  position: relative;
`;

// Top row with Name, Level, and Proficiency Bonus
export const CharacterHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

// Character Name Display
export const CharacterName = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #d4af37;
  text-transform: uppercase;
  letter-spacing: 1px;
  flex: 1;
  text-align: center;
  padding: 0.5rem 0;
  border-top: 2px solid #333;
  border-bottom: 2px solid #333;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    letter-spacing: 0.5px;
  }
`;

// Level and Proficiency Bonus display boxes
export const TopStatBox = styled.div`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 2px solid #333;
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
  min-width: 120px;

  .stat-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: #d4af37;
    line-height: 1;
  }

  .stat-value input {
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
      border-bottom: 1px solid #d4af37;
      background: rgba(212, 175, 55, 0.1);
    }
  }

  @media (max-width: 768px) {
    min-width: 100px;
    padding: 0.5rem;

    .stat-value {
      font-size: 1.2rem;
    }
  }
`;

// Character Info Grid (Species, Class, Background, Subclass, Feats)
export const CharacterInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  text-align: center;
`;

// Individual info boxes in the grid
export const InfoBox = styled.div`
  padding: 0.25rem;

  .label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.2rem;
  }

  .value {
    font-size: 0.95rem;
    font-weight: 700;
    color: #d4af37;
  }

  select {
    background: rgba(26, 26, 26, 0.8);
    border: 1px solid #333;
    border-radius: 3px;
    color: #d4af37;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 700;
    padding: 0.25rem;
    width: 100%;
    text-align: center;

    &:focus {
      outline: none;
      border-color: #d4af37;
      background: rgba(212, 175, 55, 0.1);
    }

    option {
      background: #1a1a1a;
      color: #d4af37;
      padding: 0.25rem;
    }
  }

  input {
    background: rgba(26, 26, 26, 0.8);
    border: 1px solid #333;
    border-radius: 3px;
    color: #d4af37;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 700;
    padding: 0.25rem;
    width: 100%;
    text-align: center;

    &:focus {
      outline: none;
      border-color: #d4af37;
      background: rgba(212, 175, 55, 0.1);
    }

    &::placeholder {
      color: rgba(212, 175, 55, 0.5);
      font-style: italic;
    }
  }
`;

// Generic editable input component
export const EditableInput = styled.input`
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
    border-bottom: 1px solid #d4af37;
    background: rgba(212, 175, 55, 0.1);
  }
`;

// Edit controls for sections
export const SectionEditControls = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.3rem;
  opacity: 0.7;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
`;

// Edit/Save buttons
export const SectionEditButton = styled.button<{ variant?: 'edit' | 'save' }>`
  background: ${props => props.variant === 'save'
    ? 'linear-gradient(145deg, #4CAF50, #388E3C)'
    : 'rgba(212, 175, 55, 0.15)'};
  border: 1px solid ${props => props.variant === 'save' ? '#4CAF50' : '#d4af37'};
  color: ${props => props.variant === 'save' ? 'white' : '#d4af37'};
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  min-width: 32px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.variant === 'save'
      ? 'linear-gradient(145deg, #388E3C, #2E7D32)'
      : 'rgba(212, 175, 55, 0.25)'};
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;