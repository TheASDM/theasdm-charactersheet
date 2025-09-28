import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { classOptions } from '../../constants/characterOptions';
import { CLASS_SKILLS, CLASS_SKILL_CHOICES } from '../../services/classService';
import { ClassDetailsModal } from '../ui/ClassDetailsModal';

// Complete list of all D&D skills for classes that can choose "any" skill
const ALL_SKILLS = [
  'Acrobatics',
  'Animal Handling',
  'Arcana',
  'Athletics',
  'Deception',
  'History',
  'Insight',
  'Intimidation',
  'Investigation',
  'Medicine',
  'Nature',
  'Perception',
  'Performance',
  'Persuasion',
  'Religion',
  'Sleight of Hand',
  'Stealth',
  'Survival',
];

interface Step2ClassSelectionProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

const ClassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const ClassCard = styled.div<{ selected: boolean }>`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid ${(props) => (props.selected ? '#d4af37' : '#444')};
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  ${(props) =>
    props.selected &&
    `
    background: rgba(212, 175, 55, 0.1);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
  `}
`;

const ClassName = styled.h3`
  color: #d4af37;
  margin: 0 0 0.5rem 0;
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  text-align: center;
`;

const ClassDescription = styled.p`
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 1rem 0;
  text-align: center;
`;

const ClassFeatures = styled.div`
  .feature-title {
    color: #d4af37;
    font-weight: 600;
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
  }

  .feature-list {
    color: #aaa;
    font-size: 0.8rem;
    line-height: 1.3;
  }
`;

const SelectedIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  background: #d4af37;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a1a;
  font-weight: bold;
  font-size: 14px;
`;

const SkillSelectionContainer = styled.div`
  margin-top: 2rem;
`;

const SkillGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;
`;

const SkillOption = styled.div<{ selected: boolean; disabled?: boolean }>`
  padding: 0.75rem 1rem;
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid ${(props) => (props.selected ? '#d4af37' : '#444')};
  border-radius: 6px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.3s ease;
  text-align: center;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  &:hover {
    ${(props) =>
      !props.disabled &&
      `
      border-color: #d4af37;
      transform: translateY(-1px);
    `}
  }

  ${(props) =>
    props.selected &&
    `
    background: rgba(212, 175, 55, 0.1);
    color: #d4af37;
  `}
`;

const ClassStepNavigation = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
`;

const StepButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${(props) =>
    props.active ? '#d4af37' : 'rgba(26, 26, 26, 0.8)'};
  color: ${(props) => (props.active ? '#1a1a1a' : '#ccc')};
  border: 2px solid ${(props) => (props.active ? '#d4af37' : '#444')};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;

  &:hover {
    border-color: #d4af37;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;


const ClassSelectionInfo = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;

  h4 {
    color: #d4af37;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: #ccc;
    margin: 0;
    font-size: 0.9rem;
  }
`;

