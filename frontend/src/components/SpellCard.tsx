import React from 'react';
import { Spell } from '../types/api';

interface SpellCardProps {
  spell: Spell;
  onClick?: (() => void) | undefined;
  compact?: boolean;
}

const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  onClick,
  compact = false,
}) => {
  // Helper function to get school name from abbreviation
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

  // Helper function to format spell components
  const formatComponents = (components: any): string => {
    if (!components) return '';

    const parts: string[] = [];
    if (components.v) parts.push('V');
    if (components.s) parts.push('S');
    if (components.m)
      parts.push(
        typeof components.m === 'string' ? `M (${components.m})` : 'M'
      );

    return parts.join(', ');
  };

  // Helper function to format casting time
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

  // Helper function to format range
  const formatRange = (range: any): string => {
    if (!range) return 'Unknown';

    if (range.type === 'point' && range.distance) {
      return `${range.distance.amount} ${range.distance.type}`;
    } else if (range.type === 'self') {
      return 'Self';
    }
    return range.type || 'Unknown';
  };

  // Helper function to format duration
  const formatDuration = (duration: any[]): string => {
    if (!Array.isArray(duration) || duration.length === 0) return 'Unknown';

    const firstDuration = duration[0];
    if (firstDuration.type === 'instant') {
      return 'Instantaneous';
    } else if (firstDuration.type === 'timed' && firstDuration.duration) {
      const dur = firstDuration.duration;
      const durationText = `${dur.amount} ${dur.type}${
        dur.amount > 1 ? 's' : ''
      }`;
      return firstDuration.concentration
        ? `Concentration, up to ${durationText}`
        : durationText;
    }
    return firstDuration.type || 'Unknown';
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  const schoolName = getSchoolName(spell.school);
  const levelText = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;

  return (
    <div
      className={`spell-card ${onClick ? 'clickable' : ''} ${
        compact ? 'compact' : ''
      }`}
      onClick={handleClick}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: compact ? '12px' : '16px',
        margin: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease',
        minHeight: compact ? 'auto' : '120px',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 4px 8px rgba(0,0,0,0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 2px 4px rgba(0,0,0,0.1)';
        }
      }}
    >
      {/* Spell Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <h3
          style={{
            margin: '0',
            color: '#333',
            fontSize: compact ? '16px' : '18px',
            fontWeight: 'bold',
          }}
        >
          {spell.name}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span
            style={{
              backgroundColor: spell.level === 0 ? '#4CAF50' : '#2196F3',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {levelText}
          </span>
          {!compact && (
            <span
              style={{
                backgroundColor: '#ff9800',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {schoolName}
            </span>
          )}
        </div>
      </div>

      {/* Spell Details */}
      {!compact && (
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Casting Time:</strong> {formatCastingTime(spell.time || [])}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Range:</strong> {formatRange(spell.range)}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Components:</strong> {formatComponents(spell.components)}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Duration:</strong> {formatDuration(spell.duration || [])}
          </div>
        </div>
      )}

      {/* Compact Details */}
      {compact && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
          {schoolName} • {formatCastingTime(spell.time || [])} •{' '}
          {formatRange(spell.range)}
        </div>
      )}

      {/* Source Information */}
      {spell.source && (
        <div style={{ fontSize: '11px', color: '#999' }}>
          Source: {spell.source}
          {spell.page ? `, p. ${spell.page}` : ''}
        </div>
      )}
    </div>
  );
};

export default SpellCard;
