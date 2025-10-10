/**
 * PreparedSpellsStep - Wizard Step 2: Select prepared spells from spellbook
 * Now uses SpellWizardContext for state management
 */

import { useState, useMemo, useCallback } from 'react';
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
  color: #e0a523;
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
  background: rgba(106, 168, 79, 0.1);
  border: 1px solid rgba(106, 168, 79, 0.4);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  color: #e0d9c6;
  font-size: 0.95rem;
  line-height: 1.5;

  strong {
    color: #6aa84f;
  }

  ul {
    margin: 0.5rem 0 0 1.5rem;
    padding: 0;
  }

  li {
    margin: 0.25rem 0;
  }
`;


const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${({ $variant }) => ($variant === 'secondary' ? 'transparent' : '#8b5a2b')};
  border: 1px solid #c0aa70;
  color: #e0a523;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${({ $variant }) => ($variant === 'secondary' ? 'rgba(192, 170, 112, 0.1)' : '#6d4623')};
    border-color: #e0a523;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RitualCount = styled.div`
  background: rgba(206, 144, 22, 0.15);
  border: 1px solid rgba(206, 144, 22, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  margin: 1rem 0;
  color: #e0d9c6;
  font-size: 0.9rem;
  text-align: center;

  strong {
    color: #e0a523;
  }
`;

interface PreparedSpellsStepProps {
  allSpells: Spell[];
}

export const PreparedSpellsStep: React.FC<PreparedSpellsStepProps> = ({ allSpells }) => {
  // Get state and actions from context
  const {
    spellbook: spellbookIds,
    prepared,
    setPrepared,
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
    preparedMax: maxPrepared,
    goToPreviousStep,
  } = useSpellWizard();

  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  // Get spells from spellbook
  const spellbookSpells = useMemo(() => {
    return allSpells.filter((spell) => {
      const spellId = normaliseSpellId(spell.id);
      return spellbookIds.includes(spellId) && spell.level > 0; // Exclude cantrips
    });
  }, [allSpells, spellbookIds]);

  // Count ritual spells in spellbook
  const ritualCount = useMemo(() => {
    return spellbookSpells.filter((spell) => spell.isRitual).length;
  }, [spellbookSpells]);

  // Filter spellbook spells
  const filteredSpells = useSpellFiltering(spellbookSpells, {
    searchTerm,
    level: levelFilter,
    school: schoolFilter,
    ritual: ritualFilter,
    concentration: concentrationFilter,
  });

  const handleToggle = useCallback((spell: Spell) => {
    const spellId = normaliseSpellId(spell.id);
    setPrepared((prev: string[]) => {
      if (prev.includes(spellId)) {
        return prev.filter((id: string) => id !== spellId);
      }
      if (prev.length >= maxPrepared) {
        return prev; // Max prepared reached
      }
      return [...prev, spellId];
    });
  }, [setPrepared, maxPrepared]);

  const isValid = prepared.length === maxPrepared;

  const handleComplete = useCallback(() => {
    if (isValid) {
      // Spell selection is complete - data is automatically synced to parent via onSpellsChange
      // The parent wizard's useEffect will save to CharacterBuilderData
      // TODO: In future, could add a completion callback or advance to next wizard step
      alert('Spell selection complete! Your spells have been saved.');
    }
  }, [isValid]);

  return (
    <StepContainer>
      <Header>
        <Title>Prepare Spells - Step 2 of 2</Title>
        <Subtitle>Select {maxPrepared} spell{maxPrepared !== 1 ? 's' : ''} to prepare from your spellbook</Subtitle>
        <CounterPill $invalid={!isValid}>
          Prepared: {prepared.length} / {maxPrepared}
        </CounterPill>
      </Header>

      <InfoPanel>
        <strong>Prepared Spells:</strong>
        <ul>
          <li>Choose {maxPrepared} spell{maxPrepared !== 1 ? 's' : ''} from your spellbook to prepare</li>
          <li>You can change your prepared spells after a long rest</li>
          <li>Prepared spells are the ones you can cast using spell slots</li>
        </ul>
      </InfoPanel>

      {ritualCount > 0 && (
        <RitualCount>
          📖 You have <strong>{ritualCount} ritual spell{ritualCount !== 1 ? 's' : ''}</strong> in your spellbook
          that can be cast without preparing them.
        </RitualCount>
      )}

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

      <h3>Spellbook ({filteredSpells.length})</h3>
      <SpellGrid
        spells={filteredSpells}
        selectedSpells={prepared}
        maxSelections={maxPrepared}
        onToggle={handleToggle}
        onViewDetails={setSelectedSpell}
        showRitualBadge
        emptyMessage="No spells in your spellbook match the current filters."
      />

      <ButtonGroup>
        <Button $variant="secondary" onClick={goToPreviousStep}>
          Back to Spellbook
        </Button>
        <Button disabled={!isValid} onClick={handleComplete}>
          Complete Spell Selection
        </Button>
      </ButtonGroup>

      <SpellDetailModal spell={selectedSpell} onClose={() => setSelectedSpell(null)} />
    </StepContainer>
  );
};
