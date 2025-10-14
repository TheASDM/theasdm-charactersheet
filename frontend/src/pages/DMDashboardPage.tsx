import React from 'react';
import { Helmet } from 'react-helmet-async';
import styled from 'styled-components';

const Container = styled.div`
  min-height: calc(100vh - 70px);
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #111 0%, #060606 100%);
  color: #eee;
`;

const Card = styled.div`
  max-width: 960px;
  margin: 0 auto;
  background: rgba(20, 20, 20, 0.9);
  border: 1px solid rgba(206, 144, 22, 0.25);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
`;

const Title = styled.h1`
  font-family: 'Cinzel', serif;
  color: #ce9016;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  color: #aaa;
  margin-bottom: 2rem;
`;

const FeatureList = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(206, 144, 22, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
`;

const FeatureTitle = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: #f5b942;
`;

const FeatureDescription = styled.p`
  margin: 0;
  color: #bbb;
`;

const DMDashboardPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>DM Tools (Preview) - Dungeons.WTF</title>
      </Helmet>
      <Container>
        <Card>
          <Title>Dungeon Master Toolbox</Title>
          <Subtitle>
            You've unlocked early access to the DM workspace. The tools below are under construction,
            but this page will expand with campaign management, encounter planning, and player coordination features.
          </Subtitle>

          <FeatureList>
            <FeatureCard>
              <FeatureTitle>🗺️ Campaign Control Panel</FeatureTitle>
              <FeatureDescription>
                Track your campaigns, invite players, and manage session notes all in one place. Coming soon.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>🧮 Encounter Builder</FeatureTitle>
              <FeatureDescription>
                Quickly assemble balanced encounters using the WTForge 2024 ruleset. Tune difficulty and export to your table.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>📜 Narrative Toolkit</FeatureTitle>
              <FeatureDescription>
                Organize NPCs, plot hooks, and world lore. Easily share story beats with players when you're ready.
              </FeatureDescription>
            </FeatureCard>
          </FeatureList>
        </Card>
      </Container>
    </>
  );
};

export default DMDashboardPage;
