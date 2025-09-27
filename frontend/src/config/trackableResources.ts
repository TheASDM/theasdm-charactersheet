export interface TrackerConfig {
  name: string;
  maxUses?: number | ((level: number, modifier?: number) => number);
  resetOn: 'short' | 'long' | 'encounter';
  type: 'checkbox' | 'counter' | 'pool';
  showAt?: number; // Character level when this becomes available
}

export interface ResourceTrackers {
  [key: string]: TrackerConfig[];
}

// Class-based resources
export const classResources: ResourceTrackers = {
  // BARBARIAN
  barbarian: [
    {
      name: 'Rage',
      maxUses: (level) => {
        if (level < 3) return 2;
        if (level < 6) return 3;
        if (level < 12) return 4;
        if (level < 17) return 5;
        if (level < 20) return 6;
        return Infinity; // Unlimited at level 20
      },
      resetOn: 'long',
      type: 'counter',
    },
  ],

  // BARD
  bard: [
    {
      name: 'Bardic Inspiration',
      maxUses: (_level, charismaModifier) => Math.max(1, charismaModifier || 1),
      resetOn: 'short', // Short rest at level 5+, long rest before
      type: 'counter',
    },
  ],

  // CLERIC
  cleric: [
    {
      name: 'Channel Divinity',
      maxUses: (level) => (level >= 11 ? 3 : 2),
      resetOn: 'short',
      type: 'counter',
    },
    {
      name: 'Divine Intervention',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 10,
    },
  ],

  // DRUID
  druid: [
    {
      name: 'Wild Shape',
      maxUses: (level) => {
        if (level < 2) return 0;
        if (level < 4) return 2;
        if (level < 8) return 3;
        if (level < 12) return 4;
        if (level < 16) return 5;
        return 6;
      },
      resetOn: 'short',
      type: 'counter',
      showAt: 2,
    },
  ],

  // FIGHTER
  fighter: [
    {
      name: 'Second Wind',
      maxUses: (level) => {
        if (level < 4) return 1;
        if (level < 8) return 2;
        return 3;
      },
      resetOn: 'short',
      type: 'counter',
    },
    {
      name: 'Action Surge',
      maxUses: (level) => (level >= 17 ? 2 : 1),
      resetOn: 'short',
      type: 'counter',
      showAt: 2,
    },
    {
      name: 'Indomitable',
      maxUses: (level) => {
        if (level < 9) return 0;
        if (level < 13) return 1;
        if (level < 17) return 2;
        return 3;
      },
      resetOn: 'long',
      type: 'counter',
      showAt: 9,
    },
  ],

  // MONK
  monk: [
    {
      name: 'Focus Points',
      maxUses: (level) => level >= 2 ? level : 0,
      resetOn: 'short',
      type: 'pool',
      showAt: 2,
    },
    {
      name: 'Uncanny Metabolism',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 15,
    },
  ],

  // PALADIN
  paladin: [
    {
      name: 'Lay on Hands',
      maxUses: (level) => level * 5,
      resetOn: 'long',
      type: 'pool',
    },
    {
      name: 'Channel Divinity',
      maxUses: (level) => (level >= 11 ? 3 : 2),
      resetOn: 'short',
      type: 'counter',
      showAt: 3,
    },
    {
      name: "Paladin's Smite",
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 2,
    },
  ],

  // RANGER
  ranger: [
    {
      name: "Hunter's Mark",
      maxUses: (level) => {
        if (level < 6) return 2;
        if (level < 11) return 3;
        if (level < 17) return 4;
        return 5;
      },
      resetOn: 'long',
      type: 'counter',
    },
    {
      name: 'Tireless',
      maxUses: (_level, wisdomModifier) => wisdomModifier || 0,
      resetOn: 'long',
      type: 'counter',
      showAt: 10,
    },
    {
      name: "Nature's Veil",
      maxUses: (_level, wisdomModifier) => wisdomModifier || 0,
      resetOn: 'long',
      type: 'counter',
      showAt: 14,
    },
  ],

  // ROGUE
  rogue: [], // Base rogue has no trackable resources

  // SORCERER
  sorcerer: [
    {
      name: 'Sorcery Points',
      maxUses: (level) => level >= 2 ? level : 0,
      resetOn: 'long',
      type: 'pool',
      showAt: 2,
    },
    {
      name: 'Innate Sorcery',
      maxUses: 2,
      resetOn: 'long',
      type: 'counter',
      showAt: 1,
    },
  ],

  // WARLOCK
  warlock: [
    {
      name: 'Pact Slots',
      maxUses: (level) => {
        if (level === 1) return 1;
        if (level < 11) return 2;
        if (level < 17) return 3;
        return 4;
      },
      resetOn: 'short',
      type: 'counter',
    },
    {
      name: 'Magical Cunning',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 14,
    },
    {
      name: 'Contact Patron',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 9,
    },
  ],

  // WIZARD
  wizard: [
    {
      name: 'Arcane Recovery',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
    },
  ],
};

