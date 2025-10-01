import styled from 'styled-components';

// Stats Container
export const StatsContainer = styled.div`
  border: 2px solid #333;
  border-radius: 6px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  position: relative;
  min-width: 120px;
`;

export const StatsSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  &:not(:last-child) {
    margin-bottom: 0.5rem;
  }
`;

export const StatBox = styled.div`
  padding: 0.4rem;
  border: 1px solid #333;
  border-radius: 3px;
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;

  .stat-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 0.4rem;
  }

  .stat-value {
    font-size: 1.8rem;
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

  .hp-edit-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;

    .hp-part {
      display: flex;
      align-items: center;
      position: relative;

      .hp-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #d4af37;
        min-width: 2rem;
        text-align: center;
      }

      .hp-value input {
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
    }

    .hp-slash {
      font-size: 1.8rem;
      font-weight: 700;
      color: #d4af37;
    }
  }
`;

export const StatArrows = styled.div`
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

export const StatArrow = styled.button<{ direction: 'up' | 'down' }>`
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid #d4af37;
  color: #d4af37;
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
    background: rgba(212, 175, 55, 0.25);
    transform: translateY(${props => props.direction === 'up' ? '-1px' : '1px'});
  }

  &:active {
    transform: translateY(0);
  }
`;

// HP-specific arrows that need more space to avoid text overlap
export const HPArrows = styled.div`
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1px;
`;