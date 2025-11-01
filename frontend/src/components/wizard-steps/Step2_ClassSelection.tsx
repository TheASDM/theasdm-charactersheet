import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { classOptions } from '../../constants/characterOptions';
import { CLASS_SKILLS, CLASS_SKILL_CHOICES, listClasses } from '../../services/classService';
import { parseComplexDnDEntry } from '../../utils/dndTemplateParser';
import { loadClassData } from '../../utils/classDataLoader';
import { detectRequiredChoices } from '../../utils/classChoiceDetection';
import { ChoicePrompt } from '../../types/classFeatures';
import { loadExternalChoiceData } from '../../utils/externalChoiceLoader';
import WizardModal from '../wizard/WizardModal';
import { useApiCall } from '@/hooks/useApiCall';
import LoadingSpinner from '@/components/LoadingSpinner';
import { logger } from '../../utils/logger';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { CompactList } from '../wizard/CompactList';
import { DetailsModal } from '../wizard/DetailsModal';
import { ClassDetailsContent } from '../wizard/ClassDetailsContent';
import { CLASS_STARTING_EQUIPMENT } from '../../constants/startingEquipment';

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

// const ClassGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//   gap: 1rem;
//   margin-top: 1.5rem;
// 
//   @keyframes fadeInScale {
//     from {
//       opacity: 0;
//       transform: scale(0.9);
//     }
//     to {
//       opacity: 1;
//       transform: scale(1);
//     }
//   }
// `;
// 
// const ClassCard = styled.div<{ selected: boolean }>`
//   background: rgba(26, 26, 26, 0.8);
//   border: 2px solid ${(props) => (props.selected ? '#ce9016' : '#444')};
//   border-radius: 8px;
//   padding: 1.5rem;
//   cursor: pointer;
//   transition: all 0.3s ease;
//   position: relative;
// 
//   &:hover {
//     border-color: #ce9016;
//     transform: translateY(-2px);
//     box-shadow: 0 4px 12px rgba(206, 144, 22, 0.3);
//   }
// 
//   ${(props) =>
//     props.selected &&
//     `
//     background: rgba(206, 144, 22, 0.1);
//     box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
//   `}
// `;
// 
// const ClassName = styled.h3`
//   color: #ce9016;
//   margin: 0 0 0.5rem 0;
//   font-family: 'Cinzel', serif;
//   font-size: 1.3rem;
//   text-align: center;
// `;
// 
// const ClassDescription = styled.p`
//   color: #ccc;
//   font-size: 0.9rem;
//   line-height: 1.4;
//   margin: 0 0 1rem 0;
//   text-align: center;
// `;
// 
// const ClassFeatures = styled.div`
//   .feature-title {
//     color: #ce9016;
//     font-weight: 600;
//     font-size: 0.85rem;
//     margin-bottom: 0.25rem;
//   }
// 
//   .feature-list {
//     color: #aaa;
//     font-size: 0.8rem;
//     line-height: 1.3;
//   }
// `;
// 
// const SelectedIndicator = styled.div`
//   position: absolute;
//   top: 10px;
//   right: 10px;
//   width: 24px;
//   height: 24px;
//   background: #ce9016;
//   border-radius: 50%;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   color: #1a1a1a;
//   font-weight: bold;
//   font-size: 14px;
// `;

const SkillSelectionContainer = styled.div`
  margin-top: 2rem;
`;

const ModalSection = styled.section`
  background: rgba(26, 26, 26, 0.78);
  border: 1px solid rgba(206, 144, 22, 0.25);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.75rem;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
`;

const SectionTitle = styled.h3`
  color: #ce9016;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
`;

const SectionDescription = styled.p`
  color: #c0aa70;
  font-size: 0.9rem;
  margin: 0 0 1.25rem;
  line-height: 1.5;
`;

const SectionHint = styled.div`
  color: #9b9b9b;
  font-size: 0.85rem;
  margin: -0.5rem 0 1rem;
`;

const SkillGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.6rem;
`;

const SkillOption = styled.div<{ selected: boolean; disabled?: boolean }>`
  padding: 0.6rem 0.75rem;
  background: ${({ selected }) => (selected ? 'rgba(206, 144, 22, 0.2)' : 'rgba(60, 60, 60, 0.6)')};
  border: 1px solid ${({ selected }) => (selected ? '#ce9016' : 'rgba(206, 144, 22, 0.3)')};
  border-radius: 6px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  text-align: center;
  color: ${({ selected }) => (selected ? '#f0d693' : '#d7d7d7')};
  font-weight: 500;
  transition: all 0.2s ease;
  opacity: ${({ disabled }) => (disabled ? 0.45 : 1)};
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);

  &:hover {
    ${({ disabled }) =>
      !disabled &&
      `
        background: rgba(206, 144, 22, 0.16);
        border-color: #ce9016;
        transform: translateY(-1px);
      `}
  }
`;

const SelectionStatus = styled.div<{ $complete?: boolean }>`
  text-align: center;
  font-weight: 600;
  margin-top: 1.25rem;
  color: ${({ $complete }) => ($complete ? '#6aa84f' : '#ce9016')};
  letter-spacing: 0.4px;
`;

const ClassSelectionInfo = styled.div`
  background: rgba(206, 144, 22, 0.1);
  border: 1px solid rgba(206, 144, 22, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;

  h4 {
    color: #ce9016;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: #ccc;
    margin: 0;
    font-size: 0.9rem;
  }
`;

const PrimaryAbilitiesBox = styled.div`
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(26, 26, 26, 0.8) 100%);
  border: 2px solid rgba(76, 175, 80, 0.4);
  border-radius: 10px;
  padding: 1.25rem;
  margin: 1.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  h4 {
    color: #6aa84f;
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &::before {
      content: '⚔️';
      font-size: 1.2rem;
    }
  }

  p {
    color: #c0aa70;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.6;

    strong {
      color: #6aa84f;
      font-weight: 600;
    }
  }
`;


const ModalChoiceCard = styled.button<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  text-align: left;
  padding: 1rem 1.1rem;
  background: ${({ $selected }) => ($selected ? 'rgba(206, 144, 22, 0.18)' : 'rgba(50, 50, 50, 0.78)')};
  border: 1px solid ${({ $selected }) => ($selected ? '#ce9016' : 'rgba(206, 144, 22, 0.28)')};
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 110px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);

  &:hover {
    border-color: #ce9016;
    background: ${({ $selected }) => ($selected ? 'rgba(206, 144, 22, 0.22)' : 'rgba(62, 62, 62, 0.85)')};
    transform: translateY(-1px);
  }
`;

const ModalChoiceTitle = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  line-height: 1.2;
  font-weight: 600;
  color: #ce9016;
  margin-bottom: 0.45rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const ModalChoiceOptionText = styled.div`
  color: #d5d5d5;
  font-size: 0.85rem;
  line-height: 1.45;
  margin: 0;
  word-break: break-word;
  max-height: 140px;
  overflow-y: auto;
  padding-right: 0.4rem;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(206, 144, 22, 0.45);
    border-radius: 4px;
  }
`;

const ChoiceGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  align-items: stretch;
`;

const ModalButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  button {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.3s ease;
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }

  .btn-secondary {
    background: linear-gradient(145deg, #4a4a4a, #363636);
    color: #f0f0f0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }
  }

  .btn-primary {
    background: linear-gradient(145deg, #ce9016, #b8860b);
    color: #1a1a1a;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(206, 144, 22, 0.4);
    }
  }
`;

