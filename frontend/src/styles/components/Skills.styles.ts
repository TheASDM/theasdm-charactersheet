import styled from 'styled-components';

// Skills Section Container
export const SkillsSection = styled.div`
  border: 2px solid #333;
  border-radius: 6px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
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
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  min-height: 20px;
  max-height: 22px;

  .skill-name {
    color: #e0e0e0;
    margin-left: 0.15rem;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
    display: flex;
    align-items: baseline;

    .ability-abbr {
      font-size: 0.6rem;
      color: rgba(206, 144, 22, 0.5);
      margin-left: 0.2rem;
      font-weight: 400;
    }
  }

  .skill-bonus {
    color: #ce9016;
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

  .proficiency-marker {
    color: #ce9016;
    font-size: 0.6rem;
    margin-right: 0.25rem;
    line-height: 1;
  }
`;