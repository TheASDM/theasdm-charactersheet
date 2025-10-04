// Export all services for easy importing
export {
  default as characterService,
  list as listCharacters,
  getById as getCharacter,
  create as createCharacter,
  update as updateCharacter,
  remove as removeCharacter,
} from './characterService';
export {
  default as spellService,
  SPELL_SCHOOLS,
  SPELL_LEVELS,
  listSpells,
  getSpellById,
  listSpellsByLevel,
  listSpellsBySchool,
  searchSpells,
  listCantrips,
  listSpellsByClass,
  listSpellsByClassId,
  getClassSpellStats,
} from './spellService';
export {
  default as classService,
  CHARACTER_CLASSES,
  CLASS_SKILLS,
  CLASS_SKILL_CHOICES,
  listClasses,
  getClassById,
  getClassByName,
} from './classService';
export { speciesService, listSpecies, getSpecies, SPECIES_LIST } from './speciesService';
export {
  default as backgroundService,
  listBackgrounds,
  getBackgroundById,
  findBackgroundByName,
} from './backgroundService';
export {
  default as featService,
  listFeats,
  getFeatById,
  getFeatByName,
  listFeatsByCategory,
  FEAT_CATEGORIES,
} from './featService';
export * as authService from './authService';
export {
  default as itemService,
  ITEM_TYPES,
  ITEM_RARITIES,
  WEAPON_PROPERTIES,
} from './itemService';
export {
  default as equipmentService,
  listEquipment,
  getEquipmentById,
  getEquipmentByName,
  listEquipmentByType,
  listWeapons,
  listArmor,
  listAdventuringGear,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_TYPE_MAP,
  WEAPON_CATEGORIES,
  ARMOR_TYPES,
} from './equipmentService';
export { apiClient } from './api';

// Re-export types
export type {
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
