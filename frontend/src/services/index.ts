// Export all services for easy importing
export { default as characterService } from './characterService';
export {
  default as spellService,
  SPELL_SCHOOLS,
  SPELL_LEVELS,
} from './spellService';
export { default as classService, CHARACTER_CLASSES } from './classService';
export { default as speciesService, SPECIES_LIST } from './speciesService';
export { default as backgroundService } from './backgroundService';
export { default as featService } from './featService';
export {
  default as itemService,
  ITEM_TYPES,
  ITEM_RARITIES,
  WEAPON_PROPERTIES,
} from './itemService';
export { apiClient } from './api';

// Re-export types
export type {
  ApiResponse,
  PaginatedResponse,
  Character,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  Spell,
  CharacterClass,
  Species,
  Background,
  Item,
  User,
  Campaign,
} from '../types/api';

// Re-export service-specific types
export type { SpellFilters } from './spellService';
export type { ItemFilters } from './itemService';
