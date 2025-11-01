import { apiClient, request, withSignal } from './api';
import { ApiResult, CharacterClass } from '@/types/api';

export const listClasses = (
  signal?: AbortSignal
): Promise<ApiResult<CharacterClass[]>> =>
  request<CharacterClass[]>(
    () => apiClient.get<CharacterClass[]>('/classes', withSignal(undefined, signal)),
    { retry: true }
  );

export const getClassById = (
  id: string,
  signal?: AbortSignal
): Promise<ApiResult<CharacterClass>> =>
  request<CharacterClass>(
    () => apiClient.get<CharacterClass>(`/classes/${id}`, withSignal(undefined, signal)),
    { retry: true }
  );

export const getClassByName = (
  name: string,
  signal?: AbortSignal
): Promise<ApiResult<CharacterClass>> =>
  request<CharacterClass>(
    () =>
      apiClient.get<CharacterClass>(
        `/classes/${encodeURIComponent(name)}`,
        withSignal(undefined, signal)
      ),
    { retry: true }
  );

// Character class constants for easy reference
export const CHARACTER_CLASSES = [
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

export const CLASS_SKILLS: Record<string, string[]> = {
  Barbarian: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
  Bard: ['any'],
  Cleric: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
  Druid: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
  Fighter: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
  Monk: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
  Paladin: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
  Ranger: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
  Rogue: [
    'Acrobatics',
    'Athletics',
    'Deception',
    'Insight',
    'Intimidation',
    'Investigation',
    'Perception',
    'Performance',
    'Persuasion',
    'Sleight of Hand',
    'Stealth',
  ],
  Sorcerer: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
  Warlock: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
  Wizard: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
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
  Wizard: 2,
};

export const classService = {
  listClasses,
  getClassById,
  getClassByName,
  CLASS_SKILLS,
  CLASS_SKILL_CHOICES,
  CHARACTER_CLASSES,
};

export default classService;
