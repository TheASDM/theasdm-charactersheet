import { CharacterSheetData, formatModifier, skillToAbility } from '../types/characterSheet';
import { calculateDerivedValues, getSkillModifiers } from '../services/characterCalculations';
import {
  SkillsSection,
  SkillsList,
  SkillItem,
  SectionTitle,
  SectionEditControls,
  SectionEditButton,
} from '../styles/components';

interface CharacterSkillsSectionProps {
  character: CharacterSheetData;
  editingSections: { skills: boolean };
  updateCharacter: (updates: Partial<CharacterSheetData>) => void;
  toggleSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  cancelSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  skills: {
    handleManageSkills: () => void;
  };
}

export default function CharacterSkillsSection({
  character,
  editingSections,
  updateCharacter,
  toggleSectionEdit,
  cancelSectionEdit,
  skills,
}: CharacterSkillsSectionProps) {
  const derivedValues = calculateDerivedValues(character);
  const skillModifiers = getSkillModifiers(character, derivedValues.proficiencyBonus);

  // Helper function to get ability abbreviation
  const getAbilityAbbreviation = (ability: string): string => {
    const abbreviations: { [key: string]: string } = {
      'strength': 'STR',
      'dexterity': 'DEX',
      'constitution': 'CON',
      'intelligence': 'INT',
      'wisdom': 'WIS',
      'charisma': 'CHA',
    };
    return abbreviations[ability] || '';
  };

  // Convert skill modifiers to the expected format
  const skillsData: Record<string, { proficient: boolean; modifier: number }> = {};
  Object.entries(skillModifiers).forEach(([skill, baseModifier]) => {
    // Check both character.skills and character.proficiencies.skills for proficiency
    const isManuallyProficient = character.skills[skill]?.proficient || false;
    const isSystemProficient = character.proficiencies?.skills?.includes(skill) || false;
    const isProficient = isManuallyProficient || isSystemProficient;

    // Note: skillModifiers from getSkillModifiers already includes proficiency bonus
    // based on character.proficiencies.skills, but we need to account for manual proficiency too
    let modifier = baseModifier;

    // If manually proficient but not system proficient, add proficiency bonus
    if (isManuallyProficient && !isSystemProficient) {
      modifier = baseModifier + derivedValues.proficiencyBonus;
    }
    // If not manually proficient but system proficient, the modifier is already correct from getSkillModifiers
    // If both are proficient, the modifier is already correct from getSkillModifiers

    skillsData[skill] = {
      proficient: isProficient,
      modifier: modifier,
    };
  });

  return (
    <SkillsSection>
      <SectionTitle>Skills</SectionTitle>
      <SkillsList>
        {[
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
        ].map((skill) => {
          const skillData = skillsData[skill] || {
            proficient: false,
            modifier: 0,
          };
          const abilityKey = skillToAbility[skill];
          const abilityAbbr = abilityKey ? getAbilityAbbreviation(abilityKey) : '';

          return (
            <SkillItem key={skill} className={skillData.proficient ? 'proficient' : ''}>
              {editingSections.skills ? (
                <input
                  type="checkbox"
                  checked={skillData.proficient}
                  onChange={(e) =>
                    updateCharacter({
                      skills: {
                        ...character.skills,
                        [skill]: {
                          proficient: e.target.checked,
                          modifier: skillData.modifier,
                        },
                      },
                    })
                  }
                />
              ) : (
                skillData.proficient && <span className="proficiency-marker">●</span>
              )}
              <span className="skill-name">
                {skill} <span className="ability-abbr">({abilityAbbr})</span>
              </span>
              <span className="skill-bonus">
                {formatModifier(skillData.modifier)}
              </span>
            </SkillItem>
          );
        })}
      </SkillsList>

      <SectionEditControls>
        {editingSections.skills ? (
          <>
            <SectionEditButton
              variant="save"
              onClick={() => toggleSectionEdit('skills')}
            >
              ✓
            </SectionEditButton>
            <SectionEditButton
              onClick={() => cancelSectionEdit('skills')}
              style={{
                background:
                  'linear-gradient(145deg, #dc3545, #c82333)',
              }}
            >
              ✕
            </SectionEditButton>
          </>
        ) : (
          <>
            <SectionEditButton
              onClick={() => toggleSectionEdit('skills')}
            >
              ✎
            </SectionEditButton>
            <SectionEditButton
              onClick={skills.handleManageSkills}
              style={{
                background:
                  'linear-gradient(145deg, #6a4bc1, #5a3fa8)',
              }}
            >
              🎯
            </SectionEditButton>
          </>
        )}
      </SectionEditControls>
    </SkillsSection>
  );
}