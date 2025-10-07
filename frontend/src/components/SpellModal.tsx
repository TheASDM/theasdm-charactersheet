import React from 'react';
import styled from 'styled-components';
import { Spell } from '../types/api';
import { parseComplexDnDEntry } from '../utils/dndTemplateParser';

interface SpellModalProps {
  spell: Spell | null;
  isOpen: boolean;
  onClose: () => void;
}

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  z-index: 1000;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #d4af37;
  border-radius: 12px;
  padding: 2rem;
  max-width: 720px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  color: #f4e7d1;
  margin: 2rem auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #d4af37;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(212, 175, 55, 0.2);
    transform: scale(1.1);
  }
`;

const SpellTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: #d4af37;
  font-size: 1.5rem;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.5px;
`;

const SpellMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  background-color: rgba(35, 35, 35, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(212, 175, 55, 0.3);
`;

const MetaItem = styled.div`
  h4 {
    margin: 0 0 0.35rem 0;
    color: #d4af37;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin: 0;
    color: #f4e7d1;
    font-weight: 500;
    font-size: 0.9rem;
  }
`;

const SpellDescription = styled.div`
  margin-bottom: 1.25rem;

  h3 {
    color: #d4af37;
    font-size: 1.1rem;
    margin: 0 0 0.75rem 0;
    font-family: 'Cinzel', serif;
    letter-spacing: 0.5px;
  }

  p {
    margin: 0.75rem 0;
    line-height: 1.6;
    color: #c4b49d;
    font-family: 'Crimson Text', serif;
    font-size: 0.95rem;
  }
`;

const HigherLevelSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgba(54, 126, 89, 0.15);
  border-radius: 8px;
  border-left: 4px solid #5ce0a3;

  h4 {
    color: #5ce0a3;
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin: 0.5rem 0;
    color: #d7fff0;
    line-height: 1.5;
    font-family: 'Crimson Text', serif;
  }
`;

const TagsSection = styled.div`
  margin-top: 1rem;

  h4 {
    color: #d4af37;
    margin: 0 0 0.5rem 0;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.span`
  background-color: rgba(212, 175, 55, 0.2);
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.4);
  padding: 0.35rem 0.65rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const SpellModal: React.FC<SpellModalProps> = ({ spell, isOpen, onClose }) => {
  if (!isOpen || !spell) return null;

  // Helper functions
  const getSchoolName = (abbreviation: string | undefined): string => {
    const schoolMap: { [key: string]: string } = {
      A: 'Abjuration',
      C: 'Conjuration',
      D: 'Divination',
      E: 'Enchantment',
      V: 'Evocation',
      I: 'Illusion',
      N: 'Necromancy',
      T: 'Transmutation',
    };
    return abbreviation ? schoolMap[abbreviation] || abbreviation : 'Unknown';
  };

  const formatComponents = (components: any): string => {
    if (!components) return 'None';

    const parts: string[] = [];
    if (components.v) parts.push('V (Verbal)');
    if (components.s) parts.push('S (Somatic)');
    if (components.m) {
      if (typeof components.m === 'string') {
        parts.push(`M (${components.m})`);
      } else {
        parts.push('M (Material)');
      }
    }

    return parts.length > 0 ? parts.join(', ') : 'None';
  };

  const formatCastingTime = (time: any[]): string => {
    if (!Array.isArray(time) || time.length === 0) return 'Unknown';

    const firstTime = time[0];
    if (firstTime.number && firstTime.unit) {
      return `${firstTime.number} ${firstTime.unit}${
        firstTime.number > 1 ? 's' : ''
      }`;
    }
    return 'Unknown';
  };

  const formatRange = (range: any): string => {
    if (!range) return 'Unknown';

    if (range.type === 'point' && range.distance) {
      return `${range.distance.amount} ${range.distance.type}`;
    }
    if (range.type === 'self') {
      return range.distance
        ? `Self (${range.distance.amount}-${range.distance.type} ${
            range.distance.type === 'feet'
              ? range.distance.shape || 'radius'
              : ''
          })`
        : 'Self';
    }
    if (range.type === 'touch') return 'Touch';
    if (range.type === 'sight') return 'Sight';

    return range.type || 'Unknown';
  };

  const formatDuration = (duration: any[]): string => {
    if (!Array.isArray(duration) || duration.length === 0) return 'Unknown';

    const firstDuration = duration[0];
    if (firstDuration.type === 'instant') return 'Instantaneous';
    if (firstDuration.type === 'permanent') return 'Permanent';
    if (firstDuration.type === 'timed') {
      const concentration = firstDuration.concentration
        ? 'Concentration, up to '
        : '';
      return `${concentration}${firstDuration.duration?.amount || ''} ${
        firstDuration.duration?.type || ''
      }`;
    }

    return firstDuration.type || 'Unknown';
  };

  const formatSpellLevel = (level: number): string => {
    if (level === 0) return 'Cantrip';
    const suffixes = [
      '',
      '1st',
      '2nd',
      '3rd',
      '4th',
      '5th',
      '6th',
      '7th',
      '8th',
      '9th',
    ];
    return `${suffixes[level] || `${level}th`} Level`;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Parse entries properly
  const parsedEntries = spell.entries ? parseComplexDnDEntry(spell.entries) : '';
  const parsedHigherLevel = spell.entriesHigherLevel
    ? parseComplexDnDEntry(spell.entriesHigherLevel)
    : '';

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>

        <SpellTitle>{spell.name}</SpellTitle>

        <SpellMeta>
          <MetaItem>
            <h4>Level</h4>
            <p>{formatSpellLevel(spell.level)}</p>
          </MetaItem>

          <MetaItem>
            <h4>School</h4>
            <p>{getSchoolName(spell.school)}</p>
          </MetaItem>

          <MetaItem>
            <h4>Casting Time</h4>
            <p>{formatCastingTime(spell.time || [])}</p>
          </MetaItem>

          <MetaItem>
            <h4>Range</h4>
            <p>{formatRange(spell.range)}</p>
          </MetaItem>

          <MetaItem>
            <h4>Components</h4>
            <p>{formatComponents(spell.components)}</p>
          </MetaItem>

          <MetaItem>
            <h4>Duration</h4>
            <p>{formatDuration(spell.duration || [])}</p>
          </MetaItem>

          {spell.source && (
            <MetaItem>
              <h4>Source</h4>
              <p>
                {spell.source}
                {spell.page ? `, pg. ${spell.page}` : ''}
              </p>
            </MetaItem>
          )}

          {spell.isRitual !== null && spell.isRitual && (
            <MetaItem>
              <h4>Ritual</h4>
              <p>Yes</p>
            </MetaItem>
          )}
        </SpellMeta>

        <SpellDescription>
          <h3>Description</h3>
          <div dangerouslySetInnerHTML={{ __html: parsedEntries }} />

          {parsedHigherLevel && (
            <HigherLevelSection>
              <h4>At Higher Levels</h4>
              <div dangerouslySetInnerHTML={{ __html: parsedHigherLevel }} />
            </HigherLevelSection>
          )}
        </SpellDescription>

        {/* Tags and Additional Info */}
        {(spell.damageInflict?.length ||
          spell.conditionInflict?.length ||
          spell.savingThrow?.length) && (
          <TagsSection>
            {spell.damageInflict && spell.damageInflict.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <h4>Damage Types</h4>
                <Tags>
                  {spell.damageInflict.map((damage, index) => (
                    <Tag key={index}>
                      {damage.charAt(0).toUpperCase() + damage.slice(1)}
                    </Tag>
                  ))}
                </Tags>
              </div>
            )}

            {spell.conditionInflict && spell.conditionInflict.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <h4>Conditions</h4>
                <Tags>
                  {spell.conditionInflict.map((condition, index) => (
                    <Tag key={index}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </Tag>
                  ))}
                </Tags>
              </div>
            )}

            {spell.savingThrow && spell.savingThrow.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <h4>Saving Throws</h4>
                <Tags>
                  {spell.savingThrow.map((save, index) => (
                    <Tag key={index}>
                      {save.charAt(0).toUpperCase() + save.slice(1)}
                    </Tag>
                  ))}
                </Tags>
              </div>
            )}
          </TagsSection>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default SpellModal;
