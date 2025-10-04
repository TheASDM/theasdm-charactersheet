import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Species } from '../types/api';
import { listSpecies } from '@/services/speciesService';
import SpeciesCard from '@/components/SpeciesCard';
import SpeciesModal from '@/components/SpeciesModal';
import { useApiCall } from '@/hooks/useApiCall';
import LoadingSpinner from '@/components/LoadingSpinner';

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
  max-width: 1200px;
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

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #d4af37;
  font-size: 1.4rem;
  font-weight: 600;
  font-family: 'Cinzel', serif;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #ff6b6b;
  text-align: center;
  font-family: 'Cinzel', serif;

  .error-title {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .error-message {
    color: #ccc;
    margin-bottom: 1rem;
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  color: #888;
  font-size: 1.2rem;
  margin-top: 60px;
  padding: 60px 20px;

  .title {
    font-size: 1.6rem;
    color: #d4af37;
    margin-bottom: 15px;
    font-weight: 600;
    font-family: 'Cinzel', serif;
  }

  .subtitle {
    font-size: 1.1rem;
    color: #ccc;
    line-height: 1.5;
  }
`;

const SpeciesPage: React.FC = () => {
  const [species, setSpecies] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);

  const { error, isLoading, execute: loadSpecies } = useApiCall(listSpecies, {
    onSuccess: setSpecies,
  });

  useEffect(() => {
    loadSpecies();
  }, [loadSpecies]);

  if (isLoading) {
    return (
      <PageContainer>
        <ContentContainer>
          <Header>
            <h1>D&D Species</h1>
            <p>Discover Your Heritage</p>
          </Header>
          <MainContainer>
            <LoadingMessage>
              <LoadingSpinner message="Loading species data..." />
            </LoadingMessage>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <Header>
            <h1>D&D Species</h1>
            <p>Discover Your Heritage</p>
          </Header>
          <MainContainer>
            <ErrorMessage>
              <div className="error-title">Error Loading Species</div>
              <div className="error-message">{error}</div>
            </ErrorMessage>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (species.length === 0) {
    return (
      <PageContainer>
        <ContentContainer>
          <Header>
            <h1>D&D Species</h1>
            <p>Discover Your Heritage</p>
          </Header>
          <MainContainer>
            <NoResultsMessage>
              <div className="title">No Species Found</div>
              <div className="subtitle">
                The ancient tomes appear to be empty...
              </div>
            </NoResultsMessage>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <h1>D&D Species</h1>
          <p>Choose from {species.length} ancestral lineages</p>
        </Header>
        <MainContainer>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
              justifyItems: 'center',
            }}
          >
            {species.map((sp) => (
              <SpeciesCard
                key={sp.id}
                species={sp}
                onClick={() => setSelectedSpecies(sp)}
              />
            ))}
          </div>
        </MainContainer>
      </ContentContainer>

      {selectedSpecies && (
        <SpeciesModal
          species={selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
        />
      )}
    </PageContainer>
  );
};

export default SpeciesPage;
