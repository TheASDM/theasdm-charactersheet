import React from 'react';
import styled from 'styled-components';
import { ClassList } from '../components';

// Main page container matching Generator theme
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
`;

// Header section
const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-family: 'Cinzel', serif;
    font-size: 3rem;
    color: #d4af37;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  p {
    font-size: 1.2rem;
    color: #ccc;
    max-width: 600px;
    margin: 0 auto;
  }
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

// Main container matching Generator's WizardContent
const MainContainer = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 3rem;
  min-height: 500px;
  backdrop-filter: blur(10px);
`;

const ClassesPage: React.FC = () => {
  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <h1>D&D Classes</h1>
          <p>Choose Your Path</p>
        </Header>
        <MainContainer>
          <ClassList showSearch={false} />
        </MainContainer>
      </ContentContainer>
    </PageContainer>
  );
};

export default ClassesPage;
