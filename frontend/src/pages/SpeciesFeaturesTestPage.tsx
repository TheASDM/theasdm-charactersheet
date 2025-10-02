import React from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: #1a1a1a;
  color: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Message = styled.div`
  text-align: center;
  color: #d4af37;
  font-size: 1.2rem;
  padding: 2rem;
  background: rgba(212, 175, 55, 0.1);
  border: 2px solid #d4af37;
  border-radius: 8px;
  max-width: 600px;
`;

export const SpeciesFeaturesTestPage: React.FC = () => {
  return (
    <PageContainer>
      <h1 style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', fontSize: '2.5rem', marginBottom: '1.5rem' }}>
        Character Features Test - D&D 2024
      </h1>
      <Message>
        <p style={{ marginBottom: '1rem' }}>
          This test page is temporarily disabled.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
          The feature generator has been upgraded to async to support the new choice-based class system.
          This page needs to be refactored to use React state/effects for async data loading.
        </p>
      </Message>
    </PageContainer>
  );
};

export default SpeciesFeaturesTestPage;
