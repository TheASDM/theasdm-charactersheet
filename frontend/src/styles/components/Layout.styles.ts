import styled from 'styled-components';

// Font import component
export const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

// Main sheet container
export const SheetContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  color: #d4af37;
  min-height: 100vh;
  font-family: 'Cinzel', serif;

  @media (max-width: 768px) {
    padding: 0.5rem;
    max-width: 100%;
    overflow-x: hidden;
  }

  @media (max-width: 480px) {
    padding: 0.25rem;
  }
`;

// Main layout wrapper
export const MainLayout = styled.div`
  margin-top: 1rem;
`;

// Left column container
export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// Three column layout container
export const ThreeColumnContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: stretch;
  width: 100%;
  min-height: 250px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    min-height: auto;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;

// HP Arrow button (specific to HP management)
export const HPArrow = styled.button<{ direction: 'up' | 'down' }>`
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
    transform: scale(0.95);
  }
`;