/**
 * SpellWizardContext - Centralized state management for spell selection wizard
 * Eliminates prop drilling and provides shared state across wizard steps
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { LevelFilter, RitualFilter, ConcentrationFilter } from '@/utils/spellConstants';

/**
 * Wizard step identifier
 */
export type WizardStep = 'cantrips' | 'spellbook' | 'prepared';

/**
 * Spell wizard state
 */
export interface SpellWizardState {
  // === Current Step ===
  currentStep: WizardStep;

  // === Spell Selections ===
  cantrips: string[];
  spellbook: string[]; // Wizard only
  prepared: string[];

  // === Filter State (preserved across steps) ===
  searchTerm: string;
  levelFilter: LevelFilter;
  schoolFilter: string;
  ritualFilter: RitualFilter;
  concentrationFilter: ConcentrationFilter;

  // === Class Metadata ===
  classId: string;
  level: number;
  abilityMod: number;

  // === Limits ===
  cantripMax: number;
  preparedMax: number;
  spellbookMax?: number; // Wizard only
}

/**
 * Actions to modify wizard state
 */
export interface SpellWizardActions {
  // Navigation
  setCurrentStep: (step: WizardStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Spell selections
  setCantrips: React.Dispatch<React.SetStateAction<string[]>>;
  setSpellbook: React.Dispatch<React.SetStateAction<string[]>>;
  setPrepared: React.Dispatch<React.SetStateAction<string[]>>;

  // Filters
  setSearchTerm: (term: string) => void;
  setLevelFilter: (level: LevelFilter) => void;
  setSchoolFilter: (school: string) => void;
  setRitualFilter: (ritual: RitualFilter) => void;
  setConcentrationFilter: (concentration: ConcentrationFilter) => void;
  clearFilters: () => void;

  // Utilities
  reset: () => void;
}

/**
 * Combined context value
 */
export type SpellWizardContextValue = SpellWizardState & SpellWizardActions;

const SpellWizardContext = createContext<SpellWizardContextValue | undefined>(undefined);

/**
 * Initial state factory
 */
export interface SpellWizardProviderProps {
  children: ReactNode;
  initialState: {
    classId: string;
    level: number;
    abilityMod: number;
    cantripMax: number;
    preparedMax: number;
    spellbookMax?: number;
    cantrips?: string[];
    spellbook?: string[];
    prepared?: string[];
  };
  onStepChange?: (step: WizardStep) => void;
  onSpellsChange?: (selections: { cantrips: string[]; spellbook: string[]; prepared: string[] }) => void;
}

/**
 * Spell Wizard Context Provider
 */
export const SpellWizardProvider: React.FC<SpellWizardProviderProps> = ({
  children,
  initialState,
  onStepChange,
  onSpellsChange,
}) => {
  // === Step State ===
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    initialState.cantripMax > 0 ? 'cantrips' : 'spellbook'
  );

  // === Spell Selections ===
  const [cantrips, setCantrips] = useState<string[]>(initialState.cantrips ?? []);
  const [spellbook, setSpellbook] = useState<string[]>(initialState.spellbook ?? []);
  const [prepared, setPrepared] = useState<string[]>(initialState.prepared ?? []);

  // === Filter State ===
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [ritualFilter, setRitualFilter] = useState<RitualFilter>('any');
  const [concentrationFilter, setConcentrationFilter] = useState<ConcentrationFilter>('any');

  // === Navigation Actions ===
  const goToNextStep = useCallback(() => {
    let nextStep: WizardStep | null = null;

    if (currentStep === 'cantrips') {
      nextStep = initialState.spellbookMax ? 'spellbook' : 'prepared';
    } else if (currentStep === 'spellbook') {
      nextStep = 'prepared';
    }

    if (nextStep) {
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    }
  }, [currentStep, initialState.spellbookMax, onStepChange]);

  const goToPreviousStep = useCallback(() => {
    let prevStep: WizardStep | null = null;

    if (currentStep === 'prepared') {
      prevStep = initialState.spellbookMax ? 'spellbook' : 'cantrips';
    } else if (currentStep === 'spellbook') {
      if (initialState.cantripMax > 0) {
        prevStep = 'cantrips';
      }
    }

    if (prevStep) {
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  }, [currentStep, initialState.cantripMax, initialState.spellbookMax, onStepChange]);

  // === Filter Actions ===
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setLevelFilter('all');
    setSchoolFilter('all');
    setRitualFilter('any');
    setConcentrationFilter('any');
  }, []);

  // === Reset ===
  const reset = useCallback(() => {
    setCurrentStep(initialState.cantripMax > 0 ? 'cantrips' : 'spellbook');
    setCantrips([]);
    setSpellbook([]);
    setPrepared([]);
    clearFilters();
  }, [initialState.cantripMax, clearFilters]);

  // === Notify parent of spell changes ===
  useEffect(() => {
    onSpellsChange?.({ cantrips, spellbook, prepared });
  }, [cantrips, spellbook, prepared, onSpellsChange]);

  // === Context Value ===
  const value: SpellWizardContextValue = {
    // State
    currentStep,
    cantrips,
    spellbook,
    prepared,
    searchTerm,
    levelFilter,
    schoolFilter,
    ritualFilter,
    concentrationFilter,
    classId: initialState.classId,
    level: initialState.level,
    abilityMod: initialState.abilityMod,
    cantripMax: initialState.cantripMax,
    preparedMax: initialState.preparedMax,
    ...(initialState.spellbookMax !== undefined && { spellbookMax: initialState.spellbookMax }),

    // Actions
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    setCantrips,
    setSpellbook,
    setPrepared,
    setSearchTerm,
    setLevelFilter,
    setSchoolFilter,
    setRitualFilter,
    setConcentrationFilter,
    clearFilters,
    reset,
  };

  return <SpellWizardContext.Provider value={value}>{children}</SpellWizardContext.Provider>;
};

/**
 * Hook to access spell wizard context
 *
 * @throws Error if used outside SpellWizardProvider
 *
 * @example
 * ```typescript
 * const { cantrips, setCantrips, cantripMax } = useSpellWizard();
 * ```
 */
export function useSpellWizard(): SpellWizardContextValue {
  const context = useContext(SpellWizardContext);
  if (context === undefined) {
    throw new Error('useSpellWizard must be used within a SpellWizardProvider');
  }
  return context;
}
