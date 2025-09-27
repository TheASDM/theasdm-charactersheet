import { useState, useCallback } from 'react';
import { CharacterSheetData } from '../../types/characterSheet';
import { speciesService } from '../../services/speciesService';
import { classService, CLASS_SKILL_CHOICES } from '../../services/classService';
import { speciesChoices } from '../../components/SpeciesSelectionModal';
import { backgroundsData } from '../../components/BackgroundSelectionModal';

export const useSelectionModals = (
  character: CharacterSheetData,
  updateCharacter: (updates: Partial<CharacterSheetData>) => void,
  onSave?: (updatedCharacter: CharacterSheetData, options?: { silent?: boolean }) => void | Promise<void>
) => {
  // Species selection state
  const [showSpeciesPopup, setShowSpeciesPopup] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedSpeciesChoices, setSelectedSpeciesChoices] = useState<{[key: string]: string}>({});

  // Class selection state
  const [showClassPopup, setShowClassPopup] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassSkills, setSelectedClassSkills] = useState<string[]>([]);
  const [selectedClassChoices, setSelectedClassChoices] = useState<{[key: string]: string[]}>({});
  const [classChoicesStep, setClassChoicesStep] = useState(1);
  const [currentClassData, setCurrentClassData] = useState<any>(null);

  // Background selection state
  const [showBackgroundPopup, setShowBackgroundPopup] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState('');

  // Feat selection state
  const [isManageFeatModalOpen, setIsManageFeatModalOpen] = useState(false);
  const [selectedFeats, setSelectedFeats] = useState<string[]>(character.feats || []);

  // Species handlers
  const handleSpeciesSelect = useCallback((species: string) => {
    setSelectedSpecies(species);
    setSelectedSpeciesChoices({});
    setShowSpeciesPopup(true);
  }, []);

  const handleSpeciesChoiceSelect = useCallback((category: string, choice: string) => {
    setSelectedSpeciesChoices(prev => ({
      ...prev,
      [category]: choice
    }));
  }, []);

  const handleSpeciesConfirm = useCallback(async () => {
    const speciesChoiceData = speciesChoices[selectedSpecies];
    if (!speciesChoiceData) return;

    let finalSpeciesName = selectedSpecies;
    let traits: string[] = [speciesChoiceData.description];

    // Validate choices if required
    if (speciesChoiceData.choices && speciesChoiceData.choices.length > 0) {
      const allChoicesMade = speciesChoiceData.choices.every(choice =>
        selectedSpeciesChoices[choice.category]
      );

      if (!allChoicesMade) return;

      // Build traits from selected choices
      speciesChoiceData.choices.forEach(choiceCategory => {
        const selectedOption = selectedSpeciesChoices[choiceCategory.category];
        if (selectedOption) {
          const optionData = choiceCategory.options.find(opt => opt.name === selectedOption);
          if (optionData) {
            traits.push(`${choiceCategory.category}: ${optionData.name} - ${optionData.description}`);
          }
        }
      });
    }

    // Apply skill proficiencies
    const updatedSkills = { ...character.skills };

    if (speciesChoiceData.choices && speciesChoiceData.choices.length > 0) {
      speciesChoiceData.choices.forEach(choiceCategory => {
        const selectedOption = selectedSpeciesChoices[choiceCategory.category];
        if (selectedOption && choiceCategory.category === 'Keen Senses') {
          const skillName = selectedOption;
          if (updatedSkills[skillName]) {
            updatedSkills[skillName] = {
              ...updatedSkills[skillName],
              proficient: true
            };
          }
        }
      });
    }

    // Fetch database species data
    try {
      const response = await speciesService.getByName(selectedSpecies);
      if (response.data) {
        // Add database traits
        if (response.data.traits) {
          const databaseTraits = Array.isArray(response.data.traits)
            ? response.data.traits
            : Object.values(response.data.traits || {});

          databaseTraits.forEach((trait: any) => {
            if (typeof trait === 'string') {
              traits.push(trait);
            } else if (trait && typeof trait === 'object') {
              if (trait.name && trait.description) {
                traits.push(`${trait.name}: ${trait.description}`);
              } else if (trait.name) {
                traits.push(trait.name);
              }
            }
          });
        }

        // Add basic species information
        if (response.data.size && response.data.size.length > 0) {
          traits.push(`Size: ${response.data.size.join(', ')}`);
        }

        if (response.data.speed) {
          const speedText = typeof response.data.speed === 'object'
            ? `Speed: ${response.data.speed.walk || 30} feet`
            : `Speed: ${response.data.speed} feet`;
          traits.push(speedText);
        }

        if (response.data.languages && response.data.languages.length > 0) {
          traits.push(`Languages: ${response.data.languages.join(', ')}`);
        }

        // Apply skill proficiencies from database
        if (response.data.skillProficiencies) {
          let dbSkillProfs = response.data.skillProficiencies;

          if (Array.isArray(dbSkillProfs)) {
            dbSkillProfs.forEach((skill: string) => {
              if (updatedSkills[skill]) {
                updatedSkills[skill] = {
                  ...updatedSkills[skill],
                  proficient: true
                };
              }
            });
          } else if (typeof dbSkillProfs === 'object') {
            Object.keys(dbSkillProfs).forEach(skill => {
              if (updatedSkills[skill]) {
                updatedSkills[skill] = {
                  ...updatedSkills[skill],
                  proficient: true
                };
              }
            });
          }
        }
      }
    } catch (error) {
      // Continue with predefined choices
    }

    const updatedCharacter = {
      ...character,
      species: finalSpeciesName,
      speciesTraits: traits,
      skills: updatedSkills
    };

    updateCharacter({
      species: finalSpeciesName,
      speciesTraits: traits,
      skills: updatedSkills
    });

    if (onSave) {
      setTimeout(() => {
        onSave(updatedCharacter, { silent: true });
      }, 300);
    }

    setShowSpeciesPopup(false);
    setSelectedSpecies('');
    setSelectedSpeciesChoices({});
  }, [selectedSpecies, selectedSpeciesChoices, character, updateCharacter, onSave]);

  const handleSpeciesCancel = useCallback(() => {
    setShowSpeciesPopup(false);
    setSelectedSpecies('');
    setSelectedSpeciesChoices({});
  }, []);

  // Class handlers
  const handleClassSelect = useCallback(async (className: string) => {
    setSelectedClass(className);
    setSelectedClassSkills([]);
    setSelectedClassChoices({});
    setClassChoicesStep(1);
    setCurrentClassData(null);

    try {
      const response = await classService.getByName(className);
      if (response.data) {
        setCurrentClassData(response.data);
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
    }

    setShowClassPopup(true);
  }, []);

  const handleClassSkillToggle = useCallback((skill: string) => {
    setSelectedClassSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        const requiredSkillCount = CLASS_SKILL_CHOICES[selectedClass as keyof typeof CLASS_SKILL_CHOICES] || 2;
        if (prev.length < requiredSkillCount) {
          return [...prev, skill];
        }
        return prev;
      }
    });
  }, [selectedClass]);

  const handleClassChoiceToggle = useCallback((category: string, choice: string, maxCount: number) => {
    setSelectedClassChoices(prev => {
      const currentChoices = prev[category] || [];

      if (currentChoices.includes(choice)) {
        return {
          ...prev,
          [category]: currentChoices.filter(c => c !== choice)
        };
      } else if (currentChoices.length < maxCount) {
        return {
          ...prev,
          [category]: [...currentChoices, choice]
        };
      }

      return prev;
    });
  }, []);

  const handleClassNextStep = useCallback(() => {
    setClassChoicesStep(2);
  }, []);

  const handleClassPrevStep = useCallback(() => {
    setClassChoicesStep(1);
  }, []);

  const handleClassCancel = useCallback(() => {
    setShowClassPopup(false);
    setSelectedClass('');
    setSelectedClassSkills([]);
    setSelectedClassChoices({});
    setClassChoicesStep(1);
    setCurrentClassData(null);
  }, []);

  const handleClassConfirm = useCallback(async () => {
    if (!selectedClass || !currentClassData) return;

    // Validate required skill selections
    const requiredSkillCount = CLASS_SKILL_CHOICES[selectedClass as keyof typeof CLASS_SKILL_CHOICES] || 2;
    if (selectedClassSkills.length !== requiredSkillCount) {
      alert(`Please select exactly ${requiredSkillCount} skills`);
      return;
    }

    // Build class traits from selected choices and database data
    let traits: string[] = [];

    // Add basic class information
    if (currentClassData.hitDie) {
      traits.push(`Hit Die: d${currentClassData.hitDie}`);
    }

    if (currentClassData.primaryAbility) {
      const abilities = Array.isArray(currentClassData.primaryAbility)
        ? currentClassData.primaryAbility.join(' or ')
        : currentClassData.primaryAbility;
      traits.push(`Primary Ability: ${abilities}`);
    }

    if (currentClassData.savingThrowProficiencies) {
      const saves = Array.isArray(currentClassData.savingThrowProficiencies)
        ? currentClassData.savingThrowProficiencies.join(', ')
        : currentClassData.savingThrowProficiencies;
      traits.push(`Saving Throw Proficiencies: ${saves}`);
    }

    // Add class features and traits from database
    if (currentClassData.features) {
      const features = Array.isArray(currentClassData.features)
        ? currentClassData.features
        : Object.values(currentClassData.features || {});

      features.forEach((feature: any) => {
        if (typeof feature === 'string') {
          traits.push(feature);
        } else if (feature && typeof feature === 'object') {
          if (feature.name && feature.description) {
            traits.push(`${feature.name}: ${feature.description}`);
          } else if (feature.name) {
            traits.push(feature.name);
          }
        }
      });
    }

    // Apply skill proficiencies
    const updatedSkills = { ...character.skills };
    selectedClassSkills.forEach(skill => {
      if (updatedSkills[skill]) {
        updatedSkills[skill] = {
          ...updatedSkills[skill],
          proficient: true
        };
      }
    });

    // Build final updated character
    const updatedCharacter = {
      ...character,
      class: selectedClass,
      classFeatures: traits,
      skills: updatedSkills
    };

    updateCharacter({
      class: selectedClass,
      classFeatures: traits,
      skills: updatedSkills
    });

    if (onSave) {
      setTimeout(() => {
        onSave(updatedCharacter, { silent: true });
      }, 300);
    }

    setShowClassPopup(false);
    setSelectedClass('');
    setSelectedClassSkills([]);
    setSelectedClassChoices({});
    setClassChoicesStep(1);
    setCurrentClassData(null);
  }, [selectedClass, currentClassData, selectedClassSkills, selectedClassChoices, character, updateCharacter, onSave]);

  // Background handlers
  const handleBackgroundSelect = useCallback((background: string) => {
    setSelectedBackground(background);
    setShowBackgroundPopup(true);
  }, []);

  const handleBackgroundConfirm = useCallback(() => {
    const backgroundData = backgroundsData[selectedBackground];
    if (!backgroundData) return;

    const updatedCharacter = {
      ...character,
      background: selectedBackground
    };

    updateCharacter({
      background: selectedBackground
    });

    if (onSave) {
      setTimeout(() => {
        onSave(updatedCharacter, { silent: true });
      }, 300);
    }

    setShowBackgroundPopup(false);
    setSelectedBackground('');
  }, [selectedBackground, character, updateCharacter, onSave]);

  const handleBackgroundCancel = useCallback(() => {
    setShowBackgroundPopup(false);
    setSelectedBackground('');
  }, []);

  // Feat handlers
  const handleFeatToggle = useCallback((featName: string) => {
    setSelectedFeats(prev => {
      if (prev.includes(featName)) {
        return prev.filter(name => name !== featName);
      } else {
        return [...prev, featName];
      }
    });
  }, []);

  const handleFeatSelectionConfirm = useCallback(() => {
    updateCharacter({ feats: selectedFeats });
    setIsManageFeatModalOpen(false);

    if (onSave) {
      setTimeout(() => {
        onSave({ ...character, feats: selectedFeats }, { silent: true });
      }, 300);
    }
  }, [selectedFeats, updateCharacter, character, onSave]);

  const handleFeatSelectionCancel = useCallback(() => {
    setSelectedFeats(character.feats || []);
    setIsManageFeatModalOpen(false);
  }, [character.feats]);

  return {
    // Species state
    showSpeciesPopup,
    setShowSpeciesPopup,
    selectedSpecies,
    selectedSpeciesChoices,

    // Class state
    showClassPopup,
    setShowClassPopup,
    selectedClass,
    selectedClassSkills,
    selectedClassChoices,
    classChoicesStep,
    currentClassData,

    // Background state
    showBackgroundPopup,
    setShowBackgroundPopup,
    selectedBackground,

    // Feat state
    isManageFeatModalOpen,
    setIsManageFeatModalOpen,
    selectedFeats,
    setSelectedFeats,

    // Species handlers
    handleSpeciesSelect,
    handleSpeciesChoiceSelect,
    handleSpeciesConfirm,
    handleSpeciesCancel,

    // Class handlers
    handleClassSelect,
    handleClassSkillToggle,
    handleClassChoiceToggle,
    handleClassNextStep,
    handleClassPrevStep,
    handleClassConfirm,
    handleClassCancel,

    // Background handlers
    handleBackgroundSelect,
    handleBackgroundConfirm,
    handleBackgroundCancel,

    // Feat handlers
    handleFeatToggle,
    handleFeatSelectionConfirm,
    handleFeatSelectionCancel,
  };
};