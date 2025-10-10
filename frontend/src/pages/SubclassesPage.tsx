import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { CharacterClass } from '../types/api';
import { useApiCall } from '@/hooks/useApiCall';
import { listClasses } from '@/services/classService';

// Main page container matching Classes page
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
    color: #ce9016;
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

const BackButton = styled(Link)`
  display: inline-block;
  background: rgba(206, 144, 22, 0.2);
  color: #ce9016;
  border: 2px solid #ce9016;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-family: 'Cinzel', serif;
  margin-bottom: 2rem;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    background: rgba(206, 144, 22, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(206, 144, 22, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

// Main container
const MainContainer = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 3rem;
  min-height: 500px;
  backdrop-filter: blur(10px);
`;

const ClassSection = styled.div`
  margin-bottom: 3rem;
`;

const ClassTitle = styled.h2`
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  color: #ce9016;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #444;
`;

const SubclassesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const SubclassCard = styled.div`
  background: rgba(45, 45, 45, 0.6);
  border: 1px solid #555;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    border-color: #ce9016;
  }
`;

const SubclassName = styled.h3`
  color: #ce9016;
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  font-family: 'Cinzel', serif;
`;

const SubclassInfo = styled.div`
  margin-bottom: 1rem;
  color: #ccc;
  font-size: 0.9rem;

  strong {
    color: #ce9016;
    font-weight: 600;
  }
`;

const FeatureList = styled.div`
  margin-top: 1rem;
`;

const FeatureLevel = styled.div`
  margin-bottom: 0.75rem;
  background: rgba(35, 35, 35, 0.5);
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #ce9016;

  strong {
    color: #ce9016;
    font-weight: 600;
    display: block;
    margin-bottom: 0.25rem;
  }

  p {
    margin: 0;
    color: #f0f0f0;
    font-size: 0.85rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #ce9016;
  font-size: 1.4rem;
  font-weight: 600;
  font-family: 'Cinzel', serif;
`;

const ErrorContainer = styled.div`
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

const SubclassesPage: React.FC = () => {
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [expandedSubclass, setExpandedSubclass] = useState<string | null>(null);

  const {
    data: classData,
    error,
    isLoading,
    execute: fetchClasses,
  } = useApiCall(listClasses, {
    onSuccess: (loaded) => {
      setClasses(loaded);
    },
  });

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (classData) {
      setClasses(classData);
    }
  }, [classData]);

  const getSubclassesForClass = (characterClass: CharacterClass) => {
    if (!characterClass.subclassFeatures) return [];
    if (
      typeof characterClass.subclassFeatures === 'object' &&
      characterClass.subclassFeatures !== null
    ) {
      return Object.entries(characterClass.subclassFeatures).map(
        ([name, details]: [string, any]) => {
          // Parse level features if they exist
          const levelFeatures: { [level: string]: any[] } = {};

          if (details && typeof details === 'object' && details.features) {
            Object.entries(details.features).forEach(([level, features]) => {
              levelFeatures[level] = Array.isArray(features)
                ? features
                : [features];
            });
          }

          return {
            name,
            className: characterClass.name,
            details,
            levelFeatures,
            source: details?.source || "Player's Handbook",
            page: details?.page || null,
          };
        }
      );
    }
    return [];
  };

  const getSubclassesByClass = () => {
    const byClass: { [className: string]: any[] } = {};
    classes.forEach((characterClass) => {
      const subclasses = getSubclassesForClass(characterClass);
      if (subclasses.length > 0) {
        byClass[characterClass.name] = subclasses;
      }
    });
    return byClass;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ContentContainer>
          <MainContainer>
            <LoadingContainer>Loading subclasses...</LoadingContainer>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <MainContainer>
            <ErrorContainer>
              <div className="error-title">Error Loading Subclasses</div>
              <div className="error-message">{error}</div>
            </ErrorContainer>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  const subclassesByClass = getSubclassesByClass();

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <h1>D&D Subclasses</h1>
          <p>Specialized paths for every adventurer</p>
        </Header>

        <BackButton to="/classes">← Back to Classes</BackButton>

        <MainContainer>
          {Object.entries(subclassesByClass).map(([className, subclasses]) => (
            <ClassSection key={className}>
              <ClassTitle>
                {className} Subclasses ({subclasses.length})
              </ClassTitle>
              <SubclassesGrid>
                {subclasses.map((subclass) => (
                  <SubclassCard
                    key={`${subclass.className}-${subclass.name}`}
                    onClick={() => {
                      const id = `${subclass.className}-${subclass.name}`;
                      setExpandedSubclass(
                        expandedSubclass === id ? null : id
                      );
                    }}
                  >
                    <SubclassName>{subclass.name}</SubclassName>
                    <SubclassInfo>
                      <strong>Class:</strong> {subclass.className}
                    </SubclassInfo>
                    <SubclassInfo>
                      <strong>Source:</strong> {subclass.source}
                      {subclass.page && ` • Page ${subclass.page}`}
                    </SubclassInfo>

                    {/* Show features if expanded */}
                    {expandedSubclass ===
                      `${subclass.className}-${subclass.name}` &&
                      Object.keys(subclass.levelFeatures).length > 0 && (
                        <FeatureList>
                          <SubclassInfo>
                            <strong>Features by Level:</strong>
                          </SubclassInfo>
                          {Object.entries(subclass.levelFeatures)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([level, features]) => (
                              <FeatureLevel key={level}>
                                <strong>Level {level}</strong>
                                {(Array.isArray(features) ? features : [features]).map((feature, idx) => (
                                  <p key={idx}>
                                    {typeof feature === 'object' && feature.name
                                      ? feature.name
                                      : typeof feature === 'string'
                                      ? feature
                                      : 'Special feature'}
                                  </p>
                                ))}
                              </FeatureLevel>
                            ))}
                        </FeatureList>
                      )}

                    {Object.keys(subclass.levelFeatures).length === 0 && (
                      <SubclassInfo style={{ fontStyle: 'italic', marginTop: '1rem' }}>
                        Detailed features available in {subclass.source}
                      </SubclassInfo>
                    )}
                  </SubclassCard>
                ))}
              </SubclassesGrid>
            </ClassSection>
          ))}

          {Object.keys(subclassesByClass).length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', padding: '3rem' }}>
              <p style={{ fontSize: '1.2rem' }}>No subclasses found.</p>
            </div>
          )}
        </MainContainer>
      </ContentContainer>
    </PageContainer>
  );
};

export default SubclassesPage;
