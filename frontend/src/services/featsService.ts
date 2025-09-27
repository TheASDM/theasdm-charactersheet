import { apiClient } from './api';
import { ApiResponse } from '../types/api';

export interface Feat {
  id: number;
  name: string;
  source: string;
  page: number;
  category: string;
  prerequisites?: any;
  abilityScoreIncrease?: any;
  repeatable: boolean;
  entries: any;
  additionalSpells?: any;
  srd52: boolean;
  basicRules2024: boolean;
  sourceBook: string;
  contentVersion: string;
  isHomebrew: boolean;
  createdAt: string;
  updatedAt: string;
}

export const featsService = {
  // Get all feats
  getAll: async (): Promise<ApiResponse<Feat[]>> => {
    return apiClient.get<Feat[]>('/feats');
  },

  // Get a single feat by ID
  getById: async (id: number): Promise<ApiResponse<Feat>> => {
    return apiClient.get<Feat>(`/feats/${id}`);
  },

  // Get a feat by name
  getByName: async (name: string): Promise<ApiResponse<Feat>> => {
    return apiClient.get<Feat>(`/feats/name/${encodeURIComponent(name)}`);
  },

  // Get feats by category
  getByCategory: async (category: string): Promise<ApiResponse<Feat[]>> => {
    return apiClient.get<Feat[]>(`/feats?category=${encodeURIComponent(category)}`);
  },
};

// Feat categories for easy reference (D&D 2024)
export const FEAT_CATEGORIES = {
  ORIGIN: 'o', // Origin feats (level 1)
  GENERAL: 'g', // General feats (level 4+)
  FIGHTING_STYLE: 'fs', // Fighting Style feats
  EPIC_BOON: 'eb', // Epic Boon feats (level 19+)
} as const;

export default featsService;