import { create } from 'zustand';
import type { CharacterBuilderStore } from './characterBuilder/types';
import { createWizardNavigationSlice } from './characterBuilder/wizardNavigationSlice';
import { createBasicInfoSlice } from './characterBuilder/basicInfoSlice';
import { createAbilityScoresSlice } from './characterBuilder/abilityScoresSlice';
import { createClassSelectionSlice } from './characterBuilder/classSelectionSlice';
import { createBackgroundSlice } from './characterBuilder/backgroundSlice';
import { createSpeciesSlice } from './characterBuilder/speciesSlice';
import { createFeatsSlice } from './characterBuilder/featsSlice';
import { createEquipmentSlice } from './characterBuilder/equipmentSlice';
import { createSpellbookSlice } from './characterBuilder/spellbookSlice';
import { createResourcesSlice } from './characterBuilder/resourcesSlice';
import { createResetSlice } from './characterBuilder/resetSlice';

export type {
  WizardStep,
  AbilityScoreValue,
  BasicInfoState,
  AbilityScoresState,
  ClassSelectionState,
  BackgroundState,
  SpeciesState,
  FeatsState,
  EquipmentState,
  SpellbookState,
  ResourcesState,
} from './characterBuilder/types';

export const useCharacterBuilderStore = create<CharacterBuilderStore>()((set, get, api) => ({
  ...createWizardNavigationSlice(set, get, api),
  ...createBasicInfoSlice(set, get, api),
  ...createAbilityScoresSlice(set, get, api),
  ...createClassSelectionSlice(set, get, api),
  ...createBackgroundSlice(set, get, api),
  ...createSpeciesSlice(set, get, api),
  ...createFeatsSlice(set, get, api),
  ...createEquipmentSlice(set, get, api),
  ...createSpellbookSlice(set, get, api),
  ...createResourcesSlice(set, get, api),
  ...createResetSlice(set, get, api),
}));
