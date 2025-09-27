import styled from 'styled-components';

// Ability Scores Section Container
export const AbilityScoresSection = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.5rem;
  background: rgba(139, 105, 20, 0.1);
  flex: 2;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

// Section Title (reusable across sections)
export const SectionTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #d4af37;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  text-align: center;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #8b6914;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 0.4rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
    letter-spacing: 0.3px;
  }
`;

// Ability Scores Grid Layout
export const AbilityScoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  flex: 1;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.25rem;
  }
`;

// Individual Ability Score Component
export const AbilityScore = styled.div`
  text-align: center;
  padding: 0.4rem;
  border: 1px solid #8b6914;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.2);
  position: relative;

  .ability-name {
    font-size: 0.65rem;
    font-weight: 600;
    color: #8b6914;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 0.2rem;
  }

  .score {
    font-size: clamp(1.1rem, 2.5vw, 2rem);
    font-weight: 700;
    color: #d4af37;
    margin-bottom: 0.1rem;
    position: relative;
  }

  .modifier {
    font-size: 0.7rem;
    color: #ffffff;
    font-weight: 600;
  }
`;

// Container for up/down arrows
export const AbilityArrows = styled.div`
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

// Individual arrow buttons
export const AbilityArrow = styled.button<{ direction: 'up' | 'down' }>`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: white;
  border: none;
  width: 14px;
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
    transform: translateY(${props => props.direction === 'up' ? '-1px' : '1px'});
  }

  &:active {
    transform: translateY(0);
  }
`;