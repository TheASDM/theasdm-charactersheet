import { Item } from '../types/api';
import { InventoryItem, CharacterSheetData, EquipmentValidationResult } from '../types/characterSheet';

export class EquipmentValidator {
  /**
   * Validates if an item can be added to the character's inventory
   */
  static validateItemAddition(
    character: CharacterSheetData,
    item: Item | InventoryItem,
    quantity: number = 1
  ): EquipmentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check inventory space
    const currentItems = character.inventory.filter(invItem => invItem.name.trim() !== '').length;
    const maxInventorySlots = this.getMaxInventorySlots(character);

    if (currentItems >= maxInventorySlots) {
      errors.push(`Inventory is full (${maxInventorySlots} slots)`);
    }

    // Equipment-specific validations
    if (this.isItem(item)) {
      this.validateEquipmentRules(character, item, errors, warnings);
      this.validateAttunementRules(character, item, errors, warnings);
      this.validateWeightLimits(character, item, quantity, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates equipment rules (armor, shields, weapons)
   */
  private static validateEquipmentRules(
    _character: CharacterSheetData,
    _item: Item,
    _errors: string[],
    _warnings: string[]
  ): void {
    // Shield validation - removed conflict errors since items are no longer auto-equipped

    // Armor validation - removed replacement warnings since items are no longer auto-equipped

    // Two-handed weapon validation - removed conflict warnings since items are no longer auto-equipped
  }

  /**
   * Validates attunement rules
   */
  private static validateAttunementRules(
    character: CharacterSheetData,
    item: Item,
    errors: string[],
    warnings: string[]
  ): void {
    if (item.reqAttune) {
      const attunedCount = character.attunedItems?.length || 0;
      const maxAttuned = character.equipmentConstraints?.maxAttunedItems || 3;

      if (attunedCount >= maxAttuned) {
        warnings.push(`You can only attune to ${maxAttuned} items. You'll need to unattune from another item.`);
      }

      // Check class/level requirements
      if (item.reqAttune.includes('spellcaster') && !this.isSpellcaster(character)) {
        errors.push('This item requires attunement by a spellcaster');
      }
    }
  }

  /**
   * Validates weight limits (if using encumbrance rules)
   */
  private static validateWeightLimits(
    character: CharacterSheetData,
    item: Item,
    quantity: number,
    warnings: string[]
  ): void {
    const weightLimit = character.equipmentConstraints?.weightLimit;
    if (!weightLimit || !item.weight) return;

    const currentWeight = this.calculateTotalWeight(character);
    const newWeight = (item.weight * quantity);

    if (currentWeight + newWeight > weightLimit) {
      warnings.push(`Adding this item would exceed your carrying capacity (${currentWeight + newWeight}/${weightLimit} lbs)`);
    }
  }

  /**
   * Calculate armor class based on equipped items
   */
  static calculateArmorClass(character: CharacterSheetData, itemLookup?: (itemId: number) => Item | null): number {
    const dexMod = Math.floor((character.abilityScores.dexterity - 10) / 2);
    const equippedArmor = character.equippedArmor;
    const equippedShield = character.equippedShield;

    let ac = 10; // Base AC
    let maxDexBonus = dexMod; // No limit by default
    let magicArmorBonus = 0;
    let magicShieldBonus = 0;

    if (equippedArmor) {
      // Use custom properties if available, otherwise try to parse from name/description
      const armorAC = (equippedArmor.customProperties?.ac as number) || this.getArmorACFromName(equippedArmor.name);
      const armorType = this.getArmorTypeFromName(equippedArmor.name);

      if (typeof armorAC === 'number') {
        ac = armorAC;

        // Apply dexterity modifier limits based on armor type
        switch (armorType) {
          case 'light':
            maxDexBonus = dexMod; // No limit
            break;
          case 'medium':
            maxDexBonus = Math.min(dexMod, 2); // Max +2
            break;
          case 'heavy':
            maxDexBonus = 0; // No dex bonus
            break;
        }
      }

      // Add magic armor bonus
      if (equippedArmor.itemId && itemLookup) {
        const armorItem = itemLookup(equippedArmor.itemId);
        if (armorItem?.bonusAc) {
          magicArmorBonus = armorItem.bonusAc;
        }
      }
      // Fallback: try to extract bonus from item name (e.g., "+1 Plate Armor")
      if (magicArmorBonus === 0) {
        const nameMatch = equippedArmor.name.match(/^\+(\d+)/);
        if (nameMatch) {
          magicArmorBonus = parseInt(nameMatch[1]);
        }
      }
    }

    // Add dex modifier (with limits)
    ac += maxDexBonus;

    // Add magic armor bonus
    ac += magicArmorBonus;

    // Add shield bonus
    if (equippedShield) {
      let shieldBonus = 2; // Standard shield bonus

      // Add magic shield bonus
      if (equippedShield.itemId && itemLookup) {
        const shieldItem = itemLookup(equippedShield.itemId);
        if (shieldItem?.bonusAc) {
          magicShieldBonus = shieldItem.bonusAc;
        }
      }
      // Fallback: try to extract bonus from item name (e.g., "+1 Shield")
      if (magicShieldBonus === 0) {
        const nameMatch = equippedShield.name.match(/^\+(\d+)/);
        if (nameMatch) {
          magicShieldBonus = parseInt(nameMatch[1]);
        }
      }

      ac += shieldBonus + magicShieldBonus;
    }

    return ac;
  }

  /**
   * Helper methods for item type detection
   */
  private static isItem(item: Item | InventoryItem): item is Item {
    return 'type' in item && 'id' in item;
  }

  static isWeapon(item: Item): boolean {
    return ['M', 'R', 'A'].includes(item.type || '') ||
           item.weaponCategory !== undefined ||
           this.isWeaponByName(item.name);
  }

  static isArmor(item: Item): boolean {
    return ['LA', 'MA', 'HA'].includes(item.type || '') ||
           ['light', 'medium', 'heavy'].includes(item.armorType || '') ||
           (Boolean(item.ac) && item.armorType !== 'shield');
  }

  private static isWeaponByName(name: string): boolean {
    const weaponTypes = [
      // Melee weapons
      'sword', 'axe', 'mace', 'dagger', 'spear', 'javelin', 'club', 'rapier', 'scimitar',
      'hammer', 'flail', 'morningstar', 'pike', 'glaive', 'halberd', 'lance', 'trident',
      'whip', 'quarterstaff', 'staff', 'maul', 'greataxe', 'greatsword', 'longsword',
      'shortsword', 'sickle', 'handaxe', 'battleaxe', 'warhammer',
      // Ranged weapons
      'bow', 'crossbow', 'longbow', 'shortbow', 'blowgun', 'sling', 'dart', 'net',
      // Natural/Improvised
      'unarmed', 'fist'
    ];
    return weaponTypes.some(type => name.toLowerCase().includes(type));
  }

  private static isSpellcaster(character: CharacterSheetData): boolean {
    const spellcastingClasses = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
    return spellcastingClasses.includes(character.class.toLowerCase());
  }

  private static getMaxInventorySlots(_character: CharacterSheetData): number {
    // Base inventory slots, could be modified by items, feats, etc.
    return 20; // Default, could be made configurable
  }

  private static calculateTotalWeight(character: CharacterSheetData): number {
    return character.inventory.reduce((total, item) => {
      const itemWeight = this.getItemWeight(item.name);
      return total + (itemWeight * item.quantity);
    }, 0);
  }

  private static getItemWeight(itemName: string): number {
    // This would ideally look up the item in the database
    // For now, return estimated weights based on item name
    const weightMap: { [key: string]: number } = {
      'dagger': 1,
      'shortsword': 2,
      'longsword': 3,
      'rapier': 2,
      'greataxe': 7,
      'greatsword': 6,
      'shield': 6,
      'leather armor': 10,
      'chain mail': 55,
      'plate armor': 65,
      // Add more as needed
    };

    const lowerName = itemName.toLowerCase();
    for (const [item, weight] of Object.entries(weightMap)) {
      if (lowerName.includes(item)) {
        return weight;
      }
    }

    return 0; // Unknown items have no weight
  }

  private static getArmorACFromName(armorName: string): number | null {
    const lowerName = armorName.toLowerCase();

    // Check more specific armor types first to avoid partial matches
    const specificArmorMap: { [key: string]: number } = {
      'studded leather': 12,
      'chain shirt': 13,
      'scale mail': 14,
      'half plate': 15,
      'ring mail': 14,
      'chain mail': 16,
    };

    // Check specific armors first
    for (const [armor, ac] of Object.entries(specificArmorMap)) {
      if (lowerName.includes(armor)) {
        return ac;
      }
    }

    // Then check generic armors
    const genericArmorMap: { [key: string]: number } = {
      'leather': 11,
      'breastplate': 14,
      'splint': 17,
      'plate': 18,
    };

    for (const [armor, ac] of Object.entries(genericArmorMap)) {
      if (lowerName.includes(armor)) {
        return ac;
      }
    }

    return null;
  }

  private static getArmorTypeFromName(armorName: string): 'light' | 'medium' | 'heavy' | null {
    const lightArmor = ['leather', 'studded leather'];
    const mediumArmor = ['chain shirt', 'scale mail', 'breastplate', 'half plate'];
    const heavyArmor = ['ring mail', 'chain mail', 'splint', 'plate'];

    const lowerName = armorName.toLowerCase();

    if (lightArmor.some(armor => lowerName.includes(armor))) return 'light';
    if (mediumArmor.some(armor => lowerName.includes(armor))) return 'medium';
    if (heavyArmor.some(armor => lowerName.includes(armor))) return 'heavy';

    return null;
  }
}