import { useState, useCallback, useMemo } from 'react';
import { CharacterSheetData, InventoryItem } from '../../types/characterSheet';
import { Item } from '../../types/api';
import { itemService } from '../../services/itemService';
import { EquipmentValidator } from '../../utils/equipmentValidator';
import { SpecialItemsRegistry } from '../../utils/specialItemsRegistry';
import { calculateWeaponStats } from '../../utils/weaponCalculator';

interface InventoryOperationResult {
  success: boolean;
  message: string;
  warnings?: string[];
}

// Helper function to check if an item name indicates armor (used for manual equipping)
const isArmorByName = (name: string): boolean => {
  const lowerName = name.toLowerCase();

  // Check specific armor types first to avoid partial matches
  const specificArmors = ['studded leather', 'chain shirt', 'scale mail', 'half plate', 'ring mail', 'chain mail'];
  for (const armor of specificArmors) {
    if (lowerName.includes(armor)) return true;
  }

  // Then check generic armor types
  const genericArmors = ['leather', 'breastplate', 'splint', 'plate', 'armor'];
  return genericArmors.some(type => lowerName.includes(type));
};

// Helper function to check if an item name indicates a weapon
const isWeaponByName = (name: string): boolean => {
  const weaponTypes = [
    'sword', 'axe', 'mace', 'dagger', 'spear', 'bow', 'crossbow', 'javelin', 'club',
    'rapier', 'scimitar', 'hammer', 'maul', 'pike', 'glaive', 'halberd', 'trident',
    'whip', 'sling', 'dart', 'blowgun', 'net', 'lance', 'flail', 'morningstar'
  ];
  return weaponTypes.some(type => name.toLowerCase().includes(type));
};

// Helper function to migrate old inventory format to new format
const migrateInventory = (inventory: string[] | InventoryItem[] | any[]): InventoryItem[] => {
  if (!inventory || inventory.length === 0) return [];

  return inventory.map((item, index) => {
    // If it's already an InventoryItem
    if (item && typeof item === 'object' && 'id' in item) {
      return {
        id: item.id || `migrated-${index}`,
        name: item.name || '',
        quantity: item.quantity || 1,
        equipped: item.equipped || false,
        attuned: item.attuned || false,
        itemId: item.itemId,
        customProperties: item.customProperties
      };
    }

    // If it's an old format object with name and quantity
    if (item && typeof item === 'object' && 'name' in item) {
      return {
        id: `migrated-${index}`,
        name: item.name || '',
        quantity: item.quantity || 1,
        equipped: false,
        attuned: false
      };
    }

    // If it's a string
    if (typeof item === 'string') {
      return {
        id: `migrated-${index}`,
        name: item,
        quantity: 1,
        equipped: false,
        attuned: false
      };
    }

    // Default case
    return {
      id: `migrated-${index}`,
      name: '',
      quantity: 1,
      equipped: false,
      attuned: false
    };
  });
};

