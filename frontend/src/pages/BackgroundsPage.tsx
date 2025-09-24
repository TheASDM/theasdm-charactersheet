import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { backgroundService } from '../services';
import { Background } from '../types/api';
import { ResponsiveTable } from '../components';
import { parseDnDTemplateTag } from '../utils/dndTemplateParser';

// Styled components for consistent D&D styling
const PageContainer = styled.div`
  min-height: 50vh;
  background: white;
  font-family: 'Georgia', serif;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  min-height: 50vh;
`;

const Title = styled.h1`
  color: #2c3e50;
  padding-top: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 2.5rem;
`;

const MainContent = styled.div`
  padding: 24px;
`;

const Description = styled.p`
  color: #666;
  font-size: 16px;
  margin-bottom: 24px;
  text-align: center;
  line-height: 1.6;
`;

const BackgroundName = styled.div`
  font-weight: bold;
  color: #8b4513;
  font-size: 16px;
  margin-bottom: 4px;
`;

const SkillList = styled.div`
  color: #2e7d32;
  font-weight: 500;
`;

const EquipmentList = styled.div`
  color: #1976d2;
  font-size: 13px;
  line-height: 1.3;
`;

const AbilityList = styled.div`
  color: #7b1fa2;
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #666;
  font-size: 1.1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #f44336;
  text-align: center;
`;

// Using Background type from api.ts

const BackgroundsPage: React.FC = () => {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        setLoading(true);
        const response = await backgroundService.getAll();
        setBackgrounds(response.data || []);
      } catch (err) {
        console.error('Error fetching backgrounds:', err);
        setError('Failed to load backgrounds');
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();
  }, []);

  // Helper functions to parse the complex JSON data
  const parseSkillProficiencies = (
    skills?: Record<string, boolean>
  ): string => {
    if (!skills || typeof skills !== 'object') return '—';

    return Object.keys(skills)
      .filter((skill) => skills[skill])
      .map((skill) => skill.charAt(0).toUpperCase() + skill.slice(1))
      .join(', ');
  };

  const parseEquipment = (equipment?: any[]): string => {
    if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
      return '—';
    }

    try {
      const equipmentItem = equipment[0];
      if (!equipmentItem?.item) return '—';

      const { A, B } = equipmentItem.item;
      let result = '';

      if (A && Array.isArray(A)) {
        const optionA = A.map((item) => {
          if (item.displayName) return item.displayName;
          if (item.item) {
            // Convert item codes to readable names
            const itemName = item.item
              .split('|')[0]
              .split(/[-_]/)
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join(' ');
            return item.quantity ? `${itemName} (${item.quantity})` : itemName;
          }
          if (item.value) return `${item.value / 100} gp`;
          return 'Unknown item';
        }).join(' • ');

        if (optionA) result += `Option A: ${optionA}`;
      }

      if (B && Array.isArray(B)) {
        const optionB = B.map((item) => {
          if (item.value) return `${item.value / 100} gp`;
          return 'Equipment';
        }).join(' • ');

        if (optionB) {
          if (result) result += ' OR ';
          result += `Option B: ${optionB}`;
        }
      }

      return result || '—';
    } catch (error) {
      console.error('Error parsing equipment:', error);
      return 'Complex equipment options';
    }
  };

  const parseAbilityScoreIncrease = (asi?: any): string => {
    if (!asi || typeof asi !== 'object') return '—';

    try {
      if (
        asi.type === 'weighted_choice' &&
        asi.options &&
        Array.isArray(asi.options)
      ) {
        const abilities = asi.options.map((ability: string) => {
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

        return `Choose one: ${abilities.join(' • ')}`;
      }

      return 'Custom ability increase';
    } catch (error) {
      console.error('Error parsing ability score increase:', error);
      return 'Ability score increase';
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentContainer>
          <LoadingContainer>Loading backgrounds...</LoadingContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <ErrorContainer>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </ErrorContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
        <Title>📜 Backgrounds</Title>

        <MainContent>
          <ResponsiveTable
            keyField="id"
            data={backgrounds}
            columns={[
              {
                key: 'name',
                header: 'Background',
                render: (_value, row) => (
                  <div>
                    <BackgroundName>{row.name}</BackgroundName>
                    {row.description && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#666',
                          marginTop: '4px',
                        }}
                      >
                        {parseDnDTemplateTag(row.description)}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'skillProficiencies',
                header: 'Skill Proficiencies',
                mobile: false, // Hide on mobile to save space
                render: (_value, row) => (
                  <SkillList>
                    {parseSkillProficiencies(row.skillProficiencies)}
                  </SkillList>
                ),
              },
              {
                key: 'equipment',
                header: 'Equipment',
                mobile: false, // Hide on mobile to save space
                render: (_value, row) => (
                  <EquipmentList>{parseEquipment(row.equipment)}</EquipmentList>
                ),
              },
              {
                key: 'abilityScoreIncrease',
                header: 'Ability Score Increase',
                mobile: false, // Hide on mobile to save space
                render: (_value, row) => (
                  <AbilityList>
                    {parseAbilityScoreIncrease(row.abilityScoreIncrease)}
                  </AbilityList>
                ),
              },
              // Mobile-specific column that combines all details
              {
                key: 'details',
                header: 'Details',
                desktop: false, // Only show on mobile
                render: (_value, row) => (
                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong>Skills:</strong>
                      <div style={{ marginTop: '0.25rem' }}>
                        {parseSkillProficiencies(row.skillProficiencies)}
                      </div>
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong>Equipment:</strong>
                      <div style={{ marginTop: '0.25rem' }}>
                        {parseEquipment(row.equipment)}
                      </div>
                    </div>
                    <div>
                      <strong>Ability Increase:</strong>
                      <div style={{ marginTop: '0.25rem' }}>
                        {parseAbilityScoreIncrease(row.abilityScoreIncrease)}
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default BackgroundsPage;