// const ReviewButton = styled.button`
//   padding: 0.75rem 1.5rem;
//   border-radius: 8px;
//   border: 2px solid #ce9016;
//   background: rgba(206, 144, 22, 0.1);
//   color: #ce9016;
//   font-weight: 700;
//   font-size: 0.95rem;
//   letter-spacing: 0.5px;
//   text-transform: uppercase;
//   cursor: pointer;
//   transition: all 0.3s ease;
// 
//   &:hover {
//     background: rgba(206, 144, 22, 0.2);
//     box-shadow: 0 6px 18px rgba(206, 144, 22, 0.3);
//     transform: translateY(-2px);
//   }
// `;

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
            name: 'Blind Fighting',
            description: 'You have Blindsight with a range of 10 feet.',
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
            name: 'Interception',
            description:
              'Use your reaction to reduce damage to a nearby ally by 1d10 + your Proficiency Bonus (requires shield or weapon).',
          },
          {
            name: 'Protection',
            description:
              'Use your reaction to impose disadvantage on an attack against a nearby ally (requires shield).',
          },
          {
            name: 'Thrown Weapon Fighting',
            description:
              'Draw thrown weapons as part of the attack and gain +2 damage to ranged attacks with thrown weapons.',
          },
          {
            name: 'Two-Weapon Fighting',
            description:
              'Add your ability modifier to damage of your second attack when fighting with two weapons.',
          },
          {
            name: 'Unarmed Fighting',
            description:
              'Your unarmed strikes deal 1d6 + Str damage (1d8 with two free hands). Deal 1d4 damage when you start a grapple.',
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
        description: 'You have unearthed Eldritch Invocations, pieces of forbidden knowledge that imbue you with an abiding magical ability or other lessons. You gain one invocation of your choice.',
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

const SPELLCASTER_CLASSES = new Set([
  'Bard',
  'Cleric',
  'Druid',
  'Paladin',
  'Ranger',
  'Sorcerer',
  'Warlock',
  'Wizard',
]);

const SPELLCASTING_ABILITIES: Record<string, string> = {
  Bard: 'Charisma',
  Cleric: 'Wisdom',
  Druid: 'Wisdom',
  Paladin: 'Charisma',
  Ranger: 'Wisdom',
  Sorcerer: 'Charisma',
  Warlock: 'Charisma',
  Wizard: 'Intelligence',
};

const extractProficiencies = (info: any) => {
  if (info.armorProficiencies || info.weaponProficiencies) {
    return {
      armor: info.armorProficiencies || [],
      weapons: info.weaponProficiencies || [],
      tools: info.toolProficiencies || [],
      savingThrows:
        info.savingThrowProficiencies?.map(
          (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
        ) || [],
    };
  }

  const proficiencies = info.proficiencies || {};

  // Helper to normalize proficiency data (handle both string and array formats)
  const normalizeProf = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      if (value === 'None') return [];
      return value.split(', ');
    }
    return [];
  };

  return {
    armor: normalizeProf(proficiencies.armor),
    weapons: normalizeProf(proficiencies.weapons),
    tools: normalizeProf(proficiencies.tools),
    savingThrows: normalizeProf(proficiencies.savingThrows),
  };
};

const extractClassFeatures = (info: any) => {
  if (info.classFeatures && info.classFeatures['1'] && Array.isArray(info.classFeatures['1'])) {
    const choiceOptionNames = new Set<string>();
    info.classFeatures['1'].forEach((feature: any) => {
      if (feature.entries && Array.isArray(feature.entries)) {
        feature.entries.forEach((entry: any) => {
          if (entry.type === 'options' && Array.isArray(entry.entries)) {
            entry.entries.forEach((opt: any) => {
              if (opt.type === 'refClassFeature') {
                const optionName = opt.classFeature.split('|')[0];
                choiceOptionNames.add(optionName);
              }
            });
          }
        });
      }
    });

    const level1Features = info.classFeatures['1'].filter(
      (f: any) => !choiceOptionNames.has(f.name)
    );

    return level1Features.map((feature: any) => {
      // Override long-winded Eldritch Invocations description
      let description;
      if (feature.name === 'Eldritch Invocations') {
        description = 'You have unearthed Eldritch Invocations, pieces of forbidden knowledge that imbue you with an abiding magical ability or other lessons. You gain one invocation of your choice.';
      } else {
        description = parseComplexDnDEntry(
          feature.entries || feature.description || ''
        );
      }

      return {
        name: feature.name,
        description,
        details: description,
        level: 1,
        page: feature.page,
        source: feature.source || 'Class Feature',
        entries: feature.entries,
        ...feature,
      };
    });
  }

  if (
    info.classFeatures &&
    typeof info.classFeatures === 'object' &&
    !info.classFeatures['1']
  ) {
    return Object.entries(info.classFeatures).map(
      ([featureName, featureData]: [string, any]) => ({
        name: featureName,
        description: featureData.description || '',
        details: featureData.details || featureData.description || '',
        level: 1,
        source: 'Class Feature',
      })
    );
  }

  return [];
};

const getSpellcastingAbility = (name: string) => SPELLCASTING_ABILITIES[name];

