/**
 * SpellSelectionWizard - D&D 2024 Edition (Refactored)
 *
 * Implements the D&D 2024 prepared spell system with:
 * - Flexible Prepared Casters (Cleric, Druid, Paladin, Ranger, Wizard)
 * - Semi-Prepared Casters (Bard, Sorcerer, Warlock)
 * - Wizard spellbook mechanics
 * - Warlock Pact Magic
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import type { Spell } from '@/types/api';
import type { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { StepContainer } from '@/styles/components/CharacterGeneratorWizard.styles';
import { useApiCall } from '@/hooks/useApiCall';
import { listSpells, SpellFilters } from '@/services/spellService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { SpellFiltersBar } from '@/components/spells/SpellFiltersBar';
import { SpellCounterBar } from '@/components/spells/SpellCounterBar';
import { SpellCard } from '@/components/spells/SpellCard';
import { SpellDetailModal } from '@/components/spells/SpellDetailModal';
import { SpellbookStep } from '@/components/spells/SpellbookStep';
import { PreparedSpellsStep } from '@/components/spells/PreparedSpellsStep';
import { SpellWizardProvider } from '@/contexts/SpellWizardContext';
import { LevelFilter, RitualFilter, ConcentrationFilter } from '@/utils/spellConstants';
import { normaliseSpellId } from '@/utils/spellUtils';
import { getCantripCount, getPreparedCount, getNewCasterType, usesSpellbook, hasPactMagic, getSpellcastingAbility } from '@/helpers/spellRules';
import { CLASS_CONFIG } from '@/helpers/spellcastingConfig';
import { deriveGrantedSpells } from '@/helpers/deriveGrantedSpells';
import { abilityMod } from '@/helpers/spellRules';

interface SpellSelectionWizardProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
  onValidityChange: (isValid: boolean) => void;
}

const InfoPanel = styled.div<{ $variant?: 'info' | 'warning' | 'special' }>`
  background: ${({ $variant }) => {
    if ($variant === 'warning') return 'rgba(255, 193, 7, 0.1)';
    if ($variant === 'special') return 'rgba(106, 168, 79, 0.1)';
    return 'rgba(212, 175, 55, 0.1)';
  }};
  border: 1px solid ${({ $variant }) => {
    if ($variant === 'warning') return 'rgba(255, 193, 7, 0.4)';
    if ($variant === 'special') return 'rgba(106, 168, 79, 0.4)';
    return 'rgba(212, 175, 55, 0.4)';
  }};
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  color: #e0d9c6;
  font-size: 0.95rem;
  line-height: 1.5;

  strong {
    color: #f1c661;
  }
`;

const SpellGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #c0aa70;
  font-size: 1rem;
`;

export const SpellSelectionWizard: React.FC<SpellSelectionWizardProps> = ({
  data,
  onUpdate,
  onValidityChange,
}) => {
  const classId = data.selectedClass ?? '';
  const level = 1; // For now, always level 1

  // Get class configuration
  const classConfig = useMemo(() => CLASS_CONFIG[classId], [classId]);
  const casterType = useMemo(() => getNewCasterType(classId), [classId]);

  // ===== EARLY EXIT: Non-casters and third-casters at level 1 =====
  if (!classConfig || casterType === 'none') {
    if (['Fighter', 'Rogue'].includes(classId)) {
      return (
        <StepContainer>
          <h2>Spell Selection</h2>
          <InfoPanel>
            <strong>{classId}</strong> gains spellcasting at <strong>level 3</strong>.
            {classId === 'Rogue' && ' (Arcane Trickster must select Mage Hand as one cantrip)'}
          </InfoPanel>
        </StepContainer>
      );
    }

    // Barbarian, Monk, etc
    onValidityChange(true);
    return null;
  }

  // Calculate cantrip limit (needed for initial step determination)
  const cantripMax = useMemo(() => getCantripCount(classId, level), [classId, level]);

  // ===== MULTI-STEP STATE =====
  // For Wizard: cantrips → spellbook → prepared
  // For other casters with cantrips: cantrips → prepared
  // For Paladin/Ranger: prepared only (no cantrips)
  const [spellStep, setSpellStep] = useState<'cantrips' | 'spellbook' | 'prepared'>(() => {
    if (cantripMax > 0) return 'cantrips';
    if (usesSpellbook(classId)) return 'spellbook';
    return 'prepared';
  });

  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [ritualFilter, setRitualFilter] = useState<RitualFilter>('any');
  const [concentrationFilter, setConcentrationFilter] = useState<ConcentrationFilter>('any');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  // Spell selections
  const [cantrips, setCantrips] = useState<string[]>([]);
  const [preparedSpells, setPreparedSpells] = useState<string[]>(data.spellbook?.prepared ?? []);
  // Wizard spellbook should start empty (cantrips are separate)
  const [wizardSpellbook, setWizardSpellbook] = useState<string[]>([]);

  // Get ability modifier
  const spellcastingAbility = useMemo(() => getSpellcastingAbility(classId), [classId]);
  const abilityScore = useMemo(() => {
    if (!spellcastingAbility) return 10;
    const abilityKey = spellcastingAbility as keyof typeof data.abilityScores;
    return data.abilityScores?.[abilityKey] ?? 10;
  }, [data.abilityScores, spellcastingAbility]);
  const modifier = useMemo(() => abilityMod(abilityScore), [abilityScore]);
  const preparedMax = useMemo(() => getPreparedCount(classId, level, modifier), [classId, level, modifier]);

  // Granted spells (from species, feats, etc)
  const grantedSpells = useMemo(() => {
    const options: Parameters<typeof deriveGrantedSpells>[1] = {};
    // TODO: Add granted spell sources from data
    return deriveGrantedSpells(null, options).map(normaliseSpellId);
  }, []);

  // ===== API CALLS =====
  const buildSpellRequest = useCallback(
    (signal?: AbortSignal) => {
      const filters: SpellFilters = {
        page: 1,
        limit: 500,
      };

      if (searchTerm.trim()) filters.q = searchTerm.trim();
      if (levelFilter !== 'all') filters.level = levelFilter;
      if (schoolFilter !== 'all') filters.school = schoolFilter;
      if (classId) filters.className = classId;
      if (ritualFilter !== 'any') filters.ritual = ritualFilter === 'ritual';
      if (concentrationFilter !== 'any') filters.concentration = concentrationFilter === 'conc';

      return listSpells(filters, signal);
    },
    [searchTerm, levelFilter, schoolFilter, ritualFilter, concentrationFilter, classId]
  );

  const {
    data: spellsResponse,
    isLoading: isLoadingSpells,
    execute: loadSpells,
  } = useApiCall(buildSpellRequest, { showErrorToast: false });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSpells();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadSpells]);

  const spells = useMemo(() => {
    if (!spellsResponse) return [];
    if (Array.isArray(spellsResponse.items)) return spellsResponse.items;
    if (Array.isArray(spellsResponse.spells)) return spellsResponse.spells;
    return [];
  }, [spellsResponse]);

  // ===== HANDLERS =====
  const handleToggleCantrip = useCallback((spell: Spell) => {
    const spellId = normaliseSpellId(spell.id);
    setCantrips((prev) => {
      if (prev.includes(spellId)) {
        return prev.filter((id) => id !== spellId);
      }
      return [...prev, spellId];
    });
  }, []);

  const handleTogglePrepared = useCallback((spell: Spell) => {
    const spellId = normaliseSpellId(spell.id);
    setPreparedSpells((prev) => {
      if (prev.includes(spellId)) {
        return prev.filter((id) => id !== spellId);
      }
      return [...prev, spellId];
    });
  }, []);

  // ===== VALIDATION =====
  useEffect(() => {
    // Only validation: can't go over the maximum
    // Users can select 0 to max for everything - no minimum requirements
    let valid = true;

    // Check cantrips don't exceed max
    if (cantrips.length > cantripMax) {
      valid = false;
    }

    // Check prepared spells don't exceed max
    if (preparedSpells.length > preparedMax) {
      valid = false;
    }

    // Wizard spellbook: don't exceed 6 spells
    if (usesSpellbook(classId) && wizardSpellbook.length > 6) {
      valid = false;
    }

    // Wizard prepared: must be subset of spellbook
    if (usesSpellbook(classId)) {
      const invalidPrepared = preparedSpells.some((id) => !wizardSpellbook.includes(id));
      if (invalidPrepared) valid = false;
    }

    onValidityChange(valid);
  }, [cantrips, preparedSpells, wizardSpellbook, cantripMax, preparedMax, classId, onValidityChange]);

  // Update parent component
  useEffect(() => {
    // Combine cantrips + prepared/spellbook into known array
    const allKnown = [...cantrips, ...(usesSpellbook(classId) ? wizardSpellbook : preparedSpells)];
    onUpdate({
      spellbook: {
        known: allKnown,
        prepared: preparedSpells,
      },
    });
  }, [cantrips, preparedSpells, wizardSpellbook, classId, onUpdate]);

  // Handler to sync context spell selections with parent state
  // MUST be defined unconditionally (Rules of Hooks)
  const handleSpellsChange = useCallback(
    (selections: { cantrips: string[]; spellbook: string[]; prepared: string[] }) => {
      setCantrips(selections.cantrips);
      setWizardSpellbook(selections.spellbook);
      setPreparedSpells(selections.prepared);
    },
    []
  );

  // ===== WIZARD THREE-STEP FLOW =====
  if (usesSpellbook(classId)) {
    // Prepare initial state for context provider
    const wizardInitialState = {
      classId,
      level,
      abilityMod: modifier,
      cantripMax,
      preparedMax,
      spellbookMax: 6,
      cantrips,
      spellbook: wizardSpellbook,
      prepared: preparedSpells,
    };

    // Step 1: Select cantrips (if any)
    if (cantripMax > 0 && spellStep === 'cantrips') {
      const cantripSpells = spells.filter((s: Spell) => s.level === 0);
      const cantripsDone = cantrips.length === cantripMax;

      return (
        <StepContainer>
          <h2>Select Cantrips</h2>
          <InfoPanel>
            Select <strong>{cantripMax} cantrips</strong> for your Wizard.
          </InfoPanel>
          <SpellCounterBar counters={[{
            label: 'Cantrips',
            current: cantrips.length,
            max: cantripMax,
            invalid: !cantripsDone,
          }]} />

          <SpellGrid>
            {cantripSpells.map((spell: Spell) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                isSelected={cantrips.includes(normaliseSpellId(spell.id))}
                isGranted={false}
                canSelect={cantrips.length < cantripMax || cantrips.includes(normaliseSpellId(spell.id))}
                onToggle={handleToggleCantrip}
                onViewDetails={setSelectedSpell}
              />
            ))}
          </SpellGrid>

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <button
              disabled={!cantripsDone}
              onClick={() => setSpellStep('spellbook')}
              style={{
                background: cantripsDone ? '#8b5a2b' : 'transparent',
                border: '1px solid #c0aa70',
                color: '#f1c661',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: cantripsDone ? 'pointer' : 'not-allowed',
                opacity: cantripsDone ? 1 : 0.5,
              }}
            >
              Next: Select Spellbook
            </button>
          </div>

          <SpellDetailModal spell={selectedSpell} onClose={() => setSelectedSpell(null)} />
        </StepContainer>
      );
    }

    // Render based on current step (state managed by context)
    if (spellStep === 'spellbook' || (cantripMax === 0 && spellStep === 'cantrips')) {
      return (
        <SpellWizardProvider
          initialState={wizardInitialState}
          onStepChange={setSpellStep}
          onSpellsChange={handleSpellsChange}
        >
          <SpellbookStep spells={spells} />
        </SpellWizardProvider>
      );
    }

    if (spellStep === 'prepared') {
      return (
        <SpellWizardProvider
          initialState={wizardInitialState}
          onStepChange={setSpellStep}
          onSpellsChange={handleSpellsChange}
        >
          <PreparedSpellsStep allSpells={spells} />
        </SpellWizardProvider>
      );
    }
  }

  // ===== NON-WIZARD TWO-STEP FLOW =====
  // Step 1: Cantrips (if class has cantrips and not Paladin/Ranger)
  if (cantripMax > 0 && spellStep === 'cantrips') {
    const cantripSpells = spells.filter((s: Spell) => s.level === 0);
    const canProceed = cantrips.length >= 0 && cantrips.length <= cantripMax;

    return (
      <StepContainer>
        <h2>Select Cantrips - {classId}</h2>

        {classConfig.casterType === 'flexiblePrepared' && (
          <InfoPanel $variant="info">
            You can change your entire prepared spell list after a <strong>long rest</strong>.
          </InfoPanel>
        )}
        {classConfig.casterType === 'semiPrepared' && (
          <InfoPanel $variant="info">
            You can replace <strong>one</strong> prepared spell when you gain a level.
          </InfoPanel>
        )}
        {hasPactMagic(classId) && (
          <InfoPanel $variant="special">
            <strong>Pact Magic:</strong> You have 1 spell slot that recovers on short rest.
            Your spell slots are always cast at the highest level available.
          </InfoPanel>
        )}

        <SpellCounterBar counters={[{
          label: 'Cantrips',
          current: cantrips.length,
          max: cantripMax,
          invalid: !canProceed,
        }]} />

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

        {isLoadingSpells ? (
          <LoadingSpinner message="Loading cantrips..." />
        ) : (
          <>
            <h3>Available Cantrips ({cantripSpells.length})</h3>
            {cantripSpells.length === 0 ? (
              <EmptyState>No cantrips found with current filters.</EmptyState>
            ) : (
              <SpellGrid>
                {cantripSpells.map((spell) => (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    isSelected={cantrips.includes(normaliseSpellId(spell.id))}
                    isGranted={grantedSpells.includes(normaliseSpellId(spell.id))}
                    canSelect={cantrips.length < cantripMax || cantrips.includes(normaliseSpellId(spell.id))}
                    onToggle={handleToggleCantrip}
                    onViewDetails={setSelectedSpell}
                  />
                ))}
              </SpellGrid>
            )}
          </>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            disabled={!canProceed}
            onClick={() => setSpellStep('prepared')}
            style={{
              background: canProceed ? '#8b5a2b' : 'transparent',
              border: '1px solid #c0aa70',
              color: '#f1c661',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              opacity: canProceed ? 1 : 0.5,
            }}
          >
            Next: Select Spells
          </button>
        </div>

        <SpellDetailModal spell={selectedSpell} onClose={() => setSelectedSpell(null)} />
      </StepContainer>
    );
  }

  // Step 2: Prepared/Known Spells (ONLY level 1 spells)
  const leveledSpells = spells.filter((s: Spell) => s.level === 1);
  const preparedInvalid =
    (classConfig.casterType === 'flexiblePrepared' && (preparedSpells.length < 1 || preparedSpells.length > preparedMax)) ||
    (classConfig.casterType === 'semiPrepared' && preparedSpells.length !== preparedMax);

  return (
    <StepContainer>
      <h2>Select Spells - {classId}</h2>

      {/* Caster Type Info */}
      {classConfig.casterType === 'flexiblePrepared' && (
        <InfoPanel $variant="info">
          You can change your entire prepared spell list after a <strong>long rest</strong>.
        </InfoPanel>
      )}
      {classConfig.casterType === 'semiPrepared' && (
        <InfoPanel $variant="info">
          You can replace <strong>one</strong> prepared spell when you gain a level.
        </InfoPanel>
      )}
      {hasPactMagic(classId) && (
        <InfoPanel $variant="special">
          <strong>Pact Magic:</strong> You have 1 spell slot that recovers on short rest.
          Your spell slots are always cast at the highest level available.
        </InfoPanel>
      )}

      {/* Counters */}
      <SpellCounterBar counters={[{
        label: classConfig.casterType === 'flexiblePrepared' ? 'Prepared' : 'Known',
        current: preparedSpells.length,
        max: preparedMax,
        invalid: preparedInvalid,
      }]} />

      {/* Filters */}
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

      {/* Spell Lists (Level 1+ only) */}
      {isLoadingSpells ? (
        <LoadingSpinner message="Loading spells..." />
      ) : (
        <>
          <h3>Available Spells ({leveledSpells.length})</h3>
          {leveledSpells.length === 0 ? (
            <EmptyState>No level 1+ spells found with current filters.</EmptyState>
          ) : (
            <SpellGrid>
              {leveledSpells.map((spell) => {
                const spellId = normaliseSpellId(spell.id);
                const isInPrepared = preparedSpells.includes(spellId);
                const isGranted = grantedSpells.includes(spellId);

                return (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    isSelected={isInPrepared}
                    isGranted={isGranted}
                    canSelect={preparedSpells.length < preparedMax || isInPrepared}
                    onToggle={handleTogglePrepared}
                    onViewDetails={setSelectedSpell}
                  />
                );
              })}
            </SpellGrid>
          )}
        </>
      )}

      {/* Back Button (if came from cantrips page) */}
      {cantripMax > 0 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-start' }}>
          <button
            onClick={() => setSpellStep('cantrips')}
            style={{
              background: 'transparent',
              border: '1px solid #c0aa70',
              color: '#f1c661',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Back to Cantrips
          </button>
        </div>
      )}

      {/* Modal */}
      <SpellDetailModal spell={selectedSpell} onClose={() => setSelectedSpell(null)} />
    </StepContainer>
  );
};
