import { CharacterBuilderData } from '../components/CharacterGeneratorWizard';

/**
 * Derives starting equipment from class and background choices
 * Per UX spec: Equipment step removed, auto-derived instead
 *
 * NOTE: This function is deprecated. Equipment extraction is now handled in
 * characterDataMapper.ts via extractEquipmentItems() which properly handles
 * the JSONB structure from backgrounds and choice objects from classes.
 */
export function deriveEquipment(_data: CharacterBuilderData): string[] {
  // This function is deprecated - equipment extraction happens in characterDataMapper.ts
  // Returning empty array to maintain backwards compatibility
  return [];
}

/**
 * Formats equipment list for display
 */
export function formatEquipmentList(equipment: string[]): string {
  if (equipment.length === 0) {
    return 'No starting equipment specified. Equipment can be added after character creation.';
  }

  return equipment.join(', ');
}
