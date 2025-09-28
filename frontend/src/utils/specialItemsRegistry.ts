import { InventoryItem } from '../types/characterSheet';

interface SpecialItemDefinition {
  name: string;
  contents: InventoryItem[];
  description?: string;
  conditions?: (character: any) => boolean; // Optional conditions for when the item can be used
}

export class SpecialItemsRegistry {
  private static specialItems: Map<string, SpecialItemDefinition> = new Map();

  static {
    // Initialize with predefined special items
    this.registerSpecialItems();
  }

  /**
   * Register a special item that contains other items
   */
  static registerSpecialItem(definition: SpecialItemDefinition): void {
    const normalizedName = definition.name.toLowerCase().trim();
    this.specialItems.set(normalizedName, definition);
  }

  /**
   * Get the contents of a special item
   */
  static getItemContents(itemName: string): InventoryItem[] {
    const normalizedName = itemName.toLowerCase().trim();
    const specialItem = this.specialItems.get(normalizedName);
    return specialItem ? [...specialItem.contents] : [];
  }

  /**
   * Check if an item is a special item
   */
  static isSpecialItem(itemName: string): boolean {
    const normalizedName = itemName.toLowerCase().trim();
    return this.specialItems.has(normalizedName);
  }

  /**
   * Get all registered special items
   */
  static getAllSpecialItems(): SpecialItemDefinition[] {
    return Array.from(this.specialItems.values());
  }

