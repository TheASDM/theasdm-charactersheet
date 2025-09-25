import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { backgroundService } from '../services';
import { Background } from '../types/api';
import { Hero } from '../components';
import { parseDnDTemplateTag } from '../utils/dndTemplateParser';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

// Main page container with forest green background
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

// Main container that holds everything below the hero
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
const ContainerContent = styled.div`
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

// Search section
const SearchSection = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border: 2px solid #8b6914;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  padding: 30px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 15px;
  }
`;

const SearchInput = styled.input`
  background: linear-gradient(145deg, #4a2a1a, #3a1a0a);
  border: 2px solid #8b6914;
  border-radius: 12px;
  padding: 16px 20px;
  color: #d4af37;
  font-family: 'Crimson Text', serif;
  font-size: 18px;
  width: 100%;
  transition: all 0.3s ease;
  font-style: italic;

  &::placeholder {
    color: #a0824a;
    font-style: italic;
  }

  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
    font-style: normal;
  }

  &:hover {
    border-color: #d4af37;
  }
`;

// Background cards grid
const BackgroundsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 25px;
  margin-bottom: 2rem;
  contain: layout style;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  @media (max-width: 480px) {
    gap: 15px;
  }
`;

// Individual background card
const BackgroundCard = styled.div`
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 3px solid #8b6914;
  border-radius: 15px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  font-family: 'Crimson Text', serif;
  overflow: hidden;
  position: relative;
  color: #2c1810;
  will-change: transform;
  contain: layout style paint;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    border-color: #d4af37;
  }
`;

const BackgroundHeader = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.9),
    rgba(74, 42, 26, 0.9)
  );
  color: #d4af37;
  padding: 20px 25px;
  border-bottom: 2px solid #8b6914;
  position: relative;

  @media (max-width: 480px) {
    padding: 15px 20px;
  }
`;

const BackgroundName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #d4af37;
  font-family: 'Cinzel', serif;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
`;

const BackgroundDescription = styled.div`
  font-size: 0.9rem;
  color: #c9a961;
  font-style: italic;
  line-height: 1.4;
`;

const BackgroundContent = styled.div`
  padding: 25px;
  background: transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const DetailSection = styled.div`
  background: rgba(139, 105, 20, 0.1);
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #8b6914;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(139, 105, 20, 0.15);
    transform: translateX(2px);
  }

  .label {
    color: #8b6914;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Cinzel', serif;
    margin-bottom: 8px;
    display: block;
  }

  .content {
    color: #2c1810;
    font-weight: 500;
    line-height: 1.4;
    font-size: 0.95rem;
  }
`;

const SkillTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 5px;
`;

const SkillTag = styled.span`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const EquipmentOptions = styled.div`
  .option {
    margin: 8px 0;
    padding: 8px 12px;
    background: rgba(212, 175, 55, 0.1);
    border-radius: 6px;
    border-left: 3px solid #d4af37;
    font-size: 0.9rem;

    .option-label {
      font-weight: 600;
      color: #8b6914;
      margin-bottom: 4px;
      font-size: 0.8rem;
    }
  }
`;

const AbilityChoice = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 5px;
`;

const AbilityTag = styled.span`
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #2c1810;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
`;

// Loading and error states
const LoadingContainer = styled.div`
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

