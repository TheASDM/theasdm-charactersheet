import styled from 'styled-components';
import type { MouseEvent } from 'react';
import { Species } from '../types/api';
import { parseComplexDnDEntry } from '../utils/dndTemplateParser';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface SpeciesModalProps {
  species: Species;
  onClose: () => void;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
  /* No overflow - backdrop doesn't scroll */
`;

const ModalContent = styled.div`
  background: rgba(26, 26, 26, 0.98);
  border: 2px solid #ce9016;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.9);
  position: relative;
  display: flex;
  flex-direction: column;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(206, 144, 22, 0.2);
  border: 1px solid #ce9016;
  color: #ce9016;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;

  &:hover {
    background: rgba(206, 144, 22, 0.4);
    transform: rotate(90deg);
  }
`;

const SpeciesHeader = styled.div`
  background: rgba(35, 35, 35, 0.9);
  padding: 1.5rem 2rem;
  text-align: center;
  border-bottom: 2px solid #ce9016;
  flex-shrink: 0;
`;

const SpeciesTitle = styled.h2`
  color: #ce9016;
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.5px;
  font-family: 'Cinzel', serif;
`;

const InfoSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #444;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoColumn = styled.div`
  border-right: 1px solid #444;

  &:last-child {
    border-right: none;
  }

  @media (max-width: 768px) {
    border-right: none;
    border-bottom: 1px solid #444;

    &:last-child {
      border-bottom: none;
    }
  }
`;

const ColumnHeader = styled.div`
  background: rgba(35, 35, 35, 0.8);
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: #ce9016;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #444;
`;

const ColumnContent = styled.div`
  padding: 1rem;
`;

const SourceTag = styled.div`
  background: rgba(206, 144, 22, 0.2);
  color: #ce9016;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-block;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  border: 1px solid rgba(206, 144, 22, 0.3);
`;

const SizeSpeedInfo = styled.div`
  color: #f0f0f0;
  font-size: 0.9rem;
  line-height: 1.6;
`;

const SizeSpeedItem = styled.div`
  margin-bottom: 0.5rem;

  strong {
    font-weight: 600;
    color: #ce9016;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const SpeciesDescription = styled.div`
  color: #f0f0f0;
  font-size: 0.9rem;
  line-height: 1.6;
  background: rgba(35, 35, 35, 0.5);
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #444;
  font-style: italic;

  p {
    margin: 0 0 0.5rem 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  em {
    color: #ce9016;
    font-size: 0.85rem;
  }
`;

const ModalBody = styled.div`
  overflow-y: auto;
  flex: 1;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(35, 35, 35, 0.5);
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ce9016;
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #b8860b;
  }
`;

const TraitsSection = styled.div`
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const TraitItem = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(35, 35, 35, 0.5);
  border: 1px solid #444;
  border-radius: 6px;
  border-left: 3px solid #ce9016;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TraitName = styled.h3`
  color: #ce9016;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.3px;
`;

const TraitDescription = styled.div`
  color: #f0f0f0;
  font-size: 0.9rem;
  line-height: 1.6;

  p {
    margin: 0 0 0.5rem 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: #ce9016;
    font-weight: 600;
  }

  /* Style tables within traits to match dark theme */
  table {
    border: 1px solid #555 !important;
    background: rgba(35, 35, 35, 0.8) !important;
    border-collapse: collapse !important;
  }

  th {
    background: rgba(26, 26, 26, 0.9) !important;
    color: #ce9016 !important;
    font-family: 'Cinzel', serif !important;
    border: 1px solid #555 !important;
    padding: 0.75rem !important;
  }

  td {
    color: #f0f0f0 !important;
    border: 1px solid #444 !important;
    padding: 0.75rem !important;
  }

  tr:nth-child(even) td {
    background: rgba(45, 45, 45, 0.5) !important;
  }

  .dnd-list strong {
    color: #ce9016 !important;
    font-family: 'Cinzel', serif !important;
  }

  .table-caption strong {
    color: #ce9016 !important;
    font-family: 'Cinzel', serif !important;
    display: block;
    margin-bottom: 0.5rem;
  }
`;

export default function SpeciesModal({ species, onClose }: SpeciesModalProps) {
  useBodyScrollLock(true);

  const formatSize = (size: string | string[] | null): string => {
    if (!size) return 'Unknown';
    if (Array.isArray(size)) {
      return size[0]
        ? size[0].charAt(0).toUpperCase() + size[0].slice(1).toLowerCase()
        : 'Unknown';
    }
    return size.charAt(0).toUpperCase() + size.slice(1).toLowerCase();
  };

  const parseTraits = (traits: any) => {
    if (!traits) return [];

    if (Array.isArray(traits)) {
      return traits.map((trait: any) => {
        if (typeof trait === 'string') {
          return { name: 'Trait', description: trait };
        }
        if (typeof trait === 'object' && trait.name) {
          // Handle the database structure with description array
          let description = '';
          if (Array.isArray(trait.description)) {
            description = parseComplexDescription(trait.description);
          } else if (trait.description) {
            description = trait.description;
          } else if (Array.isArray(trait.entries)) {
            description = parseComplexDescription(trait.entries);
          } else if (trait.entries) {
            description = trait.entries;
          }
          return {
            name: trait.name,
            description: parseComplexDnDEntry(description),
          };
        }
        return { name: 'Unknown', description: 'No description available' };
      });
    }

    if (typeof traits === 'object') {
      return Object.entries(traits).map(([key, value]: [string, any]) => ({
        name: key,
        description: parseComplexDnDEntry(value),
      }));
    }

    return [{ name: 'Trait', description: parseComplexDnDEntry(traits) }];
  };

  const parseComplexDescription = (description: any[]): string => {
    return description
      .map((item: any) => {
        if (typeof item === 'string') {
          return item;
        } else if (typeof item === 'object') {
          if (item.type === 'table') {
            return renderTable(item);
          } else if (item.type === 'list') {
            return renderList(item);
          } else {
            return JSON.stringify(item);
          }
        }
        return String(item);
      })
      .join(' ');
  };

  const renderTable = (table: any): string => {
    const { caption, colLabels, rows } = table;
    let html = '<div class="dnd-table">';

    if (caption) {
      html += `<div class="table-caption"><strong>${caption}</strong></div>`;
    }

    html +=
      '<table style="width: 100%; border-collapse: collapse; margin: 1rem 0; border: 1px solid #555; background: rgba(35, 35, 35, 0.8);">';

    if (colLabels && colLabels.length > 0) {
      html += '<thead><tr style="background: rgba(26, 26, 26, 0.9);">';
      colLabels.forEach((label: string) => {
        html += `<th style="padding: 0.75rem; border: 1px solid #555; font-weight: bold; color: #ce9016; font-family: Cinzel, serif;">${label}</th>`;
      });
      html += '</tr></thead>';
    }

    if (rows && rows.length > 0) {
      html += '<tbody>';
      rows.forEach((row: string[], index: number) => {
        const bgColor =
          index % 2 === 0
            ? 'rgba(35, 35, 35, 0.8)'
            : 'rgba(45, 45, 45, 0.5)';
        html += `<tr style="background: ${bgColor};">`;
        row.forEach((cell: string) => {
          html += `<td style="padding: 0.75rem; border: 1px solid #444; color: #f0f0f0;">${parseComplexDnDEntry(
            cell
          )}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody>';
    }

    html += '</table></div>';
    return html;
  };

  const renderList = (list: any): string => {
    const { items } = list;
    if (!items || !Array.isArray(items)) return '';

    let html = '<div class="dnd-list" style="margin: 1rem 0;">';
    items.forEach((item: any) => {
      if (item.name && item.entries) {
        html += `<div style="margin-bottom: 1rem;"><strong style="color: #ce9016; font-family: Cinzel, serif;">${item.name}:</strong> `;
        if (Array.isArray(item.entries)) {
          html += item.entries
            .map((entry: string) => parseComplexDnDEntry(entry))
            .join(' ');
        } else {
          html += parseComplexDnDEntry(item.entries);
        }
        html += '</div>';
      }
    });
    html += '</div>';

    return html;
  };

  const traits = parseTraits(species.traits);

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>

        <SpeciesHeader>
          <SpeciesTitle>{species.name}</SpeciesTitle>
        </SpeciesHeader>

        <ModalBody>
          <InfoSection>
            <InfoColumn>
              <ColumnHeader>Physical Traits</ColumnHeader>
              <ColumnContent>
                <SizeSpeedInfo>
                  <SizeSpeedItem>
                    <strong>Size:</strong> {formatSize(species.size)}
                  </SizeSpeedItem>
                  <SizeSpeedItem>
                    <strong>Speed:</strong> {species.speed} feet
                  </SizeSpeedItem>
                  <SizeSpeedItem>
                    <strong>Creature Type:</strong>{' '}
                    {species.creatureType || 'Humanoid'}
                  </SizeSpeedItem>
                </SizeSpeedInfo>
                {species.source && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <SourceTag>{species.source}</SourceTag>
                  </div>
                )}
              </ColumnContent>
            </InfoColumn>

            <InfoColumn>
              <ColumnHeader>Description</ColumnHeader>
              <ColumnContent>
                <SpeciesDescription>
                  {species.description ? (
                    <p>{species.description}</p>
                  ) : (
                    <p>
                      <em>No description available for this species.</em>
                    </p>
                  )}
                </SpeciesDescription>
              </ColumnContent>
            </InfoColumn>
          </InfoSection>

          <TraitsSection>
            {traits.map((trait, index) => (
              <TraitItem key={index}>
                <TraitName>{trait.name}</TraitName>
                <TraitDescription>
                  <div dangerouslySetInnerHTML={{ __html: trait.description }} />
                </TraitDescription>
              </TraitItem>
            ))}
          </TraitsSection>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}