// Class descriptions and features for 2024 PHB
const CLASS_DATA = {
  Barbarian: {
    description: 'A fierce warrior driven by primal instincts and rage.',
    hitDie: 12,
    primaryAbility: 'Strength',
    savingThrows: 'Strength, Constitution',
    features: ['Rage', 'Unarmored Defense'],
    proficiencies: {
      armor: 'Light armor, medium armor, shields',
      weapons: 'Simple weapons, martial weapons',
      tools: 'None',
      savingThrows: 'Strength, Constitution',
      skills:
        'Choose 2 from Animal Handling, Athletics, Intimidation, Nature, Perception, Survival',
    },
    classFeatures: {
      Rage: {
        description:
          'In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action.',
        details:
          'While raging, you gain +2 damage to melee attacks using Strength, resistance to bludgeoning, piercing, and slashing damage, and advantage on Strength checks and saves. You cannot cast spells while raging.',
      },
      'Unarmored Defense': {
        description:
          'While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier.',
        details: 'You can use a shield and still gain this benefit.',
      },
    },
    choices: {},
  },
  Bard: {
    description: 'A master of song, speech, and the magic they contain.',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrows: 'Dexterity, Charisma',
    features: ['Bardic Inspiration', 'Spellcasting'],
    proficiencies: {
      armor: 'Light armor',
      weapons:
        'Simple weapons, hand crossbows, longswords, rapiers, shortswords',
      tools: 'Three musical instruments of your choice',
      savingThrows: 'Dexterity, Charisma',
      skills: 'Choose any 3',
    },
    classFeatures: {
      'Bardic Inspiration': {
        description: 'You can inspire others through stirring words or music.',
        details:
          'As a bonus action, choose one creature within 60 feet who can hear you. That creature gains one Bardic Inspiration die (d6). Once within the next 10 minutes, the creature can roll the die and add the number rolled to one ability check, attack roll, or saving throw.',
      },
      Spellcasting: {
        description:
          'You have learned to untangle and reshape the fabric of reality through music and poetry.',
        details:
          'You know 2 cantrips and 4 first-level spells from the bard spell list. Charisma is your spellcasting ability.',
      },
    },
    choices: {},
  },
  Cleric: {
    description:
      'A priestly champion who wields divine magic in service of a deity.',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrows: 'Wisdom, Charisma',
    features: ['Divine Order', 'Spellcasting'],
    proficiencies: {
      armor: 'Light armor, medium armor, shields',
      weapons: 'Simple weapons',
      tools: 'None',
      savingThrows: 'Wisdom, Charisma',
      skills: 'Choose 2 from History, Insight, Medicine, Persuasion, Religion',
    },
    classFeatures: {
      'Divine Order': {
        description:
          'You have dedicated yourself to one of the following sacred roles of service.',
        details:
          'Choose one option that determines additional proficiencies and features you gain.',
      },
      Spellcasting: {
        description:
          'As a conduit for divine power, you can cast cleric spells.',
        details:
          'You know 3 cantrips and can prepare 3 first-level spells from the cleric spell list. Wisdom is your spellcasting ability.',
      },
    },
    choices: {
      'Divine Order': {
        description: 'Choose your sacred role of service:',
        options: [
          {
            name: 'Protector',
            description:
              'Trained for battle, you gain proficiency with martial weapons and Heavy Armor.',
          },
          {
            name: 'Thaumaturge',
            description:
              'Keeper of divine magic, you know one additional cantrip from the Cleric spell list and gain the Blessed Strikes feature at 5th level instead of 8th.',
          },
        ],
      },
    },
  },
  Druid: {
    description:
      'A priest of nature, wielding elemental forces and wild shapes.',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrows: 'Intelligence, Wisdom',
    features: ['Druidcraft', 'Spellcasting'],
    proficiencies: {
      armor: 'Light armor, medium armor, shields (non-metal)',
      weapons:
        'Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears',
      tools: 'Herbalism kit',
      savingThrows: 'Intelligence, Wisdom',
      skills:
        'Choose 2 from Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, Survival',
    },
    classFeatures: {
      Druidcraft: {
        description: 'You know the Druidcraft cantrip.',
        details:
          'This cantrip allows you to create minor magical effects related to nature.',
      },
      Spellcasting: {
        description:
          'Drawing on the divine essence of nature itself, you can cast spells to shape that essence to your will.',
        details:
          'You know 2 cantrips and can prepare 3 first-level spells from the druid spell list. Wisdom is your spellcasting ability.',
      },
    },
    choices: {
      'Primal Order': {
        description: 'Choose your connection to the natural world:',
        options: [
          {
            name: 'Magician',
            description: 'You know one additional cantrip from the Druid spell list. You also gain the Ritual Caster feat.',
          },
          {
            name: 'Warden',
            description: 'You gain proficiency with Martial Weapons and training with Shields. Your spell save DC increases by 1 while you\'re using a Shield.',
          },
        ],
      },
    },
  },
  Fighter: {
    description:
      'A master of martial combat, skilled with a variety of weapons.',
    hitDie: 10,
    primaryAbility: 'Strength or Dexterity',
    savingThrows: 'Strength, Constitution',
    features: ['Fighting Style', 'Second Wind'],
    proficiencies: {
      armor: 'All armor, shields',
      weapons: 'Simple weapons, martial weapons',
      tools: 'None',
      savingThrows: 'Strength, Constitution',
      skills:
        'Choose 2 from Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Perception, Survival',
    },
    classFeatures: {
      'Fighting Style': {
        description:
          'You adopt a particular style of fighting as your specialty.',
        details: 'Choose one option that grants you specific combat benefits.',
      },
      'Second Wind': {
        description:
          'You have a limited well of stamina that you can draw on to protect yourself from harm.',
        details:
          'On your turn, you can use a bonus action to regain 1d10 + your fighter level hit points. Once you use this feature, you must finish a short or long rest before you can use it again.',
      },
    },
    choices: {
      'Fighting Style': {
        description: 'Choose your fighting style:',
        options: [
          {
            name: 'Archery',
            description: '+2 bonus to attack rolls with ranged weapons.',
          },
          {
            name: 'Defense',
            description: '+1 bonus to AC while wearing armor.',
          },
          {
            name: 'Dueling',
            description:
              '+2 damage bonus when wielding a one-handed melee weapon with no other weapon.',
          },
          {
            name: 'Great Weapon Fighting',
            description:
              'Reroll 1s and 2s on damage dice with two-handed melee weapons.',
          },
          {
            name: 'Protection',
            description:
              'Use your reaction to impose disadvantage on an attack against a nearby ally (requires shield).',
          },
          {
            name: 'Two-Weapon Fighting',
            description:
              'Add your ability modifier to damage of your second attack when fighting with two weapons.',
          },
        ],
      },
    },
  },
  Monk: {
    description: 'A master of martial arts, harnessing inner power called ki.',
    hitDie: 8,
    primaryAbility: 'Dexterity, Wisdom',
    savingThrows: 'Strength, Dexterity',
    features: ['Martial Arts', 'Unarmored Defense'],
    proficiencies: {
      armor: 'None',
      weapons: 'Simple weapons, shortswords',
      tools: 'Choose one artisan tool or musical instrument',
      savingThrows: 'Strength, Dexterity',
      skills:
        'Choose 2 from Acrobatics, Athletics, History, Insight, Religion, Stealth',
    },
    classFeatures: {
      'Martial Arts': {
        description:
          'Your practice of martial arts gives you mastery of combat styles that use unarmed strikes and monk weapons.',
        details:
          'You can use Dexterity instead of Strength for attack and damage rolls with unarmed strikes and monk weapons. You can roll a d4 for damage instead of normal damage for unarmed strikes and monk weapons. When you use the Attack action with an unarmed strike or monk weapon, you can make one unarmed strike as a bonus action.',
      },
      'Unarmored Defense': {
        description:
          'While you are wearing no armor and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom modifier.',
        details:
          'This defense reflects your ability to dodge attacks through speed and intuition.',
      },
    },
    choices: {},
  },
  Paladin: {
    description:
      'A holy warrior bound to a sacred oath of justice and righteousness.',
    hitDie: 10,
    primaryAbility: 'Strength, Charisma',
    savingThrows: 'Wisdom, Charisma',
    features: ['Divine Sense', 'Lay on Hands'],
    proficiencies: {
      armor: 'All armor, shields',
      weapons: 'Simple weapons, martial weapons',
      tools: 'None',
      savingThrows: 'Wisdom, Charisma',
      skills:
        'Choose 2 from Athletics, Insight, Intimidation, Medicine, Persuasion, Religion',
    },
    classFeatures: {
      'Divine Sense': {
        description:
          'The presence of strong evil registers on your senses like a noxious odor.',
        details:
          'As an action, you can open your awareness to detect celestials, fiends, and undead within 60 feet of you that are not behind total cover. You can use this feature a number of times equal to 1 + your Charisma modifier.',
      },
      'Lay on Hands': {
        description: 'Your blessed touch can heal wounds.',
        details:
          'You have a pool of healing power that replenishes when you take a long rest. With that pool, you can restore a total number of hit points equal to your paladin level × 5.',
      },
    },
    choices: {},
  },
  Ranger: {
    description:
      'A warrior of the wilderness, skilled in tracking and survival.',
    hitDie: 10,
    primaryAbility: 'Dexterity, Wisdom',
    savingThrows: 'Strength, Dexterity',
    features: ['Favored Enemy', 'Natural Explorer'],
    proficiencies: {
      armor: 'Light armor, medium armor, shields',
      weapons: 'Simple weapons, martial weapons',
      tools: 'None',
      savingThrows: 'Strength, Dexterity',
      skills:
        'Choose 3 from Animal Handling, Athletics, Insight, Investigation, Nature, Perception, Stealth, Survival',
    },
    classFeatures: {
      'Favored Enemy': {
        description:
          'You have significant experience studying, tracking, hunting, and speaking to a certain type of creature.',
        details:
          'Choose a type of favored enemy: beasts, fey, humanoids, monstrosities, or undead. You have advantage on Wisdom (Survival) checks to track your favored enemies, as well as on Intelligence checks to recall information about them.',
      },
      'Natural Explorer': {
        description:
          'You are particularly familiar with one type of natural environment.',
        details:
          'Choose one favored terrain: forest, mountains, swamp, etc. When you make a Wisdom (Survival) check in your favored terrain, your proficiency bonus is doubled if you are using a skill you are proficient in.',
      },
    },
    choices: {
      'Favored Enemy': {
        description: 'Choose a type of creature as your favored enemy:',
        options: [
          {
            name: 'Beasts',
            description: 'You have advantage on Wisdom (Survival) checks to track Beasts, as well as on Intelligence checks to recall information about them.',
          },
          {
            name: 'Fey',
            description: 'You have advantage on Wisdom (Survival) checks to track Fey, as well as on Intelligence checks to recall information about them.',
          },
          {
            name: 'Humanoids',
            description: 'You have advantage on Wisdom (Survival) checks to track Humanoids, as well as on Intelligence checks to recall information about them.',
          },
          {
            name: 'Monstrosities',
            description: 'You have advantage on Wisdom (Survival) checks to track Monstrosities, as well as on Intelligence checks to recall information about them.',
          },
          {
            name: 'Undead',
            description: 'You have advantage on Wisdom (Survival) checks to track Undead, as well as on Intelligence checks to recall information about them.',
          },
        ],
      },
    },
  },
  Rogue: {
    description:
      'A scoundrel who uses stealth and trickery to overcome obstacles.',
    hitDie: 8,
    primaryAbility: 'Dexterity',
    savingThrows: 'Dexterity, Intelligence',
    features: ['Expertise', 'Sneak Attack'],
    proficiencies: {
      armor: 'Light armor',
      weapons:
        'Simple weapons, hand crossbows, longswords, rapiers, shortswords',
      tools: "Thieves' tools",
      savingThrows: 'Dexterity, Intelligence',
      skills:
        'Choose 4 from Acrobatics, Athletics, Deception, Insight, Intimidation, Investigation, Perception, Performance, Persuasion, Sleight of Hand, Stealth',
    },
    classFeatures: {
      Expertise: {
        description:
          "At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves' tools.",
        details:
          'Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.',
      },
      'Sneak Attack': {
        description:
          "You know how to strike subtly and exploit a foe's distraction.",
        details:
          'Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or ranged weapon.',
      },
    },
    choices: {
      'Expertise': {
        description: 'Choose 2 skills you are proficient in, or 1 skill and Thieves\' Tools, to double your proficiency bonus:',
        options: [
          {
            name: 'Acrobatics',
            description: 'Double your proficiency bonus for Acrobatics checks.',
          },
          {
            name: 'Athletics',
            description: 'Double your proficiency bonus for Athletics checks.',
          },
          {
            name: 'Deception',
            description: 'Double your proficiency bonus for Deception checks.',
          },
          {
            name: 'Insight',
            description: 'Double your proficiency bonus for Insight checks.',
          },
          {
            name: 'Intimidation',
            description: 'Double your proficiency bonus for Intimidation checks.',
          },
          {
            name: 'Investigation',
            description: 'Double your proficiency bonus for Investigation checks.',
          },
          {
            name: 'Perception',
            description: 'Double your proficiency bonus for Perception checks.',
          },
          {
            name: 'Performance',
            description: 'Double your proficiency bonus for Performance checks.',
          },
          {
            name: 'Persuasion',
            description: 'Double your proficiency bonus for Persuasion checks.',
          },
          {
            name: 'Sleight of Hand',
            description: 'Double your proficiency bonus for Sleight of Hand checks.',
          },
          {
            name: 'Stealth',
            description: 'Double your proficiency bonus for Stealth checks.',
          },
          {
            name: 'Thieves\' Tools',
            description: 'Double your proficiency bonus for Thieves\' Tools checks.',
          },
        ],
      },
    },
  },
  Sorcerer: {
    description:
      'A spellcaster who draws on inherent magic from their bloodline.',
    hitDie: 6,
    primaryAbility: 'Charisma',
    savingThrows: 'Constitution, Charisma',
    features: ['Spellcasting', 'Sorcerous Origin'],
    proficiencies: {
      armor: 'None',
      weapons: 'Daggers, darts, slings, quarterstaffs, light crossbows',
      tools: 'None',
      savingThrows: 'Constitution, Charisma',
      skills:
        'Choose 2 from Arcana, Deception, Insight, Intimidation, Persuasion, Religion',
    },
    classFeatures: {
      Spellcasting: {
        description:
          'An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic.',
        details:
          'You know 4 cantrips and 2 first-level spells from the sorcerer spell list. Charisma is your spellcasting ability.',
      },
      'Sorcerous Origin': {
        description:
          'Choose a sorcerous origin, which describes the source of your innate magical power.',
        details:
          'Your choice grants you features when you choose it at 1st level and again at 6th, 14th, and 18th level.',
      },
    },
    choices: {},
  },
  Warlock: {
    description:
      'A wielder of magic derived from a bargain with an otherworldly entity.',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrows: 'Wisdom, Charisma',
    features: ['Otherworldly Patron', 'Pact Magic'],
    proficiencies: {
      armor: 'Light armor',
      weapons: 'Simple weapons',
      tools: 'None',
      savingThrows: 'Wisdom, Charisma',
      skills:
        'Choose 2 from Arcana, Deception, History, Intimidation, Investigation, Nature, Religion',
    },
    classFeatures: {
      'Otherworldly Patron': {
        description:
          'You have struck a pact with an otherworldly being of your choice.',
        details:
          'Your choice grants you features at 1st level and again at 6th, 10th, and 14th level.',
      },
      'Pact Magic': {
        description:
          'Your arcane research and the magic bestowed on you by your patron have given you facility with spells.',
        details:
          'You know 2 cantrips and 1 first-level spell from the warlock spell list. Charisma is your spellcasting ability. You regain spell slots on a short rest.',
      },
    },
    choices: {
      'Eldritch Invocation': {
        description: 'Choose 1 Eldritch Invocation available at 1st level:',
        options: [
          {
            name: 'Pact of the Blade',
            description: 'As a Bonus Action, you can conjure a pact weapon in your hand—a simple or martial melee weapon of your choice. You are proficient with it while you wield it.',
          },
          {
            name: 'Pact of the Chain',
            description: 'You learn the Find Familiar spell and can cast it as a Ritual without a spell slot. When you cast the spell, you can choose one of the normal forms for your familiar or one of the following: Imp, Pseudodragon, Quasit, or Sprite.',
          },
          {
            name: 'Pact of the Tome',
            description: 'Your patron gives you a grimoire called a Book of Shadows. You learn 2 Cantrips of your choice from any spell list. The Cantrips count as Warlock spells for you.',
          },
          {
            name: 'Armor of Shadows',
            description: 'You can cast Mage Armor on yourself without expending a spell slot.',
          },
          {
            name: 'Eldritch Sight',
            description: 'You can cast Detect Magic without expending a spell slot.',
          },
        ],
      },
    },
  },
  Wizard: {
    description:
      'A scholarly magic-user capable of manipulating reality through study.',
    hitDie: 6,
    primaryAbility: 'Intelligence',
    savingThrows: 'Intelligence, Wisdom',
    features: ['Spellcasting', 'Arcane Recovery'],
    proficiencies: {
      armor: 'None',
      weapons: 'Daggers, darts, slings, quarterstaffs, light crossbows',
      tools: 'None',
      savingThrows: 'Intelligence, Wisdom',
      skills:
        'Choose 2 from Arcana, History, Insight, Investigation, Medicine, Religion',
    },
    classFeatures: {
      Spellcasting: {
        description:
          'As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power.',
        details:
          'You know 3 cantrips and 6 first-level spells from the wizard spell list. Intelligence is your spellcasting ability. You have a spellbook containing these spells.',
      },
      'Arcane Recovery': {
        description:
          'You have learned to regain some of your magical energy by studying your spellbook.',
        details:
          'Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up).',
      },
    },
    choices: {},
  },
};

