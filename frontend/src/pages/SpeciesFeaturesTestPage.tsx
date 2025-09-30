import React from 'react';
import styled from 'styled-components';
import { generateFeaturesForCharacter } from '../utils/simpleFeatureGenerator';
import { CharacterSheetData } from '../types/characterSheet';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: #1a1a1a;
  color: #fff;
`;

const SpeciesSection = styled.div`
  margin-bottom: 3rem;
  border: 2px solid #d4af37;
  border-radius: 8px;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.5);
`;

const SpeciesTitle = styled.h2`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const VariantSection = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid #d4af37;
`;

const VariantTitle = styled.h3`
  color: #f0f0f0;
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
`;

const FeatureCard = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.75rem;
  margin: 0.5rem 0;
`;

const FeatureName = styled.div`
  color: #d4af37;
  font-weight: bold;
  margin-bottom: 0.25rem;
`;

const FeatureDescription = styled.div`
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const FeatureCategory = styled.div`
  color: #888;
  font-size: 0.75rem;
  font-style: italic;
  margin-top: 0.25rem;
`;

export const SpeciesFeaturesTestPage: React.FC = () => {
  // Create mock character data for each species and variant
  const speciesTestCases = [
    {
      species: 'Dragonborn',
      variants: [
        { name: 'Black Dragon (Level 1)', choices: { draconicAncestry: 'Black' } },
        { name: 'Black Dragon (Level 5)', choices: { draconicAncestry: 'Black' }, level: 5 },
        { name: 'Blue Dragon (Level 1)', choices: { draconicAncestry: 'Blue' } },
        { name: 'Blue Dragon (Level 5)', choices: { draconicAncestry: 'Blue' }, level: 5 },
        { name: 'Brass Dragon (Level 1)', choices: { draconicAncestry: 'Brass' } },
        { name: 'Brass Dragon (Level 5)', choices: { draconicAncestry: 'Brass' }, level: 5 },
        { name: 'Bronze Dragon (Level 1)', choices: { draconicAncestry: 'Bronze' } },
        { name: 'Bronze Dragon (Level 5)', choices: { draconicAncestry: 'Bronze' }, level: 5 },
        { name: 'Copper Dragon (Level 1)', choices: { draconicAncestry: 'Copper' } },
        { name: 'Copper Dragon (Level 5)', choices: { draconicAncestry: 'Copper' }, level: 5 },
        { name: 'Gold Dragon (Level 1)', choices: { draconicAncestry: 'Gold' } },
        { name: 'Gold Dragon (Level 5)', choices: { draconicAncestry: 'Gold' }, level: 5 },
        { name: 'Green Dragon (Level 1)', choices: { draconicAncestry: 'Green' } },
        { name: 'Green Dragon (Level 5)', choices: { draconicAncestry: 'Green' }, level: 5 },
        { name: 'Red Dragon (Level 1)', choices: { draconicAncestry: 'Red' } },
        { name: 'Red Dragon (Level 5)', choices: { draconicAncestry: 'Red' }, level: 5 },
        { name: 'Silver Dragon (Level 1)', choices: { draconicAncestry: 'Silver' } },
        { name: 'Silver Dragon (Level 5)', choices: { draconicAncestry: 'Silver' }, level: 5 },
        { name: 'White Dragon (Level 1)', choices: { draconicAncestry: 'White' } },
        { name: 'White Dragon (Level 5)', choices: { draconicAncestry: 'White' }, level: 5 },
      ]
    },
    {
      species: 'Elf',
      variants: [
        { name: 'High Elf (Level 1, Perception)', choices: { elfLineage: 'High Elf', elfSkill: 'Perception' } },
        { name: 'High Elf (Level 1, Insight)', choices: { elfLineage: 'High Elf', elfSkill: 'Insight' } },
        { name: 'High Elf (Level 1, Survival)', choices: { elfLineage: 'High Elf', elfSkill: 'Survival' } },
        { name: 'High Elf (Level 3)', choices: { elfLineage: 'High Elf', elfSkill: 'Perception' }, level: 3 },
        { name: 'High Elf (Level 5)', choices: { elfLineage: 'High Elf', elfSkill: 'Perception' }, level: 5 },
        { name: 'Wood Elf (Level 1)', choices: { elfLineage: 'Wood Elf', elfSkill: 'Perception' } },
        { name: 'Wood Elf (Level 3)', choices: { elfLineage: 'Wood Elf', elfSkill: 'Perception' }, level: 3 },
        { name: 'Wood Elf (Level 5)', choices: { elfLineage: 'Wood Elf', elfSkill: 'Perception' }, level: 5 },
        { name: 'Drow (Level 1)', choices: { elfLineage: 'Drow', elfSkill: 'Perception' } },
        { name: 'Drow (Level 3)', choices: { elfLineage: 'Drow', elfSkill: 'Perception' }, level: 3 },
        { name: 'Drow (Level 5)', choices: { elfLineage: 'Drow', elfSkill: 'Perception' }, level: 5 },
      ]
    },
    {
      species: 'Tiefling',
      variants: [
        { name: 'Abyssal (Level 1)', choices: { fiendishLegacy: 'Abyssal' } },
        { name: 'Abyssal (Level 3)', choices: { fiendishLegacy: 'Abyssal' }, level: 3 },
        { name: 'Abyssal (Level 5)', choices: { fiendishLegacy: 'Abyssal' }, level: 5 },
        { name: 'Chthonic (Level 1)', choices: { fiendishLegacy: 'Chthonic' } },
        { name: 'Chthonic (Level 3)', choices: { fiendishLegacy: 'Chthonic' }, level: 3 },
        { name: 'Chthonic (Level 5)', choices: { fiendishLegacy: 'Chthonic' }, level: 5 },
        { name: 'Infernal (Level 1)', choices: { fiendishLegacy: 'Infernal' } },
        { name: 'Infernal (Level 3)', choices: { fiendishLegacy: 'Infernal' }, level: 3 },
        { name: 'Infernal (Level 5)', choices: { fiendishLegacy: 'Infernal' }, level: 5 },
      ]
    },
    {
      species: 'Human',
      variants: [
        { name: 'Human (Acrobatics)', choices: { humanSkill: 'Acrobatics' } },
        { name: 'Human (Animal Handling)', choices: { humanSkill: 'Animal Handling' } },
        { name: 'Human (Arcana)', choices: { humanSkill: 'Arcana' } },
        { name: 'Human (Athletics)', choices: { humanSkill: 'Athletics' } },
        { name: 'Human (Deception)', choices: { humanSkill: 'Deception' } },
        { name: 'Human (History)', choices: { humanSkill: 'History' } },
        { name: 'Human (Insight)', choices: { humanSkill: 'Insight' } },
        { name: 'Human (Intimidation)', choices: { humanSkill: 'Intimidation' } },
        { name: 'Human (Investigation)', choices: { humanSkill: 'Investigation' } },
        { name: 'Human (Medicine)', choices: { humanSkill: 'Medicine' } },
        { name: 'Human (Nature)', choices: { humanSkill: 'Nature' } },
        { name: 'Human (Perception)', choices: { humanSkill: 'Perception' } },
        { name: 'Human (Performance)', choices: { humanSkill: 'Performance' } },
        { name: 'Human (Persuasion)', choices: { humanSkill: 'Persuasion' } },
        { name: 'Human (Religion)', choices: { humanSkill: 'Religion' } },
        { name: 'Human (Sleight of Hand)', choices: { humanSkill: 'Sleight of Hand' } },
        { name: 'Human (Stealth)', choices: { humanSkill: 'Stealth' } },
        { name: 'Human (Survival)', choices: { humanSkill: 'Survival' } },
      ]
    },
    {
      species: 'Dwarf',
      variants: [
        { name: 'Standard Dwarf', choices: {} }
      ]
    },
    {
      species: 'Halfling',
      variants: [
        { name: 'Standard Halfling', choices: {} }
      ]
    },
    {
      species: 'Gnome',
      variants: [
        { name: 'Forest Gnome', choices: { gnomeLineage: 'Forest Gnome' } },
        { name: 'Rock Gnome', choices: { gnomeLineage: 'Rock Gnome' } },
      ]
    },
    {
      species: 'Orc',
      variants: [
        { name: 'Standard Orc', choices: {} }
      ]
    },
    {
      species: 'Goliath',
      variants: [
        { name: "Cloud Giant", choices: { giantAncestry: "Cloud's Jaunt (Cloud Giant)" } },
        { name: "Fire Giant", choices: { giantAncestry: "Fire's Burn (Fire Giant)" } },
        { name: "Frost Giant", choices: { giantAncestry: "Frost's Chill (Frost Giant)" } },
        { name: "Hill Giant", choices: { giantAncestry: "Hill's Tumble (Hill Giant)" } },
        { name: "Stone Giant", choices: { giantAncestry: "Stone's Endurance (Stone Giant)" } },
        { name: "Storm Giant", choices: { giantAncestry: "Storm's Thunder (Storm Giant)" } },
      ]
    },
    {
      species: 'Aasimar',
      variants: [
        { name: 'Standard Aasimar (Level 1)', choices: {} },
        { name: 'Standard Aasimar (Level 3)', choices: {}, level: 3 }
      ]
    }
  ];

  // Create test cases for backgrounds
  const backgroundTestCases = [
    {
      name: 'Acolyte',
      background: 'Acolyte',
      backgroundFeatures: [
        {
          name: 'Shelter of the Faithful',
          description: 'As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith.'
        }
      ],
      selectedLanguages: ['Celestial', 'Abyssal']
    },
    {
      name: 'Criminal',
      background: 'Criminal',
      backgroundFeatures: [
        {
          name: 'Criminal Contact',
          description: 'You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances.'
        }
      ],
      selectedLanguages: ['Thieves\' Cant']
    },
    {
      name: 'Folk Hero',
      background: 'Folk Hero',
      backgroundFeatures: [
        {
          name: 'Rustic Hospitality',
          description: 'Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them.'
        }
      ],
      selectedLanguages: ['Giant', 'Goblin']
    },
    {
      name: 'Noble',
      background: 'Noble',
      backgroundFeatures: [
        {
          name: 'Position of Privilege',
          description: 'Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are.'
        }
      ],
      selectedLanguages: ['Draconic', 'Elvish']
    }
  ];

  // Create test cases for feats
  const featTestCases = [
    {
      name: 'Alert',
      selectedOriginFeats: ['Alert'],
      featFeatures: {
        'Alert': [
          {
            name: 'Alert',
            description: 'Always on the lookout for danger, you gain the following benefits: You gain a +5 bonus to initiative. You can\'t be surprised while you are conscious. Other creatures don\'t gain advantage on attack rolls against you as a result of being hidden from you.'
          }
        ]
      },
      featSpells: {},
      featChoices: {}
    },
    {
      name: 'Skilled',
      selectedOriginFeats: ['Skilled'],
      featFeatures: {
        'Skilled': [
          {
            name: 'Skilled',
            description: 'You gain proficiency in any combination of three skills or tools of your choice.'
          }
        ]
      },
      featSpells: {},
      featChoices: {
        'Skilled': {
          'skills': ['Stealth', 'Perception', 'Investigation']
        }
      }
    },
    {
      name: 'Magic Initiate',
      selectedOriginFeats: ['Magic Initiate'],
      featFeatures: {
        'Magic Initiate': [
          {
            name: 'Magic Initiate',
            description: 'Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard. You learn two cantrips of your choice from that class\'s spell list. You also learn one 1st-level spell from that same list. You can cast this spell once without expending a spell slot, and you regain the ability to do so when you finish a long rest.'
          }
        ]
      },
      featSpells: {
        'Magic Initiate': ['mage hand', 'prestidigitation', 'magic missile']
      },
      featChoices: {
        'Magic Initiate': {
          'class': 'Wizard'
        }
      }
    },
    {
      name: 'Crafter',
      selectedOriginFeats: ['Crafter'],
      featFeatures: {
        'Crafter': [
          {
            name: 'Crafter',
            description: 'You are adept at crafting things and bargaining with merchants, granting you the following benefits: You gain Tool Proficiency with three different Artisan\'s Tools of your choice. Whenever you buy a nonmagical item, you receive a 20 percent discount on it.'
          }
        ]
      },
      featSpells: {},
      featChoices: {
        'Crafter': {
          'tools': ['Smith\'s Tools', 'Carpenter\'s Tools', 'Leatherworker\'s Tools']
        }
      }
    },
    {
      name: 'Musician',
      selectedOriginFeats: ['Musician'],
      featFeatures: {
        'Musician': [
          {
            name: 'Musician',
            description: 'You are a practiced musician, granting you the following benefits: You gain Tool Proficiency with three Musical Instruments of your choice. After you finish a Short Rest or a Long Rest, you can play a song on a Musical Instrument with which you have Tool Proficiency and give Inspiration to allies who hear the song.'
          }
        ]
      },
      featSpells: {},
      featChoices: {
        'Musician': {
          'instruments': ['Lute', 'Drums', 'Flute']
        }
      }
    }
  ];

  // Create test cases for classes
  const classTestCases = [
    { name: 'Barbarian', class: 'Barbarian' },
    { name: 'Bard', class: 'Bard' },
    { name: 'Cleric', class: 'Cleric' },
    { name: 'Druid', class: 'Druid' },
    { name: 'Fighter', class: 'Fighter' },
    { name: 'Monk', class: 'Monk' },
    { name: 'Paladin', class: 'Paladin' },
    { name: 'Ranger', class: 'Ranger' },
    { name: 'Rogue', class: 'Rogue' },
    { name: 'Sorcerer', class: 'Sorcerer' },
    { name: 'Warlock', class: 'Warlock' },
    { name: 'Wizard', class: 'Wizard' },
  ];

  const generateFeaturesForTest = (
    species: string,
    choices: any,
    level: number = 1,
    characterClass: string = '',
    backgroundData: any = {},
    featData: any = {}
  ) => {
    const mockCharacter: CharacterSheetData = {
      name: 'Test Character',
      species,
      speciesChoices: choices,
      level,
      background: backgroundData.background || '',
      class: characterClass,
      subclass: '',

      // Background data
      backgroundFeatures: backgroundData.backgroundFeatures || [],
      backgroundEquipment: backgroundData.backgroundEquipment || [],
      selectedLanguages: backgroundData.selectedLanguages || [],

      // Feat data
      selectedOriginFeats: featData.selectedOriginFeats || [],
      featFeatures: featData.featFeatures || {},
      featSpells: featData.featSpells || {},
      featChoices: featData.featChoices || {},


      xp: 0,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      proficiencyBonus: 2,
      armorClass: 10,
      initiative: 0,
      speed: 30,
      size: 'Medium',
      passivePerception: 10,
      hitPoints: { current: 10, max: 10, temp: 0 },
      hitDice: { current: 1, max: 1, spent: 0 },
      deathSaves: { successes: 0, failures: 0 },
      heroicInspiration: false,
      wounds: 0,
      mana: { current: 0, max: 0 },
      resources: {},
      inventory: [],
      equipment: [],
      equipmentConstraints: {
        maxArmor: 1,
        maxShields: 1,
        maxAttunedItems: 3
      },
      equippedWeapons: [],
      attunedItems: [],
      skills: {},
      savingThrows: {},
      features: {
        classFeatures: [],
        subclassFeatures: [],
        speciesTraits: [],
        backgroundFeatures: [],
        feats: [],
        magicItemFeatures: [],
        customFeatures: []
      },
      weapons: [],
      actions: [],
      proficiencies: {
        armor: ['Light Armor', 'Medium Armor', 'Shields'],
        weapons: ['Simple Weapons', 'Martial Weapons', 'Longswords', 'Shortbows'],
        tools: ['Thieves\' Tools', 'Smith\'s Tools'],
        skills: ['Athletics', 'Perception', 'Stealth'],
        savingThrows: ['Strength', 'Constitution']
      }
    };

    return generateFeaturesForCharacter(mockCharacter);
  };

  return (
    <PageContainer>
      <h1 style={{ color: '#d4af37', textAlign: 'center', fontFamily: 'Cinzel, serif', fontSize: '2.5rem', marginBottom: '2rem' }}>
        Character Features Test - D&D 2024
      </h1>
      <p style={{ textAlign: 'center', color: '#ccc', marginBottom: '3rem' }}>
        This page displays all generated features for each species and class
      </p>

      <h2 style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', fontSize: '2rem', marginBottom: '1.5rem' }}>
        Species Features
      </h2>

      {speciesTestCases.map((testCase) => (
        <SpeciesSection key={testCase.species}>
          <SpeciesTitle>{testCase.species}</SpeciesTitle>

          {testCase.variants.map((variant) => (
            <VariantSection key={variant.name}>
              <VariantTitle>{variant.name}</VariantTitle>

              {generateFeaturesForTest(testCase.species, variant.choices, (variant as any).level).map((feature, index) => (
                <FeatureCard key={index}>
                  <FeatureName>{feature.name}</FeatureName>
                  <FeatureDescription>{feature.description}</FeatureDescription>
                  {feature.category && (
                    <FeatureCategory>{feature.category}</FeatureCategory>
                  )}
                </FeatureCard>
              ))}
            </VariantSection>
          ))}
        </SpeciesSection>
      ))}

      <h2 style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', fontSize: '2rem', marginBottom: '1.5rem', marginTop: '3rem' }}>
        Background Features
      </h2>

      {backgroundTestCases.map((testCase) => (
        <SpeciesSection key={testCase.background}>
          <SpeciesTitle>{testCase.name}</SpeciesTitle>

          <VariantSection>
            <VariantTitle>Background Features</VariantTitle>

            {generateFeaturesForTest('Human', {}, 1, '', testCase).map((feature, index) => (
              <FeatureCard key={index}>
                <FeatureName>{feature.name}</FeatureName>
                <FeatureDescription>{feature.description}</FeatureDescription>
                {feature.category && (
                  <FeatureCategory>{feature.category}</FeatureCategory>
                )}
              </FeatureCard>
            ))}
          </VariantSection>
        </SpeciesSection>
      ))}

      <h2 style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', fontSize: '2rem', marginBottom: '1.5rem', marginTop: '3rem' }}>
        Feat Features
      </h2>

      {featTestCases.map((testCase) => (
        <SpeciesSection key={testCase.name}>
          <SpeciesTitle>{testCase.name}</SpeciesTitle>

          <VariantSection>
            <VariantTitle>Feat Features</VariantTitle>

            {generateFeaturesForTest('Human', {}, 1, '', {}, testCase).map((feature, index) => (
              <FeatureCard key={index}>
                <FeatureName>{feature.name}</FeatureName>
                <FeatureDescription>{feature.description}</FeatureDescription>
                {feature.category && (
                  <FeatureCategory>{feature.category}</FeatureCategory>
                )}
              </FeatureCard>
            ))}
          </VariantSection>
        </SpeciesSection>
      ))}

      <h2 style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', fontSize: '2rem', marginBottom: '1.5rem', marginTop: '3rem' }}>
        Class Features
      </h2>

      {classTestCases.map((testCase) => (
        <SpeciesSection key={testCase.class}>
          <SpeciesTitle>{testCase.name}</SpeciesTitle>

          <VariantSection>
            <VariantTitle>Level 1 Features</VariantTitle>

            {generateFeaturesForTest('Human', {}, 1, testCase.class).map((feature, index) => (
              <FeatureCard key={index}>
                <FeatureName>{feature.name}</FeatureName>
                <FeatureDescription>{feature.description}</FeatureDescription>
                {feature.category && (
                  <FeatureCategory>{feature.category}</FeatureCategory>
                )}
              </FeatureCard>
            ))}
          </VariantSection>
        </SpeciesSection>
      ))}
    </PageContainer>
  );
};