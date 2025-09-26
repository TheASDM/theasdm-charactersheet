import styled from 'styled-components';
import { Species } from '../types/api';
import { parseComplexDnDEntry } from '../utils/dndTemplateParser';

interface SpeciesCardProps {
  species: Species;
}

// Updated to match medieval theme (matching FeatCard)
const Card = styled.div`
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 2px solid #8b6914;
  border-radius: 10px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
  font-family: 'Crimson Text', serif;
  margin-bottom: 1.5rem;
  overflow: hidden;
  position: relative;
  color: #2c1810;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const SpeciesHeader = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.9),
    rgba(74, 42, 26, 0.9)
  );
  padding: 12px 16px;
  text-align: center;
  position: relative;
  z-index: 1;
  border-bottom: 2px solid #8b6914;

  @media (max-width: 480px) {
    padding: 10px 14px;
  }
`;

const SpeciesTitle = styled.h2`
  color: #d4af37;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
  text-transform: uppercase;
  font-family: 'Cinzel', serif;
`;

const InfoSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  position: relative;
  z-index: 1;
  border-bottom: 2px solid #8b6914;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoColumn = styled.div`
  border-right: 2px solid #8b6914;

  &:last-child {
    border-right: none;
  }

  @media (max-width: 768px) {
    border-right: none;
    border-bottom: 2px solid #8b6914;

    &:last-child {
      border-bottom: none;
    }
  }
`;

const ColumnHeader = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.6),
    rgba(74, 42, 26, 0.6)
  );
  padding: 0.75rem 1rem;
  font-weight: 700;
  font-size: 0.9rem;
  color: #d4af37;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #8b6914;
  font-family: 'Cinzel', serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const ColumnContent = styled.div`
  padding: 1rem;
`;

const SourceTag = styled.div`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  display: inline-block;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.3px;
  text-transform: uppercase;
`;

const SizeSpeedInfo = styled.div`
  color: #2c1810;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const SizeSpeedItem = styled.div`
  margin-bottom: 0.3rem;

  strong {
    font-weight: 700;
    color: #8b6914;
    font-family: 'Cinzel', serif;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const SpeciesDescription = styled.div`
  color: #2c1810;
  font-size: 0.9rem;
  line-height: 1.4;
  background: rgba(139, 105, 20, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  border: 2px solid rgba(139, 105, 20, 0.3);
  font-style: italic;
  text-align: justify;

  p {
    margin: 0 0 0.5rem 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  em {
    color: #8b6914;
    font-size: 0.8rem;
  }
`;

const TraitsSection = styled.div`
  padding: 16px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const TraitItem = styled.div`
  margin-bottom: 1rem;
  padding: 12px;
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid rgba(139, 105, 20, 0.3);
  border-radius: 8px;
  border-left: 3px solid #8b6914;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TraitName = styled.h3`
  color: #8b6914;
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  font-family: 'Cinzel', serif;
  letter-spacing: 0.3px;
`;

const TraitDescription = styled.div`
  color: #2c1810;
  font-size: 0.9rem;
  line-height: 1.4;
  text-align: justify;

  p {
    margin: 0 0 0.5rem 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: #8b6914;
    font-weight: 700;
  }

  /* Style tables within traits to match medieval theme */
  table {
    border: 2px solid #8b6914 !important;
    background: #f4e7d1 !important;
  }

  th {
    background: linear-gradient(
      145deg,
      rgba(90, 58, 42, 0.9),
      rgba(74, 42, 26, 0.9)
    ) !important;
    color: #d4af37 !important;
    font-family: 'Cinzel', serif !important;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5) !important;
    border: 1px solid #8b6914 !important;
  }

  td {
    color: #2c1810 !important;
    border: 1px solid #8b6914 !important;
  }

  tr:nth-child(even) td {
    background: rgba(139, 105, 20, 0.1) !important;
  }

  .dnd-list strong {
    color: #8b6914 !important;
    font-family: 'Cinzel', serif !important;
  }

  .table-caption strong {
    color: #8b6914 !important;
    font-family: 'Cinzel', serif !important;
  }
`;

export default function SpeciesCard({ species }: SpeciesCardProps) {
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
      '<table style="width: 100%; border-collapse: collapse; margin: 1rem 0; border: 2px solid #8b6914;">';

    if (colLabels && colLabels.length > 0) {
      html +=
        '<thead><tr style="background: linear-gradient(145deg, rgba(90, 58, 42, 0.9), rgba(74, 42, 26, 0.9));">';
      colLabels.forEach((label: string) => {
        html += `<th style="padding: 0.75rem; border: 1px solid #8b6914; font-weight: bold; color: #d4af37; font-family: Cinzel, serif; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);">${label}</th>`;
      });
      html += '</tr></thead>';
    }

    if (rows && rows.length > 0) {
      html += '<tbody>';
      rows.forEach((row: string[], index: number) => {
        const bgColor =
          index % 2 === 0
            ? 'rgba(244, 231, 209, 0.8)'
            : 'rgba(139, 105, 20, 0.1)';
        html += `<tr style="background: ${bgColor};">`;
        row.forEach((cell: string) => {
          html += `<td style="padding: 0.75rem; border: 1px solid #8b6914; color: #2c1810;">${parseComplexDnDEntry(
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
        html += `<div style="margin-bottom: 1rem;"><strong style="color: #8b6914; font-family: Cinzel, serif;">${item.name}:</strong> `;
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

  return (
    <Card>
      <SpeciesHeader>
        <SpeciesTitle>{species.name}</SpeciesTitle>
      </SpeciesHeader>

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
              <div style={{ marginTop: '0.5rem' }}>
                <SourceTag>{species.source}</SourceTag>
              </div>
            )}
          </ColumnContent>
        </InfoColumn>

        <InfoColumn>
          <ColumnHeader>Description</ColumnHeader>
          <ColumnContent>
            <SpeciesDescription>
              {/* TODO: Replace with actual speciesDescription from JSON data */}
              {(species as any).speciesDescription ? (
                <p>{(species as any).speciesDescription}</p>
              ) : (
                <p>
                  <em>
                    Species description will be loaded from the
                    speciesDescription field in the JSON data.
                  </em>
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
    </Card>
  );
}