export const Step2ClassSelection: React.FC<Step2ClassSelectionProps> = ({
  data,
  onUpdate
}) => {
  const [selectedClassForModal, setSelectedClassForModal] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousClass, setPreviousClass] = useState<string | null>(data.selectedClass);

  const handleClassClick = (className: string) => {
    setSelectedClassForModal(className);
    setIsModalOpen(true);
  };

  const handleClassSelect = (className: string) => {
    setIsModalOpen(false);
    setSelectedClassForModal(null);

    // Start transition
    setIsTransitioning(true);

    // Small delay to allow modal to close
    setTimeout(() => {
      const classData = CLASS_DATA[className as keyof typeof CLASS_DATA];

      // Extract class proficiencies
      const extractProficiencies = (proficiencies: any) => {
        return {
          armor: proficiencies.armor ? proficiencies.armor.split(', ') : [],
          weapons: proficiencies.weapons ? proficiencies.weapons.split(', ') : [],
          tools: proficiencies.tools === 'None' ? [] : (proficiencies.tools?.split(', ') || []),
          savingThrows: proficiencies.savingThrows ? proficiencies.savingThrows.split(', ') : []
        };
      };

      // Extract class features as an array
      const extractClassFeatures = (classFeatures: any) => {
        return Object.entries(classFeatures || {}).map(([name, feature]: [string, any]) => ({
          name,
          description: feature.description || '',
          details: feature.details || '',
          ...feature
        }));
      };

      // Determine if class is a spellcaster
      const isSpellcaster = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'].includes(className);

      // Get spellcasting ability based on class
      const getSpellcastingAbility = (className: string) => {
        const abilities: { [key: string]: string } = {
          'Bard': 'Charisma',
          'Cleric': 'Wisdom',
          'Druid': 'Wisdom',
          'Paladin': 'Charisma',
          'Ranger': 'Wisdom',
          'Sorcerer': 'Charisma',
          'Warlock': 'Charisma',
          'Wizard': 'Intelligence'
        };
        return abilities[className];
      };

      onUpdate({
        selectedClass: className,
        selectedClassSkills: [], // Reset skills when changing class
        selectedClassChoices: {}, // Reset class choices when changing class
        classFeatureData: classData,
        classStep: 2, // Move to combined skills/features view

        // Extract and store all class data
        classProficiencies: extractProficiencies(classData.proficiencies),
        classFeatures: extractClassFeatures(classData.classFeatures),
        hitDice: `d${classData.hitDie}`,
        primaryAbility: [classData.primaryAbility],
        spellcaster: isSpellcaster,
        spellcastingAbility: getSpellcastingAbility(className),
        classStartingEquipment: [] // TODO: Add starting equipment data
      });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // End transition after animation
      setTimeout(() => {
        setIsTransitioning(false);
        setPreviousClass(className);
      }, 500);
    }, 300);
  };

  const handleSkillToggle = (skill: string) => {
    const currentSkills = data.selectedClassSkills;
    const requiredCount =
      CLASS_SKILL_CHOICES[
        data.selectedClass as keyof typeof CLASS_SKILL_CHOICES
      ] || 0;

    if (currentSkills.includes(skill)) {
      // Remove skill
      onUpdate({
        selectedClassSkills: currentSkills.filter((s) => s !== skill),
      });
    } else if (currentSkills.length < requiredCount) {
      // Add skill
      onUpdate({
        selectedClassSkills: [...currentSkills, skill],
      });
    }
  };

  const handleStepChange = (step: number) => {
    onUpdate({ classStep: step });
  };

  const handleClassChoiceToggle = (category: string, choice: string) => {
    const currentChoices = data.selectedClassChoices[category] || [];

    // Determine max choices for this category based on the feature
    const maxChoices = category === 'Expertise' ? 2 : 1;

    if (currentChoices.includes(choice)) {
      // Remove choice
      onUpdate({
        selectedClassChoices: {
          ...data.selectedClassChoices,
          [category]: currentChoices.filter(c => c !== choice)
        }
      });
    } else if (currentChoices.length < maxChoices) {
      // Add choice if under limit
      onUpdate({
        selectedClassChoices: {
          ...data.selectedClassChoices,
          [category]: [...currentChoices, choice]
        }
      });
    }
  };

  const getAvailableSkills = (): string[] => {
    if (!data.selectedClass) return [];
    const classSkills =
      CLASS_SKILLS[data.selectedClass as keyof typeof CLASS_SKILLS];
    if (!classSkills) return [];

    // Special case: Bard can choose any skill
    if (
      Array.isArray(classSkills) &&
      classSkills.length === 1 &&
      classSkills[0] === 'any'
    ) {
      return ALL_SKILLS;
    }

    return Array.isArray(classSkills) ? classSkills : [];
  };

  const getRequiredSkillCount = () => {
    return (
      CLASS_SKILL_CHOICES[
        data.selectedClass as keyof typeof CLASS_SKILL_CHOICES
      ] || 0
    );
  };

  const isSkillSelectionComplete = () => {
    const required = getRequiredSkillCount();
    return required <= 0 || data.selectedClassSkills.length === required;
  };


  const currentStep = data.classStep || 1;
  const availableSkills = getAvailableSkills();
  const requiredSkillCount = getRequiredSkillCount();

  // Effect to handle when class step changes
  useEffect(() => {
    if (data.classStep === 2 && data.selectedClass && data.selectedClass !== previousClass) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setPreviousClass(data.selectedClass);
    }
  }, [data.classStep, data.selectedClass, previousClass]);


  return (
    <>
      {/* Class Details Modal */}
      {selectedClassForModal && (
        <ClassDetailsModal
          isOpen={isModalOpen}
          className={selectedClassForModal}
          classData={CLASS_DATA[selectedClassForModal as keyof typeof CLASS_DATA]}
          onSelect={() => handleClassSelect(selectedClassForModal)}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedClassForModal(null);
          }}
        />
      )}

      <StepContainer style={{
        opacity: isTransitioning ? 0.3 : 1,
        transition: 'opacity 0.3s ease',
      }}>
        {/* Transition Screen */}
        {isTransitioning && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 999,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2520 100%)',
            border: '3px solid #d4af37',
            borderRadius: '12px',
            padding: '2rem 3rem',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
            animation: 'fadeInScale 0.3s ease',
          }}>
            <h2 style={{
              color: '#d4af37',
              fontFamily: 'Cinzel, serif',
              fontSize: '1.8rem',
              margin: 0,
              textAlign: 'center',
            }}>
              Configuring {selectedClassForModal || data.selectedClass}...
            </h2>
            <p style={{
              color: '#ccc',
              marginTop: '0.5rem',
              textAlign: 'center',
            }}>
              Setting up your class features and skills
            </p>
          </div>
        )}

        <div className="step-title">
          Choose Your Class
          {data.selectedClass && ` - ${data.selectedClass}`}
        </div>
        <div className="step-description">
          {currentStep === 1 &&
            'Your class is the foundation of your character, determining your capabilities, hit points, and core features.'}
          {currentStep === 2 &&
            'Select your class skills and review your level 1 features.'}
        </div>

      <div className="step-content">
          {/* Step Navigation - Now only 2 steps */}
          {data.selectedClass && (
            <ClassStepNavigation>
              <StepButton
                active={currentStep === 1}
                onClick={() => handleStepChange(1)}
              >
                1. Choose Class
              </StepButton>
              <StepButton
                active={currentStep === 2}
                onClick={() => handleStepChange(2)}
                disabled={!data.selectedClass}
              >
                2. Skills & Features
              </StepButton>
            </ClassStepNavigation>
          )}

        {/* Step 1: Class Selection */}
        {currentStep === 1 && (
          <>
            <ClassSelectionInfo>
              <h4>Class Selection - Following 2024 PHB</h4>
              <p>
                In D&D 2024, you choose your class first to establish your
                character's role and abilities. Each class provides a hit die,
                proficiencies, saving throws, and unique features.
              </p>
            </ClassSelectionInfo>

            <ClassGrid>
              {classOptions.map((className) => {
                const classInfo =
                  CLASS_DATA[className as keyof typeof CLASS_DATA];
                const isSelected = data.selectedClass === className;

                return (
                  <ClassCard
                    key={className}
                    selected={isSelected}
                    onClick={() => handleClassClick(className)}
                  >
                    {isSelected && <SelectedIndicator>✓</SelectedIndicator>}

                    <ClassName>{className}</ClassName>

                    <ClassDescription>{classInfo.description}</ClassDescription>

                    <ClassFeatures>
                      <div className="feature-title">Hit Die:</div>
                      <div className="feature-list">d{classInfo.hitDie}</div>

                      <div className="feature-title">Primary Ability:</div>
                      <div className="feature-list">
                        {classInfo.primaryAbility}
                      </div>

                      <div className="feature-title">Saving Throws:</div>
                      <div className="feature-list">
                        {classInfo.savingThrows}
                      </div>

                      <div className="feature-title">Level 1 Features:</div>
                      <div className="feature-list">
                        {classInfo.features.join(', ')}
                      </div>
                    </ClassFeatures>
                  </ClassCard>
                );
              })}
            </ClassGrid>
          </>
        )}

        {/* Step 2: Combined Skills Selection & Class Features */}
        {currentStep === 2 && data.selectedClass && (
          <>
            <SkillSelectionContainer>
              <ClassSelectionInfo>
                <h4>{data.selectedClass} Skill Selection</h4>
              <p>
                {data.selectedClass === 'Bard'
                  ? `Choose ${requiredSkillCount} skills from ANY skill list. Bards are versatile and can learn any skills they desire.`
                  : `Choose ${requiredSkillCount} skills from your class's available skills. These represent your character's training and expertise.`}
              </p>
            </ClassSelectionInfo>

            {requiredSkillCount > 0 ? (
              <>
                <SkillGrid>
                  {availableSkills.map((skill: string) => (
                    <SkillOption
                      key={skill}
                      selected={data.selectedClassSkills.includes(skill)}
                      disabled={
                        !data.selectedClassSkills.includes(skill) &&
                        data.selectedClassSkills.length >= requiredSkillCount
                      }
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                    </SkillOption>
                  ))}
                </SkillGrid>

                <div
                  style={{
                    textAlign: 'center',
                    color: isSkillSelectionComplete() ? '#4caf50' : '#d4af37',
                    fontWeight: 600,
                    marginTop: '1rem',
                  }}
                >
                  Selected: {data.selectedClassSkills.length} /{' '}
                  {requiredSkillCount}
                  {isSkillSelectionComplete() && ' ✓ Complete!'}
                </div>
              </>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: '#4caf50',
                  fontWeight: 600,
                  padding: '2rem',
                  background: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                }}
              >
                ✓ {data.selectedClass} has no skill choices to make at level 1.
              </div>
            )}
            </SkillSelectionContainer>

            {/* Class Features Section */}
            <SkillSelectionContainer>
              <ClassSelectionInfo>
              <h4>{data.selectedClass} Level 1 Features</h4>
              <p>
                Review your class features and make any required choices. These are the special abilities you gain at level 1.
              </p>
            </ClassSelectionInfo>

            {(() => {
              const classInfo = CLASS_DATA[data.selectedClass as keyof typeof CLASS_DATA];
              const hasChoices = classInfo?.choices && Object.keys(classInfo.choices).length > 0;

              if (hasChoices) {
                return Object.entries(classInfo.choices).map(([choiceName, choiceData]) => (
                  <div key={choiceName} style={{ marginBottom: '1.5rem' }}>
                    <ClassSelectionInfo>
                      <h4>{choiceName}</h4>
                      <p>{choiceData.description}</p>
                    </ClassSelectionInfo>

                    <SkillGrid>
                      {choiceData.options.map((option: any) => (
                        <SkillOption
                          key={option.name}
                          selected={data.selectedClassChoices[choiceName]?.includes(option.name) || false}
                          onClick={() => handleClassChoiceToggle(choiceName, option.name)}
                        >
                          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                            {option.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            {option.description}
                          </div>
                        </SkillOption>
                      ))}
                    </SkillGrid>

                    <div
                      style={{
                        textAlign: 'center',
                        color: (data.selectedClassChoices[choiceName]?.length || 0) === (choiceName === 'Eldritch Invocations' ? 2 : 1) ? '#4caf50' : '#d4af37',
                        fontWeight: 600,
                        marginTop: '1rem',
                      }}
                    >
                      Selected: {data.selectedClassChoices[choiceName]?.length || 0} / {choiceName === 'Expertise' ? 2 : 1}
                      {(data.selectedClassChoices[choiceName]?.length || 0) === (choiceName === 'Expertise' ? 2 : 1) && ' ✓ Complete!'}
                    </div>
                  </div>
                ));
              } else {
                return (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#4caf50',
                      fontWeight: 600,
                      padding: '2rem',
                      background: 'rgba(76, 175, 80, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                    }}
                  >
                    ✓ {data.selectedClass} has no feature choices to make at level 1.
                    <div style={{ marginTop: '1rem', color: '#ccc', fontSize: '0.9rem' }}>
                      Your {data.selectedClass} automatically gains all level 1 features.
                    </div>
                  </div>
                );
              }
            })()}
            </SkillSelectionContainer>

          </>
        )}
      </div>
    </StepContainer>
    </>
  );
};
