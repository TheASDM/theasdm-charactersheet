/**
 * SpellbookStep - Wizard Step 1: Select 6 spells for spellbook
 * Now uses SpellWizardContext for state management
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import type { Spell } from '@/types/api';
import { SpellFiltersBar } from './SpellFiltersBar';
import { SpellGrid } from './SpellGrid';
import { SpellDetailModal } from './SpellDetailModal';
import { normaliseSpellId } from '@/utils/spellUtils';
import { useSpellFiltering } from '@/hooks/useSpellFiltering';
import { useSpellWizard } from '@/contexts/SpellWizardContext';

const StepContainer = styled.div`
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  color: #f1c661;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #c0aa70;
  font-size: 1rem;
  margin-bottom: 1rem;
`;

const CounterPill = styled.div<{ $invalid?: boolean }>`
  display: inline-block;
  background: ${({ $invalid }) => ($invalid ? 'rgba(220, 53, 69, 0.2)' : 'rgba(106, 168, 79, 0.2)')};
  border: 1px solid ${({ $invalid }) => ($invalid ? 'rgba(220, 53, 69, 0.5)' : 'rgba(106, 168, 79, 0.5)')};
  border-radius: 20px;
  padding: 0.5rem 1rem;
  color: ${({ $invalid }) => ($invalid ? '#ff6b6b' : '#6aa84f')};
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 1rem;
`;

const InfoPanel = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  color: #e0d9c6;
  font-size: 0.95rem;
  line-height: 1.5;

  strong {
    color: #f1c661;
  }

  ul {
    margin: 0.5rem 0 0 1.5rem;
    padding: 0;
  }

  li {
    margin: 0.25rem 0;
  }
`;

interface SpellbookStepProps {
  spells: Spell[];
}

export const SpellbookStep: React.FC<SpellbookStepProps> = ({ spells }) => {
  // Get state and actions from context
  const {
    spellbook,
    setSpellbook,
    searchTerm,
    setSearchTerm,
    levelFilter,
    setLevelFilter,
    schoolFilter,
    setSchoolFilter,
    ritualFilter,
    setRitualFilter,
    concentrationFilter,
    setConcentrationFilter,
    spellbookMax = 6,
  } = useSpellWizard();

  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  // Filter spells (only level 1 Wizard spells)
  const filteredSpells = useSpellFiltering(spells, {
    classId: 'Wizard',
    minLevel: 1,
    maxLevel: 1,
    excludeCantrips: true,
    searchTerm,
    level: levelFilter,
    school: schoolFilter,
    ritual: ritualFilter,
    concentration: concentrationFilter,
  });

  const handleToggle = useCallback((spell: Spell) => {
    const spellId = normaliseSpellId(spell.id);
    setSpellbook((prev: string[]) => {
      if (prev.includes(spellId)) {
        return prev.filter((id: string) => id !== spellId);
      }
      if (prev.length >= spellbookMax) {
        return prev; // Max reached
      }
      return [...prev, spellId];
    });
  }, [setSpellbook, spellbookMax]);

  const isValid = spellbook.length === spellbookMax;

  return (
    <StepContainer>
      <Header>
        <Title>Wizard Spellbook - Step 1 of 2</Title>
        <Subtitle>Choose 6 level 1 spells for your starting spellbook</Subtitle>
        <CounterPill $invalid={!isValid}>
          Spellbook: {spellbook.length} / {spellbookMax}
        </CounterPill>
      </Header>

      <InfoPanel>
        <strong>Your Spellbook:</strong>
        <ul>
          <li>Select any 6 level 1 Wizard spells to add to your spellbook</li>
          <li>In the next step, you'll prepare spells from this book</li>
          <li>You can cast ritual spells from your spellbook without preparing them</li>
          <li>You can learn more spells by copying them from scrolls or other spellbooks</li>
        </ul>
      </InfoPanel>

      <SpellFiltersBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        level={levelFilter}
        onLevelChange={setLevelFilter}
        school={schoolFilter}
        onSchoolChange={setSchoolFilter}
        ritual={ritualFilter}
        onRitualChange={setRitualFilter}
        concentration={concentrationFilter}
        onConcentrationChange={setConcentrationFilter}
      />

      <h3>Available Spells ({filteredSpells.length})</h3>
      <SpellGrid
        spells={filteredSpells}
        selectedSpells={spellbook}
        maxSelections={spellbookMax}
        onToggle={handleToggle}
        onViewDetails={setSelectedSpell}
        showRitualBadge
        emptyMessage="No level 1 Wizard spells found with current filters."
      />

      <SpellDetailModal spell={selectedSpell} onClose={() => setSelectedSpell(null)} />
    </StepContainer>
  );
};
