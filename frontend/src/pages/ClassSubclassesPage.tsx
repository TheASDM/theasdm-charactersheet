import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { CharacterClass, isError } from '../types/api';
import { classService } from '../services';
import { parseDnDTemplateTag } from '../utils/dndTemplateParser';
import { logger } from '../utils/logger';

// Main page container matching Classes page
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

// Header section
const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-family: 'Cinzel', serif;
    font-size: 3rem;
    color: #d4af37;
    margin-bottom: 0.5rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  p {
    font-size: 1.2rem;
    color: #ccc;
  }
`;

const BackButton = styled(Link)`
  display: inline-block;
  background: rgba(212, 175, 55, 0.2);
  color: #d4af37;
  border: 2px solid #d4af37;
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
    background: rgba(212, 175, 55, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Main container
const MainContainer = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 3rem;
  backdrop-filter: blur(10px);
`;

const SubclassSection = styled.div`
  margin-bottom: 3rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SubclassTitle = styled.h2`
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  color: #d4af37;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #444;
`;

const SubclassInfo = styled.div`
  background: rgba(35, 35, 35, 0.5);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 3px solid #d4af37;

  p {
    margin: 0;
    color: #ccc;
    font-size: 0.9rem;

    strong {
      color: #d4af37;
      font-weight: 600;
    }
  }
`;

const FeatureBlock = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(35, 35, 35, 0.5);
  border-radius: 8px;
  border: 1px solid #444;
`;

const FeatureLevel = styled.div`
  display: inline-block;
  background: rgba(212, 175, 55, 0.2);
  color: #d4af37;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(212, 175, 55, 0.3);
`;

const FeatureName = styled.h3`
  color: #d4af37;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  font-family: 'Cinzel', serif;
`;

const FeatureDescription = styled.div`
  font-size: 0.95rem;
  line-height: 1.7;
  color: #f0f0f0;

  p {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  ul, ol {
    margin: 0.75rem 0 1rem 1.5rem;
    color: #f0f0f0;
  }

  li {
    margin-bottom: 0.5rem;
  }

  strong {
    color: #d4af37;
    font-weight: 600;
  }

  em {
    color: #ccc;
    font-style: italic;
  }
`;

const NoFeaturesMessage = styled.div`
  background: rgba(35, 35, 35, 0.5);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  color: #888;
  font-style: italic;
  border: 1px dashed #444;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #d4af37;
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

const ClassSubclassesPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [characterClass, setCharacterClass] = useState<CharacterClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    if (!classId) {
      setError('Class ID not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await classService.getClassById(classId);

      if (isError(response)) {
        setError(response.error ?? 'Class not found');
      } else {
        setCharacterClass(response.data);
      }
    } catch (err) {
      setError('Failed to load class data from the ancient tomes.');
      logger.error('Error loading class:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSubclasses = () => {
    if (!characterClass?.subclassFeatures) return [];
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

  const renderFeatureEntry = (entry: any, index: number): React.ReactNode => {
    if (typeof entry === 'string') {
      const cleanedEntry = parseDnDTemplateTag(entry);
      if (cleanedEntry.trim()) {
        return (
          <p
            key={index}
            dangerouslySetInnerHTML={{
              __html: cleanedEntry,
            }}
          />
        );
      }
      return null;
    }

    // Handle nested entries
    if (typeof entry === 'object' && entry.type === 'entries' && entry.entries) {
      return (
        <div key={index} style={{ marginTop: '1rem' }}>
          {entry.name && (
            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#d4af37' }}>
              {entry.name}
            </strong>
          )}
          {entry.entries.map((nestedEntry: any, nestedIdx: number) =>
            renderFeatureEntry(nestedEntry, nestedIdx)
          )}
        </div>
      );
    }

    // Handle lists
    if (typeof entry === 'object' && entry.type === 'list' && entry.items) {
      return (
        <ul key={index} style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
          {entry.items.map((item: any, idx: number) => (
            <li key={idx}>
              {typeof item === 'string' ? parseDnDTemplateTag(item) : item.name || 'List item'}
            </li>
          ))}
        </ul>
      );
    }

    return null;
  };

  if (loading) {
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

  if (error || !characterClass) {
    return (
      <PageContainer>
        <ContentContainer>
          <MainContainer>
            <ErrorContainer>
              <div className="error-title">Error Loading Subclasses</div>
              <div className="error-message">{error || 'Class not found'}</div>
            </ErrorContainer>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  const subclasses = getSubclasses();

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <h1>{characterClass.name} Subclasses</h1>
          <p>{subclasses.length} specialized paths</p>
        </Header>

        <BackButton to="/classes">← Back to Classes</BackButton>

        <MainContainer>
          {subclasses.length > 0 ? (
            subclasses.map((subclass) => (
              <SubclassSection key={subclass.name}>
                <SubclassTitle>{subclass.name}</SubclassTitle>

                <SubclassInfo>
                  <p>
                    <strong>Source:</strong> {subclass.source}
                    {subclass.page && ` • Page ${subclass.page}`}
                  </p>
                </SubclassInfo>

                {Object.keys(subclass.levelFeatures).length > 0 ? (
                  Object.entries(subclass.levelFeatures)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([level, features]) => (
                      <div key={level}>
                        {(Array.isArray(features) ? features : [features]).map(
                          (feature: any, idx: number) => (
                            <FeatureBlock key={`${level}-${idx}`}>
                              <FeatureLevel>Level {level}</FeatureLevel>
                              <FeatureName>
                                {typeof feature === 'object' && feature.name
                                  ? feature.name
                                  : typeof feature === 'string'
                                  ? feature
                                  : 'Subclass Feature'}
                              </FeatureName>
                              <FeatureDescription>
                                {typeof feature === 'object' &&
                                feature.entries &&
                                Array.isArray(feature.entries) ? (
                                  feature.entries.map((entry: any, i: number) =>
                                    renderFeatureEntry(entry, i)
                                  )
                                ) : typeof feature === 'string' ? (
                                  <p>{parseDnDTemplateTag(feature)}</p>
                                ) : (
                                  <p>
                                    See {subclass.source} for detailed feature description.
                                  </p>
                                )}
                              </FeatureDescription>
                            </FeatureBlock>
                          )
                        )}
                      </div>
                    ))
                ) : (
                  <NoFeaturesMessage>
                    Detailed subclass features are available in {subclass.source}
                    {subclass.page && ` on page ${subclass.page}`}.
                  </NoFeaturesMessage>
                )}
              </SubclassSection>
            ))
          ) : (
            <NoFeaturesMessage>
              No subclasses found for this class.
            </NoFeaturesMessage>
          )}
        </MainContainer>
      </ContentContainer>
    </PageContainer>
  );
};

export default ClassSubclassesPage;