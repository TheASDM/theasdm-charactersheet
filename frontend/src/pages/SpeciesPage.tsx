import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Species } from '../types/api';
import { speciesService } from '../services/speciesService';
import SpeciesCard from '../components/SpeciesCard';
import { Hero } from '../components';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

// Main page container with forest green background (matching feats page)
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #363636ff 0%,
    #4b4b4bff 25%,
    #323232ff 50%,
    #222222ff 75%,
    #0e0e0eff 100%
  );
  padding: 0;
  font-family: 'Crimson Text', serif;
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

// Main container that holds everything below the hero (matching feats page)
const MainContainer = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border: 2px solid #8b6914;
  border-radius: 20px 20px 15px 15px;
  margin: 0 20px;
  margin-top: -5px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(139, 105, 20, 0.3);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  /* Medieval parchment texture */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="paper"><feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/></filter></defs><rect width="100" height="100" fill="rgba(101,67,33,0.1)" filter="url(%23paper)"/></svg>')
      repeat;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 768px) {
    margin: 0 10px;
    margin-top: -2px;
  }

  @media (max-width: 480px) {
    margin: 0 5px;
    margin-top: -2px;
  }
`;

// Content inside the main container
const MainContent = styled.div`
  position: relative;
  z-index: 2;
  padding: 30px;

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 15px;
  }
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #d4af37;
  font-size: 1.4rem;
  font-weight: 600;
  font-family: 'Cinzel', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #d4af37;
  text-align: center;
  font-family: 'Cinzel', serif;

  .error-title {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .error-message {
    margin-bottom: 1rem;
    opacity: 0.8;
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  color: #a0824a;
  font-size: 1.4rem;
  margin-top: 60px;
  padding: 60px 20px;
  font-family: 'Cinzel', serif;
  font-style: italic;

  .title {
    font-size: 1.6rem;
    color: #d4af37;
    margin-bottom: 15px;
    font-weight: 600;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #c9a961;
    line-height: 1.5;
  }
`;

const SpeciesPage: React.FC = () => {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        setLoading(true);
        const response = await speciesService.getAll();
        if (response.data) {
          setSpecies(response.data);
        } else {
          setError(
            response.error ||
              'Failed to gather species knowledge from the ancient tomes.'
          );
        }
      } catch (err) {
        setError('Error loading species data from the archives');
        console.error('Error fetching species:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  if (loading) {
    return (
      <>
        <FontImport />
        <PageContainer>
          <ContentContainer>
            <Hero
              title="D&D SPECIES"
              subtitle="Discover Your Heritage"
              height="280px"
            />
            <MainContainer>
              <MainContent>
                <LoadingMessage>
                  📚 Gathering Ancient Knowledge from the Bloodlines...
                </LoadingMessage>
              </MainContent>
            </MainContainer>
          </ContentContainer>
        </PageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <FontImport />
        <PageContainer>
          <ContentContainer>
            <Hero
              title="D&D SPECIES"
              subtitle="Discover Your Heritage"
              height="280px"
            />
            <MainContainer>
              <MainContent>
                <ErrorMessage>
                  <div className="error-title">
                    🏛️ Ancient Records Unavailable
                  </div>
                  <div className="error-message">{error}</div>
                </ErrorMessage>
              </MainContent>
            </MainContainer>
          </ContentContainer>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <FontImport />
      <PageContainer>
        <ContentContainer>
          <Hero
            title="D&D SPECIES"
            subtitle="Discover Your Heritage"
            height="280px"
          />

          <MainContainer>
            <MainContent>
              {species.map((speciesItem) => (
                <SpeciesCard key={speciesItem.id} species={speciesItem} />
              ))}

              {species.length === 0 && !loading && (
                <NoResultsMessage>
                  <div className="title">
                    🏛️ No Species Found in the Chronicles
                  </div>
                  <div className="subtitle">
                    The ancient bloodlines remain hidden. Check back as new
                    knowledge is gathered from distant realms.
                  </div>
                </NoResultsMessage>
              )}
            </MainContent>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export default SpeciesPage;
