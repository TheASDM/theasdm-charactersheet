import { apiClient } from './api';
import { CharacterClass, ApiResponse } from '../types/api';

export const classService = {
  // Get all character classes
  getAll: async (): Promise<ApiResponse<CharacterClass[]>> => {
    return apiClient.get<CharacterClass[]>('/classes');
  },

  // Get a single class by ID
  getById: async (id: number): Promise<ApiResponse<CharacterClass>> => {
    return apiClient.get<CharacterClass>(`/classes/${id}`);
  },

  // Get a class by name
  getByName: async (name: string): Promise<ApiResponse<CharacterClass>> => {
    return apiClient.get<CharacterClass>(
      `/classes/name/${encodeURIComponent(name)}`
    );
  },
};

// Character class constants for easy reference
export const CHARACTER_CLASSES = [
  'Artificer',
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
] as const;

// Class skills and skill choice counts for character generator wizard
// These are essential for the wizard workflow and provide immediate feedback
export const CLASS_SKILLS: Record<string, string[]> = {
  Barbarian: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
  Bard: ['any'], // Special case - bards can choose any skills
  Cleric: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
  Druid: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
  Fighter: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
  Monk: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
  Paladin: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
  Ranger: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
  Rogue: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
  Sorcerer: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
  Warlock: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
  Wizard: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']
};

export const CLASS_SKILL_CHOICES: Record<string, number> = {
  Barbarian: 2,
  Bard: 3,
  Cleric: 2,
  Druid: 2,
  Fighter: 2,
  Monk: 2,
  Paladin: 2,
  Ranger: 3,
  Rogue: 4,
  Sorcerer: 2,
  Warlock: 2,
  Wizard: 2
};

export default classService;
