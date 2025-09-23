import React, { useState } from 'react';
import { SpellList, SpellModal } from '../components';
import { Spell } from '../types/api';
import { SPELL_LEVELS } from '../services';

const SpellsPage: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(
    undefined
  );
  const [selectedSchool, setSelectedSchool] = useState<string | undefined>(
    undefined
  );
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSpellClick = (spell: Spell) => {
    console.log('Spell clicked:', spell);
    setSelectedSpell(spell);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSpell(null);
  };

  const handleLevelFilter = (level: number | undefined) => {
    setSelectedLevel(level);
  };

  const handleSchoolFilter = (school: string | undefined) => {
    setSelectedSchool(school);
  };

  const schoolOptions = [
    { value: 'A', label: 'Abjuration' },
    { value: 'C', label: 'Conjuration' },
    { value: 'D', label: 'Divination' },
    { value: 'E', label: 'Enchantment' },
    { value: 'V', label: 'Evocation' },
    { value: 'I', label: 'Illusion' },
    { value: 'N', label: 'Necromancy' },
    { value: 'T', label: 'Transmutation' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        paddingTop: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '0 20px',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            color: '#8B5A2B',
            fontFamily: '"Cinzel", serif',
            marginBottom: '10px',
          }}
        >
          📜 D&D Spells
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            color: '#666',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          Browse the complete D&D 2024 spell collection
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto 20px',
          padding: '0 20px',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: '0', color: '#333', minWidth: 'fit-content' }}>
            Filters:
          </h3>

          {/* Level Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}
            >
              Level:
            </label>
            <select
              value={selectedLevel !== undefined ? selectedLevel : ''}
              onChange={(e) =>
                handleLevelFilter(
                  e.target.value === '' ? undefined : parseInt(e.target.value)
                )
              }
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="">All Levels</option>
              {SPELL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level === 0 ? 'Cantrip' : `Level ${level}`}
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}
            >
              School:
            </label>
            <select
              value={selectedSchool || ''}
              onChange={(e) =>
                handleSchoolFilter(
                  e.target.value === '' ? undefined : e.target.value
                )
              }
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="">All Schools</option>
              {schoolOptions.map((school) => (
                <option key={school.value} value={school.value}>
                  {school.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(selectedLevel !== undefined || selectedSchool) && (
            <button
              onClick={() => {
                setSelectedLevel(undefined);
                setSelectedSchool(undefined);
              }}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Spell List */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <SpellList
          filters={{
            ...(selectedLevel !== undefined && { level: selectedLevel }),
            ...(selectedSchool && { school: selectedSchool }),
          }}
          onSpellClick={handleSpellClick}
          showSearch={true}
        />
      </div>

      {/* Spell Details Modal */}
      <SpellModal
        spell={selectedSpell}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default SpellsPage;
