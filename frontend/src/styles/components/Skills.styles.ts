import styled from 'styled-components';

// Skills Section Container
export const SkillsSection = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.5rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 2;
  min-width: 0;
`;

// Skills List Grid Layout
export const SkillsList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.15rem 0.6rem;
  flex: 1;
  align-content: start;
  overflow: hidden;
  max-height: calc(100% - 2rem);
  padding-bottom: 1.5rem;
`;

// Individual Skill Item
export const SkillItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.2rem 0.3rem;
  font-size: 0.7rem;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.1);
  min-height: 20px;
  max-height: 22px;

  .skill-name {
    color: #ffffff;
    margin-left: 0.15rem;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  .skill-bonus {
    color: #d4af37;
    font-weight: 700;
    margin-left: auto;
    font-size: 0.65rem;
    min-width: 22px;
    text-align: right;
  }

  input[type="checkbox"] {
    margin-right: 0.15rem;
    transform: scale(0.75);
  }
`;