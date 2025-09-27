import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { classOptions } from '../../constants/characterOptions';
import { CLASS_SKILLS, CLASS_SKILL_CHOICES } from '../../services/classService';
import classChoiceService, {
  FightingStyle,
  DivineOrder,
  EldritchInvocation
} from '../../services/classChoiceService';

// Complete list of all D&D skills for classes that can choose "any" skill
const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

interface Step2ClassSelectionProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

const ClassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ClassCard = styled.div<{ selected: boolean }>`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid ${props => props.selected ? '#d4af37' : '#444'};
  border-radius: 6px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 140px;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(212, 175, 55, 0.3);
  }

  ${props => props.selected && `
    background: rgba(212, 175, 55, 0.1);
    box-shadow: 0 3px 8px rgba(212, 175, 55, 0.4);
  `}
`;

const ClassName = styled.h3`
  color: #d4af37;
  margin: 0 0 0.25rem 0;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  text-align: center;
`;

const ClassDescription = styled.p`
  color: #ccc;
  font-size: 0.75rem;
  line-height: 1.2;
  margin: 0 0 0.5rem 0;
  text-align: center;
  flex: 1;
`;

const ClassFeatures = styled.div`
  .feature-title {
    color: #d4af37;
    font-weight: 600;
    font-size: 0.7rem;
    margin-bottom: 0.1rem;
  }

  .feature-list {
    color: #aaa;
    font-size: 0.65rem;
    line-height: 1.2;
  }
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
  border: 2px solid ${props => props.selected ? '#d4af37' : '#444'};
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  text-align: center;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover {
    ${props => !props.disabled && `
      border-color: #d4af37;
      transform: translateY(-1px);
    `}
  }

  ${props => props.selected && `
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
  background: ${props => props.active ? '#d4af37' : 'rgba(26, 26, 26, 0.8)'};
  color: ${props => props.active ? '#1a1a1a' : '#ccc'};
  border: 2px solid ${props => props.active ? '#d4af37' : '#444'};
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

const ClassFeaturesContainer = styled.div`
  margin-top: 2rem;
`;

const FeatureCategory = styled.div`
  margin-bottom: 2rem;
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
`;

const FeatureCategoryTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 1rem 0;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  text-align: center;
  border-bottom: 1px solid #444;
  padding-bottom: 0.5rem;
`;

const FeatureList = styled.div`
  display: grid;
  gap: 1rem;
`;

const FeatureItem = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #555;
  border-radius: 6px;
  padding: 1rem;
`;

const FeatureName = styled.h4`
  color: #d4af37;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
`;

const FeatureDescription = styled.p`
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ChoiceSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
`;

const ChoiceTitle = styled.h5`
  color: #d4af37;
  margin: 0 0 0.75rem 0;
  font-weight: 600;
`;

const ChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
`;

const ChoiceOption = styled.div<{ selected: boolean }>`
  padding: 0.75rem;
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid ${props => props.selected ? '#d4af37' : '#444'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-size: 0.9rem;

  &:hover {
    border-color: #d4af37;
  }

  ${props => props.selected && `
    background: rgba(212, 175, 55, 0.1);
    color: #d4af37;
  `}
`;

const ClassSelectionInfo = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;

  h4 {
    color: #d4af37;
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
  }

  p {
    color: #ccc;
    margin: 0;
    font-size: 0.85rem;
  }
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const PopupContainer = styled.div`
  background: rgba(26, 26, 26, 0.95);
  border: 2px solid #d4af37;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
`;

const PopupTitle = styled.h3`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  margin: 0 0 1rem 0;
  font-size: 1.4rem;
`;

const PopupText = styled.p`
  color: #ccc;
  margin: 0 0 2rem 0;
  line-height: 1.5;
  font-size: 1rem;
`;

const PopupButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const PopupButton = styled.button<{ primary?: boolean }>`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => props.primary ? '#4caf50' : '#666'};
  background: ${props => props.primary ? '#4caf50' : 'transparent'};
  color: ${props => props.primary ? 'white' : '#ccc'};
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;

  &:hover {
    border-color: ${props => props.primary ? '#45a049' : '#d4af37'};
    background: ${props => props.primary ? '#45a049' : 'rgba(212, 175, 55, 0.1)'};
    color: ${props => props.primary ? 'white' : '#d4af37'};
  }