// Subclass-specific resources
export const subclassResources: ResourceTrackers = {
  // BARBARIAN SUBCLASSES
  'barbarian-zealot': [
    {
      name: 'Warrior of the Gods',
      maxUses: (level) => {
        if (level < 6) return 4;
        if (level < 10) return 5;
        if (level < 14) return 6;
        return 7;
      },
      resetOn: 'long',
      type: 'pool',
      showAt: 3,
    },
    {
      name: 'Zealous Presence',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 10,
    },
  ],

  // FIGHTER SUBCLASSES
  'fighter-battlemaster': [
    {
      name: 'Superiority Dice',
      maxUses: (level) => {
        if (level < 7) return 4;
        if (level < 15) return 5;
        return 6;
      },
      resetOn: 'short',
      type: 'counter',
      showAt: 3,
    },
    {
      name: 'Know Your Enemy',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 7,
    },
  ],
  'fighter-psiwarrior': [
    {
      name: 'Psionic Energy',
      maxUses: (level) => Math.ceil((level - 2) / 2) + 2, // Scales with level
      resetOn: 'short',
      type: 'pool',
      showAt: 3,
    },
  ],

  // WARLOCK PATRONS
  'warlock-fiend': [
    {
      name: "Dark One's Own Luck",
      maxUses: (_level, charismaModifier) => charismaModifier || 0,
      resetOn: 'long',
      type: 'counter',
      showAt: 6,
    },
    {
      name: 'Hurl Through Hell',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 14,
    },
  ],
  'warlock-celestial': [
    {
      name: 'Healing Light',
      maxUses: (level) => 1 + level,
      resetOn: 'long',
      type: 'pool',
      showAt: 1,
    },
    {
      name: 'Searing Vengeance',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 14,
    },
  ],

  // Add more subclasses as needed
};

// Species-based resources
export const speciesResources: ResourceTrackers = {
  aasimar: [
    {
      name: 'Healing Hands',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
    },
    {
      name: 'Celestial Revelation',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 3,
    },
  ],
  dragonborn: [
    {
      name: 'Breath Weapon',
      maxUses: (level) => Math.ceil(level / 4) + 1, // Proficiency bonus
      resetOn: 'long',
      type: 'counter',
    },
    {
      name: 'Draconic Flight',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 5,
    },
  ],
  dwarf: [
    {
      name: 'Stonecunning',
      maxUses: (level) => Math.ceil(level / 4) + 1, // Proficiency bonus
      resetOn: 'long',
      type: 'counter',
    },
  ],
  elf: [], // Varies by subrace
  'elf-drow': [
    {
      name: 'Faerie Fire',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 3,
    },
    {
      name: 'Darkness',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 5,
    },
  ],
  'elf-high': [
    {
      name: 'Detect Magic',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 3,
    },
    {
      name: 'Misty Step',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 5,
    },
  ],
  goliath: [
    {
      name: 'Giant Ancestry',
      maxUses: (level) => Math.ceil(level / 4) + 1, // Proficiency bonus
      resetOn: 'long',
      type: 'counter',
    },
    {
      name: 'Large Form',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 5,
    },
  ],
  orc: [
    {
      name: 'Adrenaline Rush',
      maxUses: (level) => Math.ceil(level / 4) + 1, // Proficiency bonus
      resetOn: 'short',
      type: 'counter',
    },
    {
      name: 'Relentless Endurance',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
    },
  ],
  tiefling: [], // Varies by legacy
  'tiefling-infernal': [
    {
      name: 'Hellish Rebuke',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 3,
    },
    {
      name: 'Darkness',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
      showAt: 5,
    },
  ],
};

// Feat-based resources
export const featResources: ResourceTrackers = {
  lucky: [
    {
      name: 'Luck Points',
      maxUses: (level) => Math.ceil(level / 4) + 1, // Proficiency bonus
      resetOn: 'long',
      type: 'counter',
    },
  ],
  'fey-touched': [
    {
      name: 'Fey Magic',
      maxUses: 2, // One for each spell
      resetOn: 'long',
      type: 'counter',
    },
  ],
  'shadow-touched': [
    {
      name: 'Shadow Magic',
      maxUses: 2, // One for each spell
      resetOn: 'long',
      type: 'counter',
    },
  ],
  telepathic: [
    {
      name: 'Detect Thoughts',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
    },
  ],
  'magic-initiate': [
    {
      name: 'Magic Initiate Spell',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
    },
  ],
  'guarded-mind': [
    {
      name: 'Guarded Mind',
      maxUses: 1,
      resetOn: 'short',
      type: 'checkbox',
    },
  ],
  'boon-of-energy-resistance': [
    {
      name: 'Energy Redirection',
      maxUses: 1,
      resetOn: 'encounter',
      type: 'checkbox',
    },
  ],
  'boon-of-fate': [
    {
      name: 'Improve Fate',
      maxUses: 1,
      resetOn: 'encounter',
      type: 'checkbox',
    },
  ],
  'boon-of-recovery': [
    {
      name: 'Last Stand',
      maxUses: 1,
      resetOn: 'long',
      type: 'checkbox',
    },
    {
      name: 'Recover Vitality',
      maxUses: 10, // 10d10 pool
      resetOn: 'long',
      type: 'pool',
    },
  ],
};

// Always present tracker
export const coreTrackers: TrackerConfig[] = [
  {
    name: 'Wounds',
    maxUses: 6,
    resetOn: 'long',
    type: 'counter',
  },
];