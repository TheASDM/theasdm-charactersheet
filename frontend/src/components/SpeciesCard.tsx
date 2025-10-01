import styled from 'styled-components';
import { Species } from '../types/api';

interface SpeciesCardProps {
  species: Species;
  onClick?: () => void;
}

const Card = styled.div`
  background: rgba(45, 45, 45, 0.6);
  border: 1px solid #555;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  color: #f0f0f0;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    border-color: #d4af37;
  }
`;

const SpeciesHeader = styled.div`
  background: rgba(35, 35, 35, 0.9);
  padding: 1rem;
  text-align: center;
  border-bottom: 2px solid #d4af37;
`;

const SpeciesTitle = styled.h3`
  color: #d4af37;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.5px;
  font-family: 'Cinzel', serif;
`;

const CardBody = styled.div`
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.9rem;

  strong {
    color: #d4af37;
    font-weight: 600;
    min-width: 100px;
  }

  span {
    color: #f0f0f0;
  }
`;

const SourceTag = styled.div`
  background: rgba(212, 175, 55, 0.2);
  color: #d4af37;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-block;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  border: 1px solid rgba(212, 175, 55, 0.3);
  align-self: flex-start;
  margin-top: auto;
`;

const Description = styled.p`
  color: #ccc;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default function SpeciesCard({ species, onClick }: SpeciesCardProps) {
  const formatSize = (size: string | string[] | null): string => {
    if (!size) return 'Unknown';
    if (Array.isArray(size)) {
      return size[0]
        ? size[0].charAt(0).toUpperCase() + size[0].slice(1).toLowerCase()
        : 'Unknown';
    }
    return size.charAt(0).toUpperCase() + size.slice(1).toLowerCase();
  };

  return (
    <Card onClick={onClick}>
      <SpeciesHeader>
        <SpeciesTitle>{species.name}</SpeciesTitle>
      </SpeciesHeader>

      <CardBody>
        <InfoRow>
          <strong>Size:</strong>
          <span>{formatSize(species.size)}</span>
        </InfoRow>

        <InfoRow>
          <strong>Speed:</strong>
          <span>{species.speed} feet</span>
        </InfoRow>

        <InfoRow>
          <strong>Type:</strong>
          <span>{species.creatureType || 'Humanoid'}</span>
        </InfoRow>

        {species.description && (
          <Description>{species.description}</Description>
        )}

        {species.source && <SourceTag>{species.source}</SourceTag>}
      </CardBody>
    </Card>
  );
}
