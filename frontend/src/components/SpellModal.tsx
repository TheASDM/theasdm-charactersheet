import React from 'react';
import styled from 'styled-components';
import { Spell } from '../types/api';
import { parseDnDTemplateTag } from '../utils/dndTemplateParser';

interface SpellModalProps {
  spell: Spell | null;
  isOpen: boolean;
  onClose: () => void;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const SpellTitle = styled.h2`
  margin: 0 0 16px 0;
  color: #333;
  font-size: 24px;
`;

const SpellMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const MetaItem = styled.div`
  h4 {
    margin: 0 0 4px 0;
    color: #666;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin: 0;
    color: #333;
    font-weight: 500;
  }
`;

const SpellDescription = styled.div`
  margin-bottom: 20px;

  h3 {
    color: #333;
    font-size: 18px;
    margin: 0 0 12px 0;
  }

  p {
    margin: 8px 0;
    line-height: 1.6;
    color: #444;
  }
`;

const HigherLevelSection = styled.div`
  margin-top: 16px;
  padding: 16px;
  background-color: #e8f4fd;
  border-radius: 8px;
  border-left: 4px solid #2196f3;

  h4 {
    color: #1976d2;
    margin: 0 0 8px 0;
  }

  p {
    margin: 4px 0;
    color: #333;
  }
`;

const TagsSection = styled.div`
  margin-top: 16px;

  h4 {
    color: #333;
    margin: 0 0 8px 0;
    font-size: 14px;
  }
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
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

  const parseSpellText = (text: string): string => {
    return parseDnDTemplateTag(text);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
          {spell.entries?.map((entry: any, index: number) => (
            <p key={index}>{parseSpellText(entry)}</p>
          ))}

          {spell.entriesHigherLevel && spell.entriesHigherLevel.length > 0 && (
            <HigherLevelSection>
              <h4>At Higher Levels</h4>
              {spell.entriesHigherLevel.map((entry: any, index: number) => (
                <div key={index}>
                  {entry.entries?.map((subEntry: string, subIndex: number) => (
                    <p key={subIndex}>{parseSpellText(subEntry)}</p>
                  ))}
                </div>
              ))}
            </HigherLevelSection>
          )}
        </SpellDescription>

        {/* Tags and Additional Info */}
        {(spell.damageInflict?.length ||
          spell.conditionInflict?.length ||
          spell.savingThrow?.length) && (
          <TagsSection>
            {spell.damageInflict && spell.damageInflict.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4>Damage Types</h4>
                <Tags>
                  {spell.damageInflict.map((damage, index) => (
                    <Tag
                      key={index}
                      style={{ backgroundColor: '#ffebee', color: '#c62828' }}
                    >
                      {damage.charAt(0).toUpperCase() + damage.slice(1)}
                    </Tag>
                  ))}
                </Tags>
              </div>
            )}

            {spell.conditionInflict && spell.conditionInflict.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4>Conditions</h4>
                <Tags>
                  {spell.conditionInflict.map((condition, index) => (
                    <Tag
                      key={index}
                      style={{ backgroundColor: '#fff3e0', color: '#ef6c00' }}
                    >
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </Tag>
                  ))}
                </Tags>
              </div>
            )}

            {spell.savingThrow && spell.savingThrow.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4>Saving Throws</h4>
                <Tags>
                  {spell.savingThrow.map((save, index) => (
                    <Tag
                      key={index}
                      style={{ backgroundColor: '#e8f5e8', color: '#2e7d32' }}
                    >
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