  /**
   * Register predefined special items
   */
  private static registerSpecialItems(): void {
    // Vanya's Haversack - Enhanced adventuring pack
    this.registerSpecialItem({
      name: "vanya's haversack",
      description: "A magical haversack containing essential adventuring gear",
      contents: [
        { id: 'rope-hempen', name: "Rope, Hempen (50 feet)", quantity: 1, equipped: false, attuned: false },
        { id: 'bedroll', name: "Bedroll", quantity: 1, equipped: false, attuned: false },
        { id: 'mess-kit', name: "Mess Kit", quantity: 1, equipped: false, attuned: false },
        { id: 'tinderbox', name: "Tinderbox", quantity: 1, equipped: false, attuned: false },
        { id: 'torch', name: "Torch", quantity: 10, equipped: false, attuned: false },
        { id: 'rations', name: "Rations (1 day)", quantity: 10, equipped: false, attuned: false },
        { id: 'waterskin', name: "Waterskin", quantity: 1, equipped: false, attuned: false },
        { id: 'clothes-common', name: "Clothes, Common", quantity: 1, equipped: false, attuned: false },
        { id: 'belt-pouch', name: "Belt Pouch", quantity: 1, equipped: false, attuned: false },
        { id: 'blanket', name: "Blanket", quantity: 1, equipped: false, attuned: false },
        { id: 'candle', name: "Candle", quantity: 10, equipped: false, attuned: false },
        { id: 'chain', name: "Chain (10 feet)", quantity: 1, equipped: false, attuned: false },
        { id: 'chalk', name: "Chalk (1 piece)", quantity: 10, equipped: false, attuned: false },
        { id: 'crowbar', name: "Crowbar", quantity: 1, equipped: false, attuned: false },
        { id: 'hammer', name: "Hammer", quantity: 1, equipped: false, attuned: false },
        { id: 'piton', name: "Piton", quantity: 10, equipped: false, attuned: false },
        { id: 'shovel', name: "Shovel", quantity: 1, equipped: false, attuned: false },
        { id: 'tent', name: "Two-person Tent", quantity: 1, equipped: false, attuned: false },
        { id: 'whetstone', name: "Whetstone", quantity: 1, equipped: false, attuned: false }
      ]
    });

    // Explorer's Pack
    this.registerSpecialItem({
      name: "explorer's pack",
      description: "A complete adventuring pack for exploration",
      contents: [
        { id: 'backpack', name: "Backpack", quantity: 1, equipped: false, attuned: false },
        { id: 'bedroll', name: "Bedroll", quantity: 1, equipped: false, attuned: false },
        { id: 'mess-kit', name: "Mess Kit", quantity: 1, equipped: false, attuned: false },
        { id: 'tinderbox', name: "Tinderbox", quantity: 1, equipped: false, attuned: false },
        { id: 'torch', name: "Torch", quantity: 10, equipped: false, attuned: false },
        { id: 'rations', name: "Rations (1 day)", quantity: 10, equipped: false, attuned: false },
        { id: 'waterskin', name: "Waterskin", quantity: 1, equipped: false, attuned: false },
        { id: 'rope-hempen', name: "Rope, Hempen (50 feet)", quantity: 1, equipped: false, attuned: false }
      ]
    });

    // Dungeoneer's Pack
    this.registerSpecialItem({
      name: "dungeoneer's pack",
      description: "Essential gear for dungeon exploration",
      contents: [
        { id: 'backpack', name: "Backpack", quantity: 1, equipped: false, attuned: false },
        { id: 'crowbar', name: "Crowbar", quantity: 1, equipped: false, attuned: false },
        { id: 'hammer', name: "Hammer", quantity: 1, equipped: false, attuned: false },
        { id: 'piton', name: "Piton", quantity: 10, equipped: false, attuned: false },
        { id: 'torch', name: "Torch", quantity: 10, equipped: false, attuned: false },
        { id: 'tinderbox', name: "Tinderbox", quantity: 1, equipped: false, attuned: false },
        { id: 'rations', name: "Rations (1 day)", quantity: 10, equipped: false, attuned: false },
        { id: 'waterskin', name: "Waterskin", quantity: 1, equipped: false, attuned: false },
        { id: 'rope-hempen', name: "Rope, Hempen (50 feet)", quantity: 1, equipped: false, attuned: false }
      ]
    });

    // Entertainer's Pack
    this.registerSpecialItem({
      name: "entertainer's pack",
      description: "Performance gear and travel supplies",
      contents: [
        { id: 'backpack', name: "Backpack", quantity: 1, equipped: false, attuned: false },
        { id: 'bedroll', name: "Bedroll", quantity: 1, equipped: false, attuned: false },
        { id: 'costume-clothes', name: "Costume Clothes", quantity: 2, equipped: false, attuned: false },
        { id: 'candle', name: "Candle", quantity: 5, equipped: false, attuned: false },
        { id: 'rations', name: "Rations (1 day)", quantity: 5, equipped: false, attuned: false },
        { id: 'waterskin', name: "Waterskin", quantity: 1, equipped: false, attuned: false },
        { id: 'disguise-kit', name: "Disguise Kit", quantity: 1, equipped: false, attuned: false }
      ]
    });

    // Priest's Pack
    this.registerSpecialItem({
      name: "priest's pack",
      description: "Religious supplies and travel gear",
      contents: [
        { id: 'backpack', name: "Backpack", quantity: 1, equipped: false, attuned: false },
        { id: 'blanket', name: "Blanket", quantity: 1, equipped: false, attuned: false },
        { id: 'candle', name: "Candle", quantity: 10, equipped: false, attuned: false },
        { id: 'tinderbox', name: "Tinderbox", quantity: 1, equipped: false, attuned: false },
        { id: 'alms-box', name: "Alms Box", quantity: 1, equipped: false, attuned: false },
        { id: 'incense', name: "Incense", quantity: 2, equipped: false, attuned: false },
        { id: 'censer', name: "Censer", quantity: 1, equipped: false, attuned: false },
        { id: 'vestments', name: "Vestments", quantity: 1, equipped: false, attuned: false },
        { id: 'rations', name: "Rations (1 day)", quantity: 2, equipped: false, attuned: false },
        { id: 'waterskin', name: "Waterskin", quantity: 1, equipped: false, attuned: false }
      ]
    });

    // Scholar's Pack
    this.registerSpecialItem({
      name: "scholar's pack",
      description: "Academic supplies and study materials",
      contents: [
        { id: 'backpack', name: "Backpack", quantity: 1, equipped: false, attuned: false },
        { id: 'book-lore', name: "Book of Lore", quantity: 1, equipped: false, attuned: false },
        { id: 'ink', name: "Ink (1 ounce bottle)", quantity: 1, equipped: false, attuned: false },
        { id: 'ink-pen', name: "Ink Pen", quantity: 1, equipped: false, attuned: false },
        { id: 'parchment', name: "Parchment", quantity: 10, equipped: false, attuned: false },
        { id: 'sand-bag', name: "Little Bag of Sand", quantity: 1, equipped: false, attuned: false },
        { id: 'knife-small', name: "Small Knife", quantity: 1, equipped: false, attuned: false }
      ]
    });

    // Custom items for your homebrew setting
    this.registerSpecialItem({
      name: "nimble adventurer's kit",
      description: "A specialized kit for nimble RPG adventures",
      contents: [
        { id: 'grappling-hook', name: "Grappling Hook", quantity: 1, equipped: false, attuned: false },
        { id: 'silk-rope', name: "Silk Rope (50 feet)", quantity: 1, equipped: false, attuned: false },
        { id: 'lockpicks', name: "Thieves' Tools", quantity: 1, equipped: false, attuned: false },
        { id: 'spyglass', name: "Spyglass", quantity: 1, equipped: false, attuned: false },
        { id: 'caltrops', name: "Caltrops", quantity: 1, equipped: false, attuned: false }
      ]
    });
  }

  /**
   * Add custom special items from external configuration
   */
  static loadCustomSpecialItems(customItems: SpecialItemDefinition[]): void {
    customItems.forEach(item => this.registerSpecialItem(item));
  }

  /**
   * Remove a special item from the registry
   */
  static unregisterSpecialItem(itemName: string): boolean {
    const normalizedName = itemName.toLowerCase().trim();
    return this.specialItems.delete(normalizedName);
  }

  /**
   * Check if an item name matches any registered special item (fuzzy matching)
   */
  static findSpecialItemByName(itemName: string): SpecialItemDefinition | null {
    const normalizedName = itemName.toLowerCase().trim();

    // Exact match first
    let specialItem = this.specialItems.get(normalizedName);
    if (specialItem) return specialItem;

    // Fuzzy matching - check if the item name contains any special item name
    for (const [registeredName, definition] of this.specialItems) {
      if (normalizedName.includes(registeredName) || registeredName.includes(normalizedName)) {
        return definition;
      }
    }

    return null;
  }
}