`;

// Class descriptions and features for 2024 PHB
const CLASS_DATA = {
  'Barbarian': {
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
      skills: 'Choose 2 from Animal Handling, Athletics, Intimidation, Nature, Perception, Survival'
    },
    classFeatures: {
      'Rage': {
        description: 'In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action.',
        details: 'While raging, you gain +2 damage to melee attacks using Strength, resistance to bludgeoning, piercing, and slashing damage, and advantage on Strength checks and saves. You cannot cast spells while raging.'
      },
      'Unarmored Defense': {
        description: 'While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier.',
        details: 'You can use a shield and still gain this benefit.'
      }
    },
    choices: {}
  },
  'Bard': {
    description: 'A master of song, speech, and the magic they contain.',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrows: 'Dexterity, Charisma',
    features: ['Bardic Inspiration', 'Spellcasting'],
    proficiencies: {
      armor: 'Light armor',
      weapons: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords',
      tools: 'Three musical instruments of your choice',
      savingThrows: 'Dexterity, Charisma',
      skills: 'Choose any 3'
    },
    classFeatures: {
      'Bardic Inspiration': {
        description: 'You can inspire others through stirring words or music.',
        details: 'As a bonus action, choose one creature within 60 feet who can hear you. That creature gains one Bardic Inspiration die (d6). Once within the next 10 minutes, the creature can roll the die and add the number rolled to one ability check, attack roll, or saving throw.'
      },
      'Spellcasting': {
        description: 'You have learned to untangle and reshape the fabric of reality through music and poetry.',
        details: 'You know 2 cantrips and 4 first-level spells from the bard spell list. Charisma is your spellcasting ability.'
      }
    },
    choices: {}
  },
  'Cleric': {
    description: 'A priestly champion who wields divine magic in service of a deity.',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrows: 'Wisdom, Charisma',
    features: ['Divine Order', 'Spellcasting'],
    proficiencies: {
      armor: 'Light armor, medium armor, shields',
      weapons: 'Simple weapons',
      tools: 'None',
      savingThrows: 'Wisdom, Charisma',
      skills: 'Choose 2 from History, Insight, Medicine, Persuasion, Religion'
    },
    classFeatures: {
      'Divine Order': {
        description: 'You have dedicated yourself to one of the following sacred roles of service.',
        details: 'Choose one option that determines additional proficiencies and features you gain.'
      },
      'Spellcasting': {
        description: 'As a conduit for divine power, you can cast cleric spells.',
        details: 'You know 3 cantrips and can prepare 3 first-level spells from the cleric spell list. Wisdom is your spellcasting ability.'
      }
    },
    choices: {}
  },
  'Druid': {
    description: 'A priest of nature, wielding elemental forces and wild shapes.',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrows: 'Intelligence, Wisdom',
    features: ['Druidcraft', 'Spellcasting'],
    proficiencies: {
      armor: 'Light armor, medium armor, shields (non-metal)',
      weapons: 'Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears',
      tools: 'Herbalism kit',
      savingThrows: 'Intelligence, Wisdom',
      skills: 'Choose 2 from Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, Survival'
    },
    classFeatures: {
      'Druidcraft': {
        description: 'You know the Druidcraft cantrip.',
        details: 'This cantrip allows you to create minor magical effects related to nature.'
      },
      'Spellcasting': {
        description: 'Drawing on the divine essence of nature itself, you can cast spells to shape that essence to your will.',
        details: 'You know 2 cantrips and can prepare 3 first-level spells from the druid spell list. Wisdom is your spellcasting ability.'
      }
    },
    choices: {}
  },
  'Fighter': {
    description: 'A master of martial combat, skilled with a variety of weapons.',
    hitDie: 10,
    primaryAbility: 'Strength or Dexterity',
    savingThrows: 'Strength, Constitution',
    features: ['Fighting Style', 'Second Wind'],
    proficiencies: {
      armor: 'All armor, shields',
      weapons: 'Simple weapons, martial weapons',
      tools: 'None',
      savingThrows: 'Strength, Constitution',
      skills: 'Choose 2 from Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Perception, Survival'
    },
    classFeatures: {
      'Fighting Style': {
        description: 'You adopt a particular style of fighting as your specialty.',
        details: 'Choose one option that grants you specific combat benefits.'
      },
      'Second Wind': {
        description: 'You have a limited well of stamina that you can draw on to protect yourself from harm.',
        details: 'On your turn, you can use a bonus action to regain 1d10 + your fighter level hit points. Once you use this feature, you must finish a short or long rest before you can use it again.'
      }
    },
    choices: {}
  },
  'Monk': {
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
      skills: 'Choose 2 from Acrobatics, Athletics, History, Insight, Religion, Stealth'
    },
    classFeatures: {
      'Martial Arts': {
        description: 'Your practice of martial arts gives you mastery of combat styles that use unarmed strikes and monk weapons.',
        details: 'You can use Dexterity instead of Strength for attack and damage rolls with unarmed strikes and monk weapons. You can roll a d4 for damage instead of normal damage for unarmed strikes and monk weapons. When you use the Attack action with an unarmed strike or monk weapon, you can make one unarmed strike as a bonus action.'
      },
      'Unarmored Defense': {
        description: 'While you are wearing no armor and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom modifier.',
        details: 'This defense reflects your ability to dodge attacks through speed and intuition.'
      }
    },
    choices: {}
  },
  'Paladin': {
    description: 'A holy warrior bound to a sacred oath of justice and righteousness.',
    hitDie: 10,
    primaryAbility: 'Strength, Charisma',
    savingThrows: 'Wisdom, Charisma',
    features: ['Divine Sense', 'Lay on Hands'],
    proficiencies: {
      armor: 'All armor, shields',
      weapons: 'Simple weapons, martial weapons',
      tools: 'None',
      savingThrows: 'Wisdom, Charisma',
      skills: 'Choose 2 from Athletics, Insight, Intimidation, Medicine, Persuasion, Religion'
    },
    classFeatures: {
      'Divine Sense': {
        description: 'The presence of strong evil registers on your senses like a noxious odor.',
        details: 'As an action, you can open your awareness to detect celestials, fiends, and undead within 60 feet of you that are not behind total cover. You can use this feature a number of times equal to 1 + your Charisma modifier.'
      },
      'Lay on Hands': {
        description: 'Your blessed touch can heal wounds.',
        details: 'You have a pool of healing power that replenishes when you take a long rest. With that pool, you can restore a total number of hit points equal to your paladin level × 5.'
      }
    },
    choices: {}
  },
  'Ranger': {
    description: 'A warrior of the wilderness, skilled in tracking and survival.',
    hitDie: 10,
    primaryAbility: 'Dexterity, Wisdom',
    savingThrows: 'Strength, Dexterity',
    features: ['Spellcasting', 'Favored Enemy'],
    proficiencies: {
      armor: 'Light armor, medium armor, shields',
      weapons: 'Simple weapons, martial weapons',
      tools: 'None',
      savingThrows: 'Strength, Dexterity',
      skills: 'Choose 3 from Animal Handling, Athletics, Insight, Investigation, Nature, Perception, Stealth, Survival'
    },
    classFeatures: {
      'Spellcasting': {
        description: 'By the time you reach 2nd level, you have learned to use the magical essence of nature to cast spells.',
        details: 'You know 2 first-level spells from the ranger spell list at 2nd level. Wisdom is your spellcasting ability.'
      },
      'Favored Enemy': {
        description: 'You have significant experience studying, tracking, hunting, and speaking to a certain type of creature.',
        details: 'Choose a type of favored enemy: beasts, fey, humanoids, monstrosities, or undead. You have advantage on Wisdom (Survival) checks to track your favored enemies, as well as on Intelligence checks to recall information about them.'
      }
    },
    choices: {}
  },
  'Rogue': {
    description: 'A scoundrel who uses stealth and trickery to overcome obstacles.',
    hitDie: 8,
    primaryAbility: 'Dexterity',
    savingThrows: 'Dexterity, Intelligence',
    features: ['Expertise', 'Sneak Attack', 'Thieves\' Cant'],
    proficiencies: {
      armor: 'Light armor',
      weapons: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords',
      tools: 'Thieves\' tools',
      savingThrows: 'Dexterity, Intelligence',
      skills: 'Choose 4 from Acrobatics, Athletics, Deception, Insight, Intimidation, Investigation, Perception, Performance, Persuasion, Sleight of Hand, Stealth'
    },
    classFeatures: {
      'Expertise': {
        description: 'Choose two of your skill proficiencies, or one skill proficiency and your proficiency with thieves\' tools.',
        details: 'Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.'
      },
      'Sneak Attack': {
        description: 'You know how to strike subtly and exploit a foe\'s distraction.',
        details: 'Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or ranged weapon.'
      },
      'Thieves\' Cant': {
        description: 'You have learned thieves\' cant, a secret mix of dialect, jargon, and code.',
        details: 'You can communicate simple concepts through thieves\' cant. It takes four times longer to convey such a message than speaking normally.'
      }
    },
    choices: {}
  },
  'Sorcerer': {
    description: 'A spellcaster who draws on inherent magic from a draconic bloodline or other source.',
    hitDie: 6,
    primaryAbility: 'Charisma',
    savingThrows: 'Constitution, Charisma',
    features: ['Innate Sorcery', 'Spellcasting'],
    proficiencies: {
      armor: 'None',
      weapons: 'Daggers, darts, slings, quarterstaffs, light crossbows',
      tools: 'None',
      savingThrows: 'Constitution, Charisma',
      skills: 'Choose 2 from Arcana, Deception, Insight, Intimidation, Persuasion, Religion'
    },
    classFeatures: {
      'Innate Sorcery': {
        description: 'An event in your past left an indelible mark on you, infusing you with simmering magic.',
        details: 'As a Bonus Action, you can unleash that magic for 1 minute, gaining +1 to spell save DC and Advantage on spell attack rolls. You can use this feature twice per Long Rest.'
      },
      'Spellcasting': {
        description: 'Drawing from your innate magic, you can cast spells.',
        details: 'You know 4 cantrips and can prepare 2 first-level spells from the sorcerer spell list. Charisma is your spellcasting ability.'
      }
    },
    choices: {}
  },
  'Warlock': {
    description: 'A wielder of magic derived from a bargain with an otherworldly entity.',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrows: 'Wisdom, Charisma',
    features: ['Eldritch Invocations', 'Pact Magic'],
    proficiencies: {
      armor: 'Light armor',
      weapons: 'Simple weapons',
      tools: 'None',
      savingThrows: 'Wisdom, Charisma',
      skills: 'Choose 2 from Arcana, Deception, History, Intimidation, Investigation, Nature, Religion'
    },
    classFeatures: {
      'Eldritch Invocations': {
        description: 'You have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with magical abilities.',
        details: 'You learn 1 eldritch invocation of your choice. When you gain certain warlock levels, you gain additional invocations.'
      },
      'Pact Magic': {
        description: 'Your arcane research and the magic bestowed on you by your patron have given you facility with spells.',
        details: 'You know 2 cantrips and 1 first-level spell from the warlock spell list. Charisma is your spellcasting ability. You regain spell slots on a short rest.'
      }
    },
    choices: {}
  },
  'Wizard': {
    description: 'A scholarly magic-user capable of manipulating reality through study.',
    hitDie: 6,
    primaryAbility: 'Intelligence',
    savingThrows: 'Intelligence, Wisdom',
    features: ['Spellcasting', 'Arcane Recovery'],
    proficiencies: {
      armor: 'None',
      weapons: 'Daggers, darts, slings, quarterstaffs, light crossbows',
      tools: 'None',
      savingThrows: 'Intelligence, Wisdom',
      skills: 'Choose 2 from Arcana, History, Insight, Investigation, Medicine, Religion'
    },
    classFeatures: {
      'Spellcasting': {
        description: 'As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power.',
        details: 'You know 3 cantrips and 6 first-level spells from the wizard spell list. Intelligence is your spellcasting ability. You have a spellbook containing these spells.'
      },
      'Arcane Recovery': {
        description: 'You have learned to regain some of your magical energy by studying your spellbook.',
        details: 'Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up).'
      }
    },
    choices: {}
  }
};

export const Step2ClassSelection: React.FC<Step2ClassSelectionProps> = ({
  data,
  onUpdate
}) => {
  const [showClassConfirmation, setShowClassConfirmation] = useState(false);
  const [showSkillConfirmation, setShowSkillConfirmation] = useState(false);
  const [pendingClass, setPendingClass] = useState<string>('');

  // New state for class choices
  const [fightingStyles, setFightingStyles] = useState<FightingStyle[]>([]);
  const [divineOrders, setDivineOrders] = useState<DivineOrder[]>([]);
  const [eldritchInvocations, setEldritchInvocations] = useState<EldritchInvocation[]>([]);
  const [isLoadingChoices, setIsLoadingChoices] = useState(false);

  // State for actual class data from database
  const [actualClassData, setActualClassData] = useState<any>(null);
  const [isLoadingClassData, setIsLoadingClassData] = useState(false);

  // Fetch class-specific choices when class is selected and we're on step 3
  useEffect(() => {
    if (data.selectedClass && data.classStep === 3) {
      fetchClassChoices();
      fetchActualClassData();
    }
  }, [data.selectedClass, data.classStep]);

  const fetchActualClassData = async () => {
    if (!data.selectedClass) return;

    setIsLoadingClassData(true);
    try {
      const classData = await classChoiceService.getClassData(data.selectedClass);
      setActualClassData(classData);

      // Store the full class data for later use
      onUpdate({
        classFeatureData: classData
      });
    } catch (error) {
      console.error('Error fetching actual class data:', error);
    } finally {
      setIsLoadingClassData(false);
    }
  };

  const fetchClassChoices = async () => {
    if (!data.selectedClass) return;

    setIsLoadingChoices(true);
    try {
      const response = await classChoiceService.getClassChoices(data.selectedClass, 1);

      if (response.choices.fightingStyles) {
        setFightingStyles(response.choices.fightingStyles);
      }
      if (response.choices.divineOrders) {
        setDivineOrders(response.choices.divineOrders);
      }
      if (response.choices.eldritchInvocations) {
        setEldritchInvocations(response.choices.eldritchInvocations);
      }
    } catch (error) {
      console.error('Error fetching class choices:', error);
    } finally {
      setIsLoadingChoices(false);
    }
  };

  const handleClassSelect = (className: string) => {
    setPendingClass(className);
    setShowClassConfirmation(true);
  };

  const confirmClassSelection = () => {
    setShowClassConfirmation(false);

    // Clear class choice state when changing classes
    setFightingStyles([]);
    setDivineOrders([]);
    setEldritchInvocations([]);

    onUpdate({
      selectedClass: pendingClass,
      selectedClassSkills: [], // Reset skills when changing class
      selectedClassChoices: {}, // Reset class choices when changing class
      classStep: 2 // Move to skill selection
    });
  };

  const cancelClassSelection = () => {
    setShowClassConfirmation(false);
    setPendingClass('');
  };

  const handleSkillToggle = (skill: string) => {
    const currentSkills = data.selectedClassSkills;
    const requiredCount = CLASS_SKILL_CHOICES[data.selectedClass as keyof typeof CLASS_SKILL_CHOICES] || 0;

    if (currentSkills.includes(skill)) {
      // Remove skill
      onUpdate({
        selectedClassSkills: currentSkills.filter(s => s !== skill)
      });
    } else if (currentSkills.length < requiredCount) {
      // Add skill
      const newSkills = [...currentSkills, skill];
      onUpdate({
        selectedClassSkills: newSkills
      });

      // Show confirmation popup if we've reached the required count
      if (newSkills.length === requiredCount) {
        setShowSkillConfirmation(true);
      }
    }
  };

  const confirmSkillSelection = () => {
    setShowSkillConfirmation(false);
    onUpdate({
      classStep: 3 // Move to class features
    });
  };

  const cancelSkillSelection = () => {
    setShowSkillConfirmation(false);
    // Stay on skill selection, skills remain selected
  };

  const handleStepChange = (step: number) => {
    onUpdate({ classStep: step });
  };

  const handleClassChoiceSelect = (category: string, choice: string) => {
    onUpdate({
      selectedClassChoices: {
        ...data.selectedClassChoices,
        [category]: [choice] // Single choice for now
      }
    });
  };

  const hasRequiredChoices = (): boolean => {
    if (!data.selectedClass) return true;

    // Check for Fighting Style (Fighter, Paladin, Ranger)
    if (['Fighter', 'Paladin', 'Ranger'].includes(data.selectedClass)) {
      if (fightingStyles.length > 0 &&
          (!data.selectedClassChoices['Fighting Style'] ||
           data.selectedClassChoices['Fighting Style'].length === 0)) {
        return false;
      }
    }

    // Check for Divine Order (Cleric)
    if (data.selectedClass === 'Cleric') {
      if (divineOrders.length > 0 &&
          (!data.selectedClassChoices['Divine Order'] ||
           data.selectedClassChoices['Divine Order'].length === 0)) {
        return false;
      }
    }

    // Check for Eldritch Invocations (Warlock)
    if (data.selectedClass === 'Warlock') {
      if (eldritchInvocations.length > 0 &&
          (!data.selectedClassChoices['Eldritch Invocations'] ||
           data.selectedClassChoices['Eldritch Invocations'].length === 0)) {
        return false;
      }
    }

    return true;
  };

  const getAvailableSkills = (): string[] => {
    if (!data.selectedClass) return [];
    const classSkills = CLASS_SKILLS[data.selectedClass as keyof typeof CLASS_SKILLS];
    if (!classSkills) return [];

    // Special case: Bard can choose any skill
    if (Array.isArray(classSkills) && classSkills.length === 1 && classSkills[0] === 'any') {
      return ALL_SKILLS;
    }

    return Array.isArray(classSkills) ? classSkills : [];
  };

  const getRequiredSkillCount = () => {
    return CLASS_SKILL_CHOICES[data.selectedClass as keyof typeof CLASS_SKILL_CHOICES] || 0;
  };

  const isSkillSelectionComplete = () => {
    const required = getRequiredSkillCount();
    return required <= 0 || data.selectedClassSkills.length === required;
  };

  const currentStep = data.classStep || 1;
  const availableSkills = getAvailableSkills();
  const requiredSkillCount = getRequiredSkillCount();

  return (
    <StepContainer>
      <div className="step-title">
        Choose Your Class
        {data.selectedClass && ` - ${data.selectedClass}`}
      </div>
      <div className="step-description">
        {currentStep === 1 && "Your class is the foundation of your character, determining your capabilities, hit points, and core features."}
        {currentStep === 2 && `Select ${requiredSkillCount} skills from your class's skill list.`}
        {currentStep === 3 && "Review your class features and make any required choices. These are the abilities you gain at level 1."}
      </div>

      <div className="step-content">
        {/* Step Navigation */}
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
              disabled={!data.selectedClass || data.classStep < 2}
            >
              2. Choose Skills
            </StepButton>
            <StepButton
              active={currentStep === 3}
              onClick={() => handleStepChange(3)}
              disabled={!data.selectedClass || !isSkillSelectionComplete() || data.classStep < 3}
            >
              3. Class Features
            </StepButton>
          </ClassStepNavigation>
        )}

        {/* Step 1: Class Selection */}
        {currentStep === 1 && (
          <>
            <ClassSelectionInfo>
              <h4>Class Selection - Following 2024 PHB</h4>
              <p>
                In D&D 2024, you choose your class first to establish your character's role and abilities.
                Each class provides a hit die, proficiencies, saving throws, and unique features.
              </p>
            </ClassSelectionInfo>

            <ClassGrid>
              {classOptions.map((className) => {
                const classInfo = CLASS_DATA[className as keyof typeof CLASS_DATA];
                const isSelected = data.selectedClass === className;

                return (
                  <ClassCard
                    key={className}
                    selected={isSelected}
                    onClick={() => handleClassSelect(className)}
                  >

                    <ClassName>{className}</ClassName>

                    <ClassDescription>
                      {classInfo.description}
                    </ClassDescription>

                    <ClassFeatures>
                      <div className="feature-title">Hit Die:</div>
                      <div className="feature-list">d{classInfo.hitDie}</div>

                      <div className="feature-title">Primary Ability:</div>
                      <div className="feature-list">{classInfo.primaryAbility}</div>

                      <div className="feature-title">Saving Throws:</div>
                      <div className="feature-list">{classInfo.savingThrows}</div>

                      <div className="feature-title">Level 1 Features:</div>
                      <div className="feature-list">{classInfo.features.join(', ')}</div>
                    </ClassFeatures>
                  </ClassCard>
                );
              })}
            </ClassGrid>

          </>
        )}

        {/* Step 2: Skill Selection */}
        {currentStep === 2 && data.selectedClass && (
          <SkillSelectionContainer>
            <ClassSelectionInfo>
              <h4>{data.selectedClass} Skill Selection</h4>
              <p>
                {data.selectedClass === 'Bard'
                  ? `Choose ${requiredSkillCount} skills from ANY skill list. Bards are versatile and can learn any skills they desire.`
                  : `Choose ${requiredSkillCount} skills from your class's available skills. These represent your character's training and expertise.`
                }
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

                <div style={{
                  textAlign: 'center',
                  color: isSkillSelectionComplete() ? '#4caf50' : '#d4af37',
                  fontWeight: 600,
                  marginTop: '1rem'
                }}>
                  Selected: {data.selectedClassSkills.length} / {requiredSkillCount}
                  {isSkillSelectionComplete() && ' ✓ Complete!'}
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#4caf50',
                fontWeight: 600,
                padding: '2rem',
                background: 'rgba(76, 175, 80, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}>
                ✓ {data.selectedClass} has no skill choices to make at level 1.
              </div>
            )}
          </SkillSelectionContainer>
        )}

        {/* Step 3: Class Features */}
        {currentStep === 3 && data.selectedClass && (
          <ClassFeaturesContainer>
            <ClassSelectionInfo>
              <h4>{data.selectedClass} Level 1 Features</h4>
              <p>
                These are the proficiencies and features you gain from your class at level 1.
                Make any required choices to complete your class setup.
              </p>
            </ClassSelectionInfo>

            {(() => {
              const classData = CLASS_DATA[data.selectedClass as keyof typeof CLASS_DATA];

              // Function to render feature entries from database JSONB
              const renderFeatureEntries = (entries: any): React.ReactNode => {
                if (!entries) return null;
                if (Array.isArray(entries)) {
                  return entries.map((entry, index) => {
                    if (typeof entry === 'string') {
                      return <div key={index} style={{ marginBottom: '0.5rem' }}>{entry}</div>;
                    } else if (entry.type === 'list' && entry.items) {
                      return (
                        <ul key={index} style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                          {entry.items.map((item: string, itemIndex: number) => (
                            <li key={itemIndex}>{item}</li>
                          ))}
                        </ul>
                      );
                    }
                    return null;
                  });
                }
                return <div>{entries}</div>;
              };

              return (
                <>
                  {/* Loading indicator for actual class data */}
                  {isLoadingClassData && (
                    <div style={{ textAlign: 'center', color: '#d4af37', padding: '2rem' }}>
                      Loading 2024 class data...
                    </div>
                  )}

                  {/* Proficiencies */}
                  <FeatureCategory>
                    <FeatureCategoryTitle>Proficiencies</FeatureCategoryTitle>
                    <FeatureList>
                      <FeatureItem>
                        <FeatureName>Hit Die</FeatureName>
                        <FeatureDescription>d{actualClassData?.hitDie || classData.hitDie}</FeatureDescription>
                      </FeatureItem>
                      <FeatureItem>
                        <FeatureName>Primary Ability</FeatureName>
                        <FeatureDescription>{actualClassData?.primaryAbility?.join(', ') || classData.primaryAbility}</FeatureDescription>
                      </FeatureItem>
                      <FeatureItem>
                        <FeatureName>Saving Throws</FeatureName>
                        <FeatureDescription>{actualClassData?.savingThrowProficiencies?.join(', ') || classData.proficiencies.savingThrows}</FeatureDescription>
                      </FeatureItem>
                      <FeatureItem>
                        <FeatureName>Armor</FeatureName>
                        <FeatureDescription>
                          {actualClassData?.armorProficiencies ?
                            JSON.stringify(actualClassData.armorProficiencies).replace(/[{}"]/g, '') :
                            classData.proficiencies.armor}
                        </FeatureDescription>
                      </FeatureItem>
                      <FeatureItem>
                        <FeatureName>Weapons</FeatureName>
                        <FeatureDescription>
                          {actualClassData?.weaponProficiencies ?
                            JSON.stringify(actualClassData.weaponProficiencies).replace(/[{}"]/g, '') :
                            classData.proficiencies.weapons}
                        </FeatureDescription>
                      </FeatureItem>
                      <FeatureItem>
                        <FeatureName>Skills</FeatureName>
                        <FeatureDescription>{classData.proficiencies.skills}</FeatureDescription>
                      </FeatureItem>
                    </FeatureList>
                  </FeatureCategory>

                  {/* Class Features from Database (2024 PHB) */}
                  {actualClassData?.classFeatures && (
                    <FeatureCategory>
                      <FeatureCategoryTitle>Level 1 Class Features (2024 PHB)</FeatureCategoryTitle>
                      <FeatureList>
                        {actualClassData.classFeatures['1']?.map((feature: any, index: number) => (
                          <FeatureItem key={index}>
                            <FeatureName>{feature.name}</FeatureName>
                            <FeatureDescription>
                              {renderFeatureEntries(feature.entries)}
                            </FeatureDescription>
                          </FeatureItem>
                        ))}
                      </FeatureList>
                    </FeatureCategory>
                  )}

                  {/* Fallback: Class Features from Static Data */}
                  {!actualClassData?.classFeatures && (
                    <FeatureCategory>
                      <FeatureCategoryTitle>Class Features (Fallback)</FeatureCategoryTitle>
                      <FeatureList>
                        {Object.entries(classData.classFeatures).map(([featureName, feature]) => (
                          <FeatureItem key={featureName}>
                            <FeatureName>{featureName}</FeatureName>
                            <FeatureDescription>{feature.description}</FeatureDescription>
                            {feature.details && (
                              <FeatureDescription style={{ marginTop: '0.5rem', fontStyle: 'italic', opacity: 0.9 }}>
                                {feature.details}
                              </FeatureDescription>
                            )}
                          </FeatureItem>
                        ))}
                      </FeatureList>
                    </FeatureCategory>
                  )}

                  {/* Class Choices - From Database */}
                  {isLoadingChoices && (
                    <div style={{ textAlign: 'center', color: '#d4af37', padding: '2rem' }}>
                      Loading class choices...
                    </div>
                  )}

                  {/* Fighting Styles */}
                  {fightingStyles.length > 0 && (
                    <FeatureCategory>
                      <FeatureCategoryTitle>Fighting Style</FeatureCategoryTitle>
                      <FeatureList>
                        <FeatureItem>
                          <FeatureName>Choose Your Fighting Style</FeatureName>
                          <FeatureDescription>
                            You adopt a particular style of fighting as your specialty.
                          </FeatureDescription>
                          <ChoiceSection>
                            <ChoiceTitle>Select one fighting style:</ChoiceTitle>
                            <ChoiceGrid>
                              {fightingStyles.map((style) => (
                                <ChoiceOption
                                  key={style.id}
                                  selected={
                                    data.selectedClassChoices['Fighting Style']?.includes(style.name) || false
                                  }
                                  onClick={() => handleClassChoiceSelect('Fighting Style', style.name)}
                                >
                                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {style.name}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                    {style.description}
                                  </div>
                                </ChoiceOption>
                              ))}
                            </ChoiceGrid>
                          </ChoiceSection>
                        </FeatureItem>
                      </FeatureList>
                    </FeatureCategory>
                  )}

                  {/* Divine Orders */}
                  {divineOrders.length > 0 && (
                    <FeatureCategory>
                      <FeatureCategoryTitle>Divine Order</FeatureCategoryTitle>
                      <FeatureList>
                        <FeatureItem>
                          <FeatureName>Choose Your Sacred Role</FeatureName>
                          <FeatureDescription>
                            You have dedicated yourself to one of the following sacred roles of service.
                          </FeatureDescription>
                          <ChoiceSection>
                            <ChoiceTitle>Select your Divine Order:</ChoiceTitle>
                            <ChoiceGrid>
                              {divineOrders.map((order) => (
                                <ChoiceOption
                                  key={order.id}
                                  selected={
                                    data.selectedClassChoices['Divine Order']?.includes(order.name) || false
                                  }
                                  onClick={() => handleClassChoiceSelect('Divine Order', order.name)}
                                >
                                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {order.name}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                    {order.description}
                                  </div>
                                </ChoiceOption>
                              ))}
                            </ChoiceGrid>
                          </ChoiceSection>
                        </FeatureItem>
                      </FeatureList>
                    </FeatureCategory>
                  )}

                  {/* Eldritch Invocations - Only for Warlocks */}
                  {data.selectedClass === 'Warlock' && eldritchInvocations.length > 0 && (
                    <FeatureCategory>
                      <FeatureCategoryTitle>Eldritch Invocations</FeatureCategoryTitle>
                      <FeatureList>
                        <FeatureItem>
                          <FeatureName>Choose Your Eldritch Invocation</FeatureName>
                          <FeatureDescription>
                            In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability.
                          </FeatureDescription>
                          <ChoiceSection>
                            <ChoiceTitle>Select one invocation:</ChoiceTitle>
                            <ChoiceGrid>
                              {eldritchInvocations.map((invocation) => (
                                <ChoiceOption
                                  key={invocation.id}
                                  selected={
                                    data.selectedClassChoices['Eldritch Invocations']?.includes(invocation.name) || false
                                  }
                                  onClick={() => handleClassChoiceSelect('Eldritch Invocations', invocation.name)}
                                  style={{ minHeight: '120px' }}
                                >
                                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {invocation.name}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                    {invocation.description}
                                  </div>
                                  {invocation.atWillSpells.length > 0 && (
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#d4af37' }}>
                                      At Will: {invocation.atWillSpells.join(', ')}
                                    </div>
                                  )}
                                </ChoiceOption>
                              ))}
                            </ChoiceGrid>
                          </ChoiceSection>
                        </FeatureItem>
                      </FeatureList>
                    </FeatureCategory>
                  )}

                  {/* Completion Status for Step 3 */}
                  <div style={{
                    marginTop: '2rem',
                    textAlign: 'center',
                    color: hasRequiredChoices() ? '#4caf50' : '#d4af37',
                    fontWeight: 600
                  }}>
                    {hasRequiredChoices() ? (
                      <>✓ All class features and choices complete! Ready to continue.</>
                    ) : (
                      <>Please make all required class choices above.</>
                    )}
                  </div>
                </>
              );
            })()}
          </ClassFeaturesContainer>
        )}

        {/* Completion Status */}
        {data.selectedClass && isSkillSelectionComplete() && (
          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            color: '#4caf50',
            fontWeight: 600
          }}>
            ✓ {data.selectedClass} setup complete! Click Next to continue.
          </div>
        )}

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          color: '#888',
          fontSize: '0.9rem'
        }}>
          💡 Tip: Consider how your class's primary ability scores work with the ability scores you assigned in the previous step.
        </div>
      </div>

      {/* Class Selection Confirmation Popup */}
      {showClassConfirmation && (
        <PopupOverlay>
          <PopupContainer>
            <PopupTitle>Confirm Class Selection</PopupTitle>
            <PopupText>
              You have selected <strong>{pendingClass}</strong> as your class.
              <br /><br />
              This will determine your hit points, proficiencies, and class features. Are you sure you want to proceed with this choice?
            </PopupText>
            <PopupButtons>
              <PopupButton onClick={cancelClassSelection}>
                No, Let Me Choose Again
              </PopupButton>
              <PopupButton primary onClick={confirmClassSelection}>
                Yes, Confirm {pendingClass}
              </PopupButton>
            </PopupButtons>
          </PopupContainer>
        </PopupOverlay>
      )}

      {/* Skill Selection Confirmation Popup */}
      {showSkillConfirmation && (
        <PopupOverlay>
          <PopupContainer>
            <PopupTitle>Confirm Skill Selection</PopupTitle>
            <PopupText>
              You have selected {data.selectedClassSkills.length} skill{data.selectedClassSkills.length !== 1 ? 's' : ''}: <br />
              <strong>{data.selectedClassSkills.join(', ')}</strong>
              <br /><br />
              Are you satisfied with this selection?
            </PopupText>
            <PopupButtons>
              <PopupButton onClick={cancelSkillSelection}>
                No, Let Me Change
              </PopupButton>
              <PopupButton primary onClick={confirmSkillSelection}>
                Yes, Confirm Selection
              </PopupButton>
            </PopupButtons>
          </PopupContainer>
        </PopupOverlay>
      )}
    </StepContainer>
  );
};