export const Step2ClassSelection: React.FC<Step2ClassSelectionProps> = ({
  data,
  onUpdate
}) => {
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [activeClass, setActiveClass] = useState<string | null>(data.selectedClass);
  const [detailsClass, setDetailsClass] = useState<string | null>(null);
  const {
    data: fetchedClasses,
    error: classesError,
    isLoading: isLoadingClasses,
    execute: fetchClasses,
  } = useApiCall(listClasses);

  // New choice system state
  const [detectedChoices, setDetectedChoices] = useState<ChoicePrompt[]>([]);
  const { scrollToBottom } = useAutoScroll();

  const closeClassModal = () => {
    setIsClassModalOpen(false);
  };

  const handleModalConfirm = () => {
    if (!canConfirmClass()) {
      return;
    }
    setIsClassModalOpen(false);
    scrollToBottom({ offset: 20 });
  };

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const apiClasses = fetchedClasses ?? [];

  // Load class data and detect choices when class is selected
  useEffect(() => {
    if (!data.selectedClass) {
      setDetectedChoices([]);
      return;
    }

    const loadAndDetectChoices = async () => {
      try {
        const classData = await loadClassData(data.selectedClass);

        // Detect required choices for level 1
        const detection = detectRequiredChoices(
          classData,
          1, // Level 1
          data.selectedClassChoices || {},
          undefined // No subclass at level 1
        );

        // Load external options for any external reference choices
        const promptsWithExternalOptions = await Promise.all(
          detection.prompts.map(async (prompt) => {
            if (prompt.externalReference && prompt.choiceType) {
              // This is an external reference - load the options
              try {
                const externalOptions = await loadExternalChoiceData(
                  prompt.externalReference,
                  1, // Level 1
                  data.selectedClassChoices || {}
                );

                // Update the prompt with the loaded options
                return {
                  ...prompt,
                  options: externalOptions
                };
              } catch (error) {
                logger.error(`Failed to load external options for ${prompt.title}:`, error);
                return prompt; // Return original prompt with empty options
              }
            }
            // Not an external reference, return as-is
            return prompt;
          })
        );

        const dedupedPrompts: ChoicePrompt[] = [];
        const seenOptionSignatures = new Set<string>();
        const seenChoiceGroups = new Set<string>();

        for (const prompt of promptsWithExternalOptions) {
          const normalizedGroupKey = (prompt.choiceGroup || prompt.title || '')
            .toLowerCase()
            .replace(/[^a-z]/g, '');

          if (normalizedGroupKey && seenChoiceGroups.has(normalizedGroupKey)) {
            continue;
          }

          const optionSignature = (prompt.options || [])
            .map((opt) => (opt.name || opt.id || '').toLowerCase())
            .sort()
            .join('|');

          if (optionSignature.length === 0) {
            dedupedPrompts.push(prompt);
            continue;
          }

          if (seenOptionSignatures.has(optionSignature)) {
            continue;
          }

          if (normalizedGroupKey) {
            seenChoiceGroups.add(normalizedGroupKey);
          }
          seenOptionSignatures.add(optionSignature);
          dedupedPrompts.push(prompt);
        }

        setDetectedChoices(dedupedPrompts);
      } catch (error) {
        logger.error('Failed to load class data:', error);
        setDetectedChoices([]);
      }
    };

    loadAndDetectChoices();
  }, [data.selectedClass, data.selectedClassChoices]);

  useEffect(() => {
    if (data.selectedClass) {
      setActiveClass(data.selectedClass);
    }
  }, [data.selectedClass]);

  // Helper function to extract choices from API class data
  const extractChoicesFromAPI = (classData: any) => {
    if (!classData.classFeatures || !classData.classFeatures['1']) return {};

    const choices: any = {};

    // Look through level 1 features for options
    classData.classFeatures['1'].forEach((feature: any) => {
      if (feature.entries && Array.isArray(feature.entries)) {
        feature.entries.forEach((entry: any) => {
          // Look for type: "options" entries
          if (entry.type === 'options' && entry.entries && Array.isArray(entry.entries)) {
            // This is a choice!
            const options = entry.entries
              .filter((opt: any) => opt.type === 'refClassFeature')
              .map((opt: any) => {
                // Extract the option name from the reference
                const refParts = opt.classFeature.split('|');
                const optionName = refParts[0];

                // Find the actual feature details in the same level
                const optionFeature = classData.classFeatures['1'].find((f: any) => f.name === optionName);

                // Use parseComplexDnDEntry to handle nested objects and template tags
                const description = parseComplexDnDEntry(optionFeature?.entries || '');

                return {
                  name: optionName,
                  description: description
                };
              });

            if (options.length > 0) {
              choices[feature.name] = {
                description: `Choose your ${feature.name.toLowerCase()}:`,
                options: options
              };
            }
          }
        });
      }
    });

    return choices;
  };

  // Helper function to get class data (prioritize API, fallback to hardcoded)
  const getClassData = (className: string) => {
    // Try to find in API classes first (2024 data)
    const apiClass = apiClasses.find(c => (c.className || c.name) === className);
    if (apiClass) {
      // Add extracted choices to API class data
      const choices = extractChoicesFromAPI(apiClass);
      return {
        ...apiClass,
        choices: Object.keys(choices).length > 0 ? choices : (apiClass as any).choices
      };
    }
    // Fallback to hardcoded CLASS_DATA if API hasn't loaded yet
    console.warn('⚠️ API class not found, falling back to hardcoded CLASS_DATA for:', className);
    return CLASS_DATA[className as keyof typeof CLASS_DATA];
  };

//   const handleClassClick = (className: string) => {
//     // Enter the modal workflow for the chosen class
//     handleClassSelect(className);
//   };

  const handleClassSelect = (className: string) => {
    if (data.selectedClass === className) {
      setActiveClass(className);
      setIsClassModalOpen(true);
      return;
    }

    const classData = getClassData(className);
    const proficiencies = extractProficiencies(classData);
    const classFeatures = extractClassFeatures(classData);
    const isSpellcaster = SPELLCASTER_CLASSES.has(className);
    const spellcastingAbility = getSpellcastingAbility(className);

    // Get starting equipment for this class
    const classEquipment = CLASS_STARTING_EQUIPMENT[className] || [];

    onUpdate({
      selectedClass: className,
      selectedClassSkills: [],
      selectedClassChoices: {},
      classFeatureData: classData,
      classProficiencies: proficiencies,
      classFeatures,
      hitDice: `d${classData.hitDie}`,
      primaryAbility: (() => {
        // Handle both API format (primaryAbilities array) and hardcoded format (primaryAbility string)
        const abilities = (classData as any).primaryAbilities || (classData as any).primaryAbility;
        if (Array.isArray(abilities)) {
          return abilities.filter((a: any): a is string => typeof a === 'string' && a !== undefined);
        }
        return typeof abilities === 'string' ? [abilities] : [];
      })(),
      spellcaster: isSpellcaster,
      spellcastingAbility: spellcastingAbility,
      classStartingEquipment: classEquipment,
    });

    setActiveClass(className);
    setIsClassModalOpen(true);
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

  const handleClassChoiceToggle = (choiceGroupId: string, featureId: string, maxSelections?: number) => {
    const currentChoices = data.selectedClassChoices[choiceGroupId] || [];
    const max = maxSelections || 1;

    if (currentChoices.includes(featureId)) {
      // Remove choice
      onUpdate({
        selectedClassChoices: {
          ...data.selectedClassChoices,
          [choiceGroupId]: currentChoices.filter(c => c !== featureId)
        }
      });
    } else if (currentChoices.length < max) {
      // Add choice if under limit
      onUpdate({
        selectedClassChoices: {
          ...data.selectedClassChoices,
          [choiceGroupId]: [...currentChoices, featureId]
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

  const areClassChoicesComplete = () => {
    if (detectedChoices.length === 0) {
      return true;
    }

    return detectedChoices.every((prompt) => {
      const currentSelections = data.selectedClassChoices[prompt.choiceGroup] || [];
      if (prompt.minSelections != null) {
        return currentSelections.length >= prompt.minSelections;
      }
      return currentSelections.length > 0;
    });
  };

  const canConfirmClass = () =>
    isSkillSelectionComplete() && areClassChoicesComplete();


  const availableSkills = getAvailableSkills();
  const requiredSkillCount = getRequiredSkillCount();

  const renderClassModalContent = () => {
    if (!activeClass) return null;

    return (
      <>
        {renderSkillSelectionSection()}
        {renderClassChoicesSection()}
      </>
    );
  };

  const renderSkillSelectionSection = () => {
    if (!data.selectedClass) return null;
    if (requiredSkillCount <= 0) return null;

    const selectionInstruction =
      data.selectedClass === 'Bard'
        ? `Bards are versatile and can learn any skills they desire. Choose ${requiredSkillCount} skill${requiredSkillCount !== 1 ? 's' : ''} from the full skill list below.`
        : `Choose ${requiredSkillCount} skill${requiredSkillCount !== 1 ? 's' : ''} from your class's available skills. These represent your character's training and expertise.`;

    const remainingSkills = Math.max(requiredSkillCount - data.selectedClassSkills.length, 0);

    return (
      <SkillSelectionContainer>
        <ModalSection>
          <SectionTitle>{data.selectedClass} Skill Selection</SectionTitle>
          <SectionDescription>{selectionInstruction}</SectionDescription>
          <SectionHint>
            {remainingSkills === 0
              ? 'All required skills selected.'
              : `You can still choose ${remainingSkills} more skill${remainingSkills !== 1 ? 's' : ''}.`}
          </SectionHint>

          <SkillGrid>
            {availableSkills.map((skill: string) => {
              const isSelected = data.selectedClassSkills.includes(skill);
              const isAtLimit =
                !isSelected && data.selectedClassSkills.length >= requiredSkillCount;

              return (
                <SkillOption
                  key={skill}
                  selected={isSelected}
                  disabled={isAtLimit}
                  onClick={() => !isAtLimit && handleSkillToggle(skill)}
                >
                  {skill}
                </SkillOption>
              );
            })}
          </SkillGrid>

          <SelectionStatus $complete={isSkillSelectionComplete()}>
            Selected: {data.selectedClassSkills.length} / {requiredSkillCount}
            {isSkillSelectionComplete() && ' ✓ Complete!'}
          </SelectionStatus>
        </ModalSection>
      </SkillSelectionContainer>
    );
  };

  const renderClassChoicesSection = () => {
    if (!data.selectedClass) return null;

    if (detectedChoices.length === 0) {
      return null;
    }

    return (
      <SkillSelectionContainer>
        {detectedChoices.map((prompt) => {
          const currentSelections = data.selectedClassChoices[prompt.choiceGroup] || [];
          const maxSelections = prompt.maxSelections || 1;
          const requiredMinimum = prompt.minSelections ?? Math.min(1, maxSelections);
          const isComplete = prompt.minSelections
            ? currentSelections.length >= prompt.minSelections
            : currentSelections.length > 0;

          let hintMessage: string;
          if (prompt.minSelections && prompt.minSelections !== maxSelections) {
            hintMessage = `Select ${prompt.minSelections} to ${maxSelections} options.`;
          } else if (prompt.minSelections || maxSelections === 1) {
            hintMessage = `Select ${maxSelections} option${maxSelections !== 1 ? 's' : ''}.`;
          } else {
            hintMessage = `Select up to ${maxSelections} option${maxSelections !== 1 ? 's' : ''}.`;
          }

          return (
            <ModalSection key={prompt.choiceGroup}>
              <SectionTitle>{prompt.title}</SectionTitle>
              {prompt.description && <SectionDescription>{prompt.description}</SectionDescription>}
              <SectionHint>{hintMessage}</SectionHint>

              <ChoiceGrid>
                {prompt.options.map((option) => {
                  const optionId = option.id || option.name;
                  const isSelected = currentSelections.includes(optionId);
                  const isAtLimit = !isSelected && currentSelections.length >= maxSelections;

                  return (
                    <ModalChoiceCard
                      key={optionId}
                      type="button"
                      $selected={isSelected}
                      onClick={() => !isAtLimit && handleClassChoiceToggle(prompt.choiceGroup, optionId, maxSelections)}
                    >
                      <ModalChoiceTitle>{option.name}</ModalChoiceTitle>
                      <ModalChoiceOptionText>
                        {parseComplexDnDEntry(option.description)}
                      </ModalChoiceOptionText>
                    </ModalChoiceCard>
                  );
                })}
              </ChoiceGrid>

              <SelectionStatus $complete={isComplete}>
                Selected: {currentSelections.length} / {maxSelections}
                {isComplete && requiredMinimum > 0 && ' ✓ Complete!'}
              </SelectionStatus>
            </ModalSection>
          );
        })}
      </SkillSelectionContainer>
    );
  };

  const modalFooter = !activeClass
    ? null
    : (
      <ModalButtonRow>
        <button type="button" className="btn-secondary" onClick={closeClassModal}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleModalConfirm}
          disabled={!canConfirmClass()}
        >
          Confirm Class
        </button>
      </ModalButtonRow>
    );

  if (isLoadingClasses) {
    return (
      <StepContainer>
        <div className="step-title">Class</div>
        <LoadingSpinner message="Loading classes..." />
      </StepContainer>
    );
  }

  if (classesError) {
    return (
      <StepContainer>
        <div className="step-title">Class</div>
        <div
          role="alert"
          style={{ textAlign: 'center', color: '#ff6b6b', padding: '2rem' }}
        >
          Unable to load classes: {classesError}
        </div>
      </StepContainer>
    );
  }

  return (
    <>
      <StepContainer>
        <div className="step-title">
          Choose Your Class
          {data.selectedClass && ` - ${data.selectedClass}`}
        </div>
        <div className="step-description">
          Your class is the foundation of your character, determining your capabilities, hit points, and core features.
        </div>

        <ClassSelectionInfo>
          <h4>Class Selection - Following 2024 PHB</h4>
          <p>
            Click "Details" to review class information, or "Select" to choose and configure your class.
          </p>
        </ClassSelectionInfo>

        {data.selectedClass && (() => {
          // Find the actual class data from API
          const apiClass = apiClasses.find((c: any) => c.name === data.selectedClass || c.className === data.selectedClass);
          const primaryAbilities = apiClass?.primaryAbilities || [];
          const primaryAbilityText = primaryAbilities.length > 0
            ? primaryAbilities.join(' or ')
            : 'Various';

          return (
            <PrimaryAbilitiesBox>
              <h4>Primary {primaryAbilities.length > 1 ? 'Abilities' : 'Ability'}</h4>
              <p>
                Your <strong>{data.selectedClass}</strong> primarily uses <strong>{primaryAbilityText}</strong> for class features and abilities.
                Focus on {primaryAbilities.length > 1 ? 'these ability scores' : 'this ability score'} during character creation for optimal effectiveness.
              </p>
            </PrimaryAbilitiesBox>
          );
        })()}

        <CompactList
          items={classOptions.map((className) => {
            // Find the API class data for this class
            const apiClass = apiClasses.find((c: any) => c.name === className || c.className === className);
            return {
              name: className,
              ...getClassData(className),
              apiData: apiClass, // Include API data
            };
          })}
          isSelected={(cls) => cls.name === data.selectedClass}
          onDetails={(cls) => setDetailsClass(cls.name)}
          onSelect={(cls) => handleClassSelect(cls.name)}
          renderName={(cls) => cls.name}
          renderSummary={(cls) =>
            (cls as any).description || `A ${cls.name.toLowerCase()} adventurer with unique abilities and skills.`
          }
          renderPreview={(cls) => {
            const classData = cls as any;
            const apiData = classData.apiData;
            const primaryAbilities = apiData?.primaryAbilities || [];
            const primaryText = primaryAbilities.length > 0 ? primaryAbilities.join('/') : 'Varied';
            return (
              <>
                <strong>Hit Die:</strong> d{apiData?.hitDie || classData.hitDie || '?'} • <strong>Primary:</strong> {primaryText}
              </>
            );
          }}
          detailsLabel="Details"
          selectLabel="Select"
        />
      </StepContainer>

      <DetailsModal
        isOpen={!!detailsClass}
        onClose={() => setDetailsClass(null)}
        title={detailsClass || ''}
        content={
          detailsClass ? (
            <ClassDetailsContent
              classData={{
                name: detailsClass,
                ...getClassData(detailsClass),
              }}
            />
          ) : null
        }
      />

      <WizardModal
        isOpen={isClassModalOpen && Boolean(activeClass)}
        onClose={closeClassModal}
        title={activeClass ? `${activeClass} Class Details` : 'Class Details'}
        subtitle="Choose your class skills and resolve any feature choices."
        maxWidth="960px"
        footer={modalFooter}
      >
        {renderClassModalContent()}
      </WizardModal>
    </>
  );
};