export const useInventoryManagement = (
  character: CharacterSheetData,
  onUpdate: (updatedCharacter: CharacterSheetData) => void,
  onSave?: (updatedCharacter: CharacterSheetData, options?: { silent?: boolean }) => void | Promise<void>
) => {
  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemModalType, setItemModalType] = useState<'official' | 'custom'>('official');
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<Item | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ index: number; itemName: string } | null>(null);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Operation feedback
  const [operationResult, setOperationResult] = useState<InventoryOperationResult | null>(null);

  // Ensure inventory is always in the correct format
  const normalizedInventory = useMemo(() => {
    return migrateInventory(character.inventory);
  }, [character.inventory]);

  // Enhanced item search with debouncing
  const handleItemSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await itemService.search(term, 20);
      if (response.data) {
        setSearchResults(response.data.items || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching items:', error);
      setSearchResults([]);
      setOperationResult({
        success: false,
        message: 'Failed to search items. Please try again.'
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Helper function to add items to inventory
  const addItemsToInventory = useCallback((
    currentInventory: InventoryItem[],
    itemsToAdd: InventoryItem[],
    maxItems: number = 20
  ): { success: boolean; updatedInventory: InventoryItem[]; addedCount: number } => {
    const updatedInventory = [...currentInventory];
    let addedCount = 0;

    for (const newItem of itemsToAdd) {
      // Check if item already exists, increment quantity
      const existingIndex = updatedInventory.findIndex(invItem =>
        invItem.name && invItem.name.toLowerCase() === newItem.name.toLowerCase()
      );

      if (existingIndex !== -1) {
        updatedInventory[existingIndex] = {
          ...updatedInventory[existingIndex],
          quantity: updatedInventory[existingIndex].quantity + newItem.quantity
        };
        addedCount++;
      } else {
        // Find empty slot or add new item
        const emptyIndex = updatedInventory.findIndex(slot => !slot.name || slot.name.trim() === '');

        if (emptyIndex !== -1) {
          updatedInventory[emptyIndex] = { ...newItem };
          addedCount++;
        } else if (updatedInventory.length < maxItems) {
          updatedInventory.push({ ...newItem });
          addedCount++;
        } else {
          // Inventory is full, stop trying to add more items
          break;
        }
      }
    }

    return {
      success: addedCount === itemsToAdd.length,
      updatedInventory,
      addedCount
    };
  }, []);

  // Enhanced item selection with validation
  const handleItemSelect = useCallback((item: Item) => {
    // Validate if item can be added
    const validation = EquipmentValidator.validateItemAddition(character, item, 1);

    if (!validation.isValid) {
      setOperationResult({
        success: false,
        message: `Cannot add item: ${validation.errors.join(', ')}`
      });
      return;
    }

    // Check for special items
    const specialContents = SpecialItemsRegistry.getItemContents(item.name);

    try {
      let updatedCharacter = { ...character };

      // Add the main item
      const newInventoryItem: InventoryItem = {
        id: `item-${Date.now()}`,
        name: item.name,
        quantity: 1,
        itemId: item.id,
        equipped: false,
        attuned: false
      };

      const itemsToAdd = [newInventoryItem, ...specialContents];
      const result = addItemsToInventory(normalizedInventory, itemsToAdd);

      if (!result.success && result.addedCount === 0) {
        setOperationResult({
          success: false,
          message: 'Inventory is full! Remove items to make space.'
        });
        return;
      }

      updatedCharacter.inventory = result.updatedInventory;

      // Auto-populate weapons to Actions section
      if (EquipmentValidator.isWeapon(item)) {
        const weaponStats = calculateWeaponStats(item, character);

        // Find an empty action slot or add a new one
        const updatedActions = [...character.actions];
        const emptyActionIndex = updatedActions.findIndex(action => !action.name || action.name.trim() === '');

        const newAction = {
          name: item.name,
          atkBonus: weaponStats.attackBonus,
          damage: weaponStats.damage,
        };

        if (emptyActionIndex !== -1) {
          // Use existing empty slot
          updatedActions[emptyActionIndex] = newAction;
        } else {
          // Add new action
          updatedActions.push(newAction);
        }

        updatedCharacter.actions = updatedActions;
      }

      onUpdate(updatedCharacter);

      // Auto-save the changes
      if (onSave) {
        setTimeout(() => {
          onSave(updatedCharacter, { silent: true });
        }, 100);
      }

      setShowItemModal(false);

      const message = specialContents.length > 0
        ? `Added ${item.name} with ${specialContents.length} items inside!`
        : `Added ${item.name} to inventory`;

      setOperationResult({
        success: true,
        message,
        warnings: validation.warnings
      });

    } catch (error) {
      console.error('Error adding item:', error);
      setOperationResult({
        success: false,
        message: 'Failed to add item to inventory'
      });
    }
  }, [character, normalizedInventory, addItemsToInventory, onUpdate, onSave]);

  // Enhanced custom item addition
  const handleCustomItemAdd = useCallback((customItemName: string) => {
    if (!customItemName.trim()) return;

    const itemName = customItemName.trim();

    // Check for special items
    const specialContents = SpecialItemsRegistry.getItemContents(itemName);

    const newItem: InventoryItem = {
      id: `custom-${Date.now()}`,
      name: itemName,
      quantity: 1,
      equipped: false,
      attuned: false
    };

    try {
      const itemsToAdd = [newItem, ...specialContents];
      const result = addItemsToInventory(normalizedInventory, itemsToAdd);

      if (!result.success && result.addedCount === 0) {
        setOperationResult({
          success: false,
          message: 'Inventory is full! Remove items to make space.'
        });
        return;
      }

      let updatedCharacter = {
        ...character,
        inventory: result.updatedInventory
      };

      // Auto-populate custom weapons to Actions section
      if (isWeaponByName(itemName)) {
        const weaponStats = calculateWeaponStats(newItem, character);

        // Find an empty action slot or add a new one
        const updatedActions = [...character.actions];
        const emptyActionIndex = updatedActions.findIndex(action => !action.name || action.name.trim() === '');

        const newAction = {
          name: itemName,
          atkBonus: weaponStats.attackBonus,
          damage: weaponStats.damage,
        };

        if (emptyActionIndex !== -1) {
          // Use existing empty slot
          updatedActions[emptyActionIndex] = newAction;
        } else {
          // Add new action
          updatedActions.push(newAction);
        }

        updatedCharacter.actions = updatedActions;
      }

      onUpdate(updatedCharacter);

      // Auto-save the changes
      if (onSave) {
        setTimeout(() => {
          onSave(updatedCharacter, { silent: true });
        }, 100);
      }
      setShowItemModal(false);

      const message = specialContents.length > 0
        ? `Added ${itemName} with ${specialContents.length} items inside!`
        : `Added custom item: ${itemName}`;

      setOperationResult({
        success: true,
        message
      });

    } catch (error) {
      console.error('Error adding custom item:', error);
      setOperationResult({
        success: false,
        message: 'Failed to add custom item'
      });
    }
  }, [character, normalizedInventory, addItemsToInventory, onUpdate, onSave]);

  // Enhanced item deletion
  const handleConfirmDelete = useCallback(() => {
    if (!itemToDelete) return;

    try {
      const { index } = itemToDelete;
      const itemToRemove = normalizedInventory[index];

      let updatedCharacter = { ...character };

      // Remove from inventory
      updatedCharacter.inventory = normalizedInventory.filter((_, i) => i !== index);

      // Remove from weapons if applicable
      updatedCharacter.weapons = character.weapons.map(weapon =>
        weapon.name === itemToRemove.name
          ? { name: '', atkBonus: '', damage: '', notes: '' }
          : weapon
      );

      // Remove from actions if applicable
      updatedCharacter.actions = character.actions.map(action =>
        action.name === itemToRemove.name
          ? { name: '', atkBonus: '', damage: '' }
          : action
      );

      // Recalculate AC
      updatedCharacter.armorClass = EquipmentValidator.calculateArmorClass(updatedCharacter);

      onUpdate(updatedCharacter);

      // Auto-save the changes
      if (onSave) {
        setTimeout(() => {
          onSave(updatedCharacter, { silent: true });
        }, 100);
      }

      setOperationResult({
        success: true,
        message: `Removed ${itemToRemove.name} from inventory`
      });

    } catch (error) {
      console.error('Error deleting item:', error);
      setOperationResult({
        success: false,
        message: 'Failed to remove item from inventory'
      });
    } finally {
      setShowDeleteConfirmation(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, normalizedInventory, character, onUpdate, onSave]);

  // Quantity management
  const handleQuantityChange = useCallback((index: number, newQuantity: number) => {
    if (newQuantity < 0) return;

    try {
      const updatedInventory = normalizedInventory.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, newQuantity) } : item
      );

      const updatedCharacter = {
        ...character,
        inventory: updatedInventory
      };

      onUpdate(updatedCharacter);

      // Auto-save the changes
      if (onSave) {
        setTimeout(() => {
          onSave(updatedCharacter, { silent: true });
        }, 100);
      }

    } catch (error) {
      console.error('Error updating quantity:', error);
      setOperationResult({
        success: false,
        message: 'Failed to update item quantity'
      });
    }
  }, [normalizedInventory, character, onUpdate, onSave]);

  // Toggle equip/unequip
  const handleToggleEquip = useCallback((index: number) => {
    const item = normalizedInventory[index];
    if (!item) return;

    try {
      const newEquippedState = !item.equipped;
      let updatedInventory = normalizedInventory.map((invItem, i) =>
        i === index ? { ...invItem, equipped: newEquippedState } : invItem
      );

      let updatedCharacter = {
        ...character,
        inventory: updatedInventory
      };

      // Update equipped items tracking
      if (newEquippedState) {
        if (item.name.toLowerCase().includes('shield')) {
          // Unequip any existing shield first
          if (updatedCharacter.equippedShield) {
            updatedInventory = updatedInventory.map(invItem =>
              invItem.name.toLowerCase().includes('shield') && invItem.equipped && invItem.id !== item.id
                ? { ...invItem, equipped: false }
                : invItem
            );
          }
          updatedCharacter.equippedShield = { ...item, equipped: true };
        } else if (isArmorByName(item.name)) {
          // Unequip any existing armor first
          if (updatedCharacter.equippedArmor) {
            updatedInventory = updatedInventory.map(invItem =>
              invItem.equipped && isArmorByName(invItem.name) && invItem.id !== item.id
                ? { ...invItem, equipped: false }
                : invItem
            );
          }
          updatedCharacter.equippedArmor = { ...item, equipped: true };
        } else if (EquipmentValidator.isWeapon({ name: item.name } as Item)) {
          updatedCharacter.equippedWeapons = [...character.equippedWeapons, { ...item, equipped: true }];
        }
      } else {
        if (item.name.toLowerCase().includes('shield')) {
          delete updatedCharacter.equippedShield;
        } else if (isArmorByName(item.name)) {
          delete updatedCharacter.equippedArmor;
        } else {
          updatedCharacter.equippedWeapons = character.equippedWeapons.filter(w => w.id !== item.id);
        }
      }

      // Update inventory with any equipment changes
      updatedCharacter.inventory = updatedInventory;

      // Recalculate AC
      updatedCharacter.armorClass = EquipmentValidator.calculateArmorClass(updatedCharacter);

      onUpdate(updatedCharacter);

      // Auto-save the changes
      if (onSave) {
        setTimeout(() => {
          onSave(updatedCharacter, { silent: true });
        }, 100);
      }

      setOperationResult({
        success: true,
        message: `${newEquippedState ? 'Equipped' : 'Unequipped'} ${item.name}`
      });

    } catch (error) {
      console.error('Error toggling equipment:', error);
      setOperationResult({
        success: false,
        message: 'Failed to update equipment status'
      });
    }
  }, [normalizedInventory, character, onUpdate, onSave]);

  // Clear operation result after a delay
  const clearOperationResult = useCallback(() => {
    setOperationResult(null);
  }, []);

  // Get inventory weight
  const getInventoryWeight = useCallback(() => {
    return normalizedInventory.reduce((total, item) => {
      // Simplified weight calculation
      const estimatedWeight = item.name.toLowerCase().includes('armor') ? 30 :
                              item.name.toLowerCase().includes('shield') ? 6 :
                              item.name.toLowerCase().includes('sword') ? 3 : 1;
      return total + (estimatedWeight * item.quantity);
    }, 0);
  }, [normalizedInventory]);

  return {
    // State
    showItemModal,
    setShowItemModal,
    itemModalType,
    showItemDetails,
    setShowItemDetails,
    selectedItemForDetails,
    showDeleteConfirmation,
    itemToDelete,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    operationResult,
    normalizedInventory,

    // Legacy compatibility
    localInventory: normalizedInventory,
    pendingInventoryChanges: false,

    // Handlers
    handleAddOfficialItem: () => {
      setItemModalType('official');
      setShowItemModal(true);
      setSearchTerm('');
      setSearchResults([]);
    },
    handleAddCustomItem: () => {
      setItemModalType('custom');
      setShowItemModal(true);
    },
    handleItemSearch,
    handleItemSelect,
    handleCustomItemAdd,
    handleShowItemDetails: (item: Item) => {
      setSelectedItemForDetails(item);
      setShowItemDetails(true);
    },
    handleDeleteItemClick: (index: number) => {
      const item = normalizedInventory[index];
      if (item && item.name.trim()) {
        setItemToDelete({ index, itemName: item.name });
        setShowDeleteConfirmation(true);
      }
    },
    handleConfirmDelete,
    handleCancelDelete: () => {
      setShowDeleteConfirmation(false);
      setItemToDelete(null);
    },
    handleInventoryItemClick: async (itemName: string) => {
      if (!itemName?.trim()) return;

      try {
        const response = await itemService.search(itemName, 10);
        if (response.data?.items) {
          let foundItem = response.data.items.find(item =>
            item.name.toLowerCase() === itemName.toLowerCase()
          );

          if (!foundItem) {
            foundItem = response.data.items.find(item =>
              item.name.toLowerCase().includes(itemName.toLowerCase()) ||
              itemName.toLowerCase().includes(item.name.toLowerCase())
            );
          }

          if (foundItem) {
            setSelectedItemForDetails(foundItem);
            setShowItemDetails(true);
          }
        }
      } catch (error) {
        console.error('Error looking up item details:', error);
      }
    },
    handleQuantityChange,
    handleToggleEquip,
    handleSaveInventory: async () => {
      // For now, just call the save function if provided
      if (onSave) {
        await onSave(character, { silent: true });
      }
    },

    // Utilities
    isItemInInventory: (itemName: string) => {
      return normalizedInventory.some(item =>
        item.name && item.name.toLowerCase() === itemName.toLowerCase()
      );
    },
    getEquippedItems: () => normalizedInventory.filter(item => item.equipped),
    getInventoryWeight,
    clearOperationResult,
    migrateInventory,
  };
};