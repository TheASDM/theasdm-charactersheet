import { CharacterSheetData, formatModifier } from '../types/characterSheet';
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

  // Convert skill modifiers to the expected format
  const skillsData: Record<string, { proficient: boolean; modifier: number }> = {};
  Object.entries(skillModifiers).forEach(([skill, modifier]) => {
    const isProficient = character.skills[skill]?.proficient || false;
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

          return (
            <SkillItem key={skill}>
              {editingSections.skills && (
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
              )}
              <span className="skill-name">{skill}</span>
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