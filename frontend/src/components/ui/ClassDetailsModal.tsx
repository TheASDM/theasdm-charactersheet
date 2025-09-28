import React from 'react';
import styled from 'styled-components';

interface ClassDetailsModalProps {
  isOpen: boolean;
  className: string;
  classData: any;
  onSelect: () => void;
  onClose: () => void;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  animation: ${props => props.$isOpen ? 'fadeIn 0.3s ease' : 'none'};

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2520 100%);
  border: 3px solid #d4af37;
  border-radius: 12px;
  width: 90%;
  height: 85%;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.2);
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
  background: rgba(0, 0, 0, 0.3);
`;

const ClassName = styled.h1`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  margin: 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 2px 10px rgba(212, 175, 55, 0.5);
`;

const ClassTagline = styled.p`
  color: #ccc;
  text-align: center;
  margin: 0.5rem 0 0 0;
  font-style: italic;
  font-size: 1.1rem;
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d4af37;
    border-radius: 5px;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: #d4af37;
  font-weight: 600;
  font-size: 0.95rem;
`;

const InfoValue = styled.span`
  color: #f0f0f0;
  font-size: 0.95rem;
`;

const FeatureCard = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FeatureName = styled.h4`
  color: #d4af37;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
`;

const FeatureDescription = styled.p`
  color: #ccc;
  margin: 0;
  line-height: 1.5;
  font-size: 0.9rem;
`;

const ProficienciesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
`;

const ProficiencyItem = styled.div`
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  color: #ccc;
  font-size: 0.9rem;
`;

const SelectButton = styled.button`
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 2.5rem;
  background: linear-gradient(145deg, #d4af37, #b8941f);
  border: 2px solid #d4af37;
  border-radius: 8px;
  color: #1a1a1a;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6);
    background: linear-gradient(145deg, #e0bb43, #c4a025);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #d4af37;
  border-radius: 50%;
  color: #d4af37;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(212, 175, 55, 0.2);
    transform: rotate(90deg);
  }
`;

export const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({
  isOpen,
  className,
  classData,
  onSelect,
  onClose
}) => {
  if (!classData) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>

        <ModalHeader>
          <ClassName>{className}</ClassName>
          <ClassTagline>{classData.description}</ClassTagline>
        </ModalHeader>

        <ModalContent>
          <ContentGrid>
            {/* Core Stats */}
            <Section>
              <SectionTitle>Core Statistics</SectionTitle>
              <InfoRow>
                <InfoLabel>Hit Die:</InfoLabel>
                <InfoValue>d{classData.hitDie}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Primary Ability:</InfoLabel>
                <InfoValue>{classData.primaryAbility}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Saving Throws:</InfoLabel>
                <InfoValue>{classData.savingThrows}</InfoValue>
              </InfoRow>
            </Section>

            {/* Proficiencies */}
            <Section>
              <SectionTitle>Proficiencies</SectionTitle>
              <ProficienciesGrid>
                {classData.proficiencies.armor && (
                  <ProficiencyItem>
                    <strong>Armor:</strong> {classData.proficiencies.armor}
                  </ProficiencyItem>
                )}
                {classData.proficiencies.weapons && (
                  <ProficiencyItem>
                    <strong>Weapons:</strong> {classData.proficiencies.weapons}
                  </ProficiencyItem>
                )}
                {classData.proficiencies.tools && (
                  <ProficiencyItem>
                    <strong>Tools:</strong> {classData.proficiencies.tools}
                  </ProficiencyItem>
                )}
                {classData.proficiencies.skills && (
                  <ProficiencyItem>
                    <strong>Skills:</strong> {classData.proficiencies.skills}
                  </ProficiencyItem>
                )}
              </ProficienciesGrid>
            </Section>
          </ContentGrid>

          {/* Class Features */}
          <Section style={{ marginTop: '2rem' }}>
            <SectionTitle>Level 1 Class Features</SectionTitle>
            {classData.classFeatures && Object.entries(classData.classFeatures).map(([name, feature]: [string, any]) => (
              <FeatureCard key={name}>
                <FeatureName>{name}</FeatureName>
                <FeatureDescription>{feature.description}</FeatureDescription>
                {feature.details && (
                  <FeatureDescription style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.9 }}>
                    {feature.details}
                  </FeatureDescription>
                )}
              </FeatureCard>
            ))}
          </Section>
        </ModalContent>

        <SelectButton onClick={onSelect}>
          Select {className}
        </SelectButton>
      </ModalContainer>
    </ModalOverlay>
  );
};