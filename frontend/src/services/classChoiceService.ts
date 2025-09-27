/**
 * Class Choice Service
 *
 * Fetches D&D 2024 class choice data from the backend API
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface FightingStyle {
  id: number;
  name: string;
  description: string;
  detailedText?: string;
  effects?: any;
  availableToClasses: string[];
}

export interface DivineOrder {
  id: number;
  name: string;
  description: string;
  detailedText?: string;
  proficienciesGranted?: any;
  featuresGranted?: any;
  spellsGranted: string[];
}

export interface EldritchInvocation {
  id: number;
  name: string;
  description: string;
  detailedText?: string;
  prerequisites?: any;
  effects?: any;
  spellsGranted: string[];
  atWillSpells: string[];
  levelRequirement?: number;
  pactBoonRequired?: string;
  spellLevelRequired?: number;
}

export interface ClassChoicesResponse {
  class: any;
  choices: {
    fightingStyles?: FightingStyle[];
    divineOrders?: DivineOrder[];
    eldritchInvocations?: EldritchInvocation[];
  };
}

class ClassChoiceService {
  /**
   * Get all fighting styles for a specific class
   */
  async getFightingStyles(className?: string): Promise<FightingStyle[]> {
    try {
      const params = className ? { className } : {};
      const response = await axios.get(`${API_BASE_URL}/class-choices/fighting-styles`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching fighting styles:', error);
      return [];
    }
  }

  /**
   * Get all divine orders
   */
  async getDivineOrders(): Promise<DivineOrder[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/class-choices/divine-orders`);
      return response.data;
    } catch (error) {
      console.error('Error fetching divine orders:', error);
      return [];
    }
  }

  /**
   * Get eldritch invocations for a specific warlock level
   */
  async getEldritchInvocations(level: number = 1): Promise<EldritchInvocation[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/class-choices/eldritch-invocations`, {
        params: { level }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching eldritch invocations:', error);
      return [];
    }
  }

  /**
   * Get basic class data including features and proficiencies
   */
  async getClassData(className: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/class-choices/class-data/${className}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching class data:', error);
      return null;
    }
  }

  /**
   * Get all class choices for a specific class and level
   */
  async getClassChoices(className: string, level: number = 1): Promise<ClassChoicesResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/class-choices/${className}`, {
        params: { level }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching class choices:', error);
      return { class: null, choices: {} };
    }
  }
}

export default new ClassChoiceService();