const ErrorContainer = styled.div`
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

  button {
    background: linear-gradient(145deg, #d4af37, #b8941f);
    color: #2c1810;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Cinzel', serif;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
      background: linear-gradient(145deg, #b8941f, #a0801b);
    }
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

const BackgroundsPage: React.FC = () => {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [filteredBackgrounds, setFilteredBackgrounds] = useState<Background[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        setLoading(true);
        const response = await backgroundService.getAll();
        const backgroundsData = response.data || [];
        setBackgrounds(backgroundsData);
        setFilteredBackgrounds(backgroundsData);
      } catch (err) {
        console.error('Error fetching backgrounds:', err);
        setError('Failed to load backgrounds from the chronicles of old.');
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();
  }, []);

  // Filter backgrounds based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredBackgrounds(backgrounds);
    } else {
      const search = searchTerm.toLowerCase();
      const filtered = backgrounds.filter(
        (bg) =>
          bg.name?.toLowerCase().includes(search) ||
          bg.description?.toLowerCase().includes(search) ||
          parseSkillProficiencies(bg.skillProficiencies)
            .toLowerCase()
            .includes(search)
      );
      setFilteredBackgrounds(filtered);
    }
  }, [backgrounds, searchTerm]);

  // Helper functions to parse the complex JSON data
  const parseSkillProficiencies = (
    skills?: Record<string, boolean>
  ): string => {
    if (!skills || typeof skills !== 'object') return 'None';

    return (
      Object.keys(skills)
        .filter((skill) => skills[skill])
        .map((skill) => skill.charAt(0).toUpperCase() + skill.slice(1))
        .join(', ') || 'None'
    );
  };

  const getSkillArray = (skills?: Record<string, boolean>): string[] => {
    if (!skills || typeof skills !== 'object') return [];

    return Object.keys(skills)
      .filter((skill) => skills[skill])
      .map((skill) => skill.charAt(0).toUpperCase() + skill.slice(1));
  };

  const parseEquipment = (equipment?: any[]): JSX.Element => {
    if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
      return <div className="content">No equipment listed</div>;
    }

    try {
      const equipmentItem = equipment[0];
      if (!equipmentItem?.item)
        return <div className="content">No equipment listed</div>;

      const { A, B } = equipmentItem.item;

      return (
        <EquipmentOptions>
          {A && Array.isArray(A) && (
            <div className="option">
              <div className="option-label">Option A:</div>
              {A.map((item, index) => {
                let itemText = '';
                if (item.displayName) itemText = item.displayName;
                else if (item.item) {
                  const itemName = item.item
                    .split('|')[0]
                    .split(/[-_]/)
                    .map(
                      (word: string) =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(' ');
                  itemText = item.quantity
                    ? `${itemName} (${item.quantity})`
                    : itemName;
                } else if (item.value) itemText = `${item.value / 100} gp`;
                else itemText = 'Equipment item';

                return <div key={index}>{itemText}</div>;
              })}
            </div>
          )}

          {B && Array.isArray(B) && (
            <div className="option">
              <div className="option-label">Option B:</div>
              {B.map((item, index) => {
                let itemText = '';
                if (item.value) itemText = `${item.value / 100} gp`;
                else itemText = 'Alternative equipment';

                return <div key={index}>{itemText}</div>;
              })}
            </div>
          )}
        </EquipmentOptions>
      );
    } catch (error) {
      console.error('Error parsing equipment:', error);
      return (
        <div className="content">
          Complex equipment options - see source material
        </div>
      );
    }
  };

  const parseAbilityScoreIncrease = (asi?: any): string[] => {
    if (!asi || typeof asi !== 'object') return [];

    try {
      if (
        asi.type === 'weighted_choice' &&
        asi.options &&
        Array.isArray(asi.options)
      ) {
        return asi.options.map((ability: string) => {
          switch (ability.toLowerCase()) {
            case 'str':
              return 'Strength';
            case 'dex':
              return 'Dexterity';
            case 'con':
              return 'Constitution';
            case 'int':
              return 'Intelligence';
            case 'wis':
              return 'Wisdom';
            case 'cha':
              return 'Charisma';
            default:
              return ability.charAt(0).toUpperCase() + ability.slice(1);
          }
        });
      }

      return ['Custom increase'];
    } catch (error) {
      console.error('Error parsing ability score increase:', error);
      return ['See source'];
    }
  };

  if (loading) {
    return (
      <>
        <FontImport />
        <PageContainer>
          <ContentContainer>
            <Hero
              title="D&D BACKGROUNDS"
              subtitle="Forge Your Past"
              height="400px"
            />
            <MainContainer>
              <ContainerContent>
                <LoadingContainer>
                  📜 Reading the Chronicles of Adventure...
                </LoadingContainer>
              </ContainerContent>
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
              title="D&D BACKGROUNDS"
              subtitle="Forge Your Past"
              height="400px"
            />
            <MainContainer>
              <ContainerContent>
                <ErrorContainer>
                  <div className="error-title">
                    📚 Ancient Records Unavailable
                  </div>
                  <div className="error-message">{error}</div>
                  <button onClick={() => window.location.reload()}>
                    Retry Incantation
                  </button>
                </ErrorContainer>
              </ContainerContent>
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
            title="D&D BACKGROUNDS"
            subtitle="Forge Your Past"
            height="400px"
          />

          <MainContainer>
            <ContainerContent>
              {/* Search Section */}
              <SearchSection>
                <SearchInput
                  type="text"
                  placeholder="Search the annals of history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchSection>

              {/* Content */}
              {filteredBackgrounds.length === 0 ? (
                <NoResultsMessage>
                  <div className="title">
                    📜 No Backgrounds Found in the Archives
                  </div>
                  <div className="subtitle">
                    The records of your past remain hidden. Try different search
                    terms to uncover your origins.
                  </div>
                </NoResultsMessage>
              ) : (
                <BackgroundsGrid>
                  {filteredBackgrounds.map((background, index) => (
                    <BackgroundCard
                      key={background.id || background.name || index}
                    >
                      <BackgroundHeader>
                        <BackgroundName>{background.name}</BackgroundName>
                        {background.description && (
                          <BackgroundDescription>
                            {parseDnDTemplateTag(background.description)}
                          </BackgroundDescription>
                        )}
                      </BackgroundHeader>

                      <BackgroundContent>
                        {/* Skill Proficiencies */}
                        <DetailSection>
                          <span className="label">Skill Proficiencies:</span>
                          <div className="content">
                            {getSkillArray(background.skillProficiencies)
                              .length > 0 ? (
                              <SkillTags>
                                {getSkillArray(
                                  background.skillProficiencies
                                ).map((skill, idx) => (
                                  <SkillTag key={idx}>{skill}</SkillTag>
                                ))}
                              </SkillTags>
                            ) : (
                              'None specified'
                            )}
                          </div>
                        </DetailSection>

                        {/* Equipment */}
                        <DetailSection>
                          <span className="label">Equipment:</span>
                          {parseEquipment(background.equipment)}
                        </DetailSection>

                        {/* Ability Score Increase */}
                        <DetailSection>
                          <span className="label">Ability Score Increase:</span>
                          <div className="content">
                            {parseAbilityScoreIncrease(
                              background.abilityScoreIncrease
                            ).length > 0 ? (
                              <>
                                <div style={{ marginBottom: '8px' }}>
                                  Choose one:
                                </div>
                                <AbilityChoice>
                                  {parseAbilityScoreIncrease(
                                    background.abilityScoreIncrease
                                  ).map((ability, idx) => (
                                    <AbilityTag key={idx}>{ability}</AbilityTag>
                                  ))}
                                </AbilityChoice>
                              </>
                            ) : (
                              'None specified'
                            )}
                          </div>
                        </DetailSection>
                      </BackgroundContent>
                    </BackgroundCard>
                  ))}
                </BackgroundsGrid>
              )}
            </ContainerContent>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export default BackgroundsPage;
