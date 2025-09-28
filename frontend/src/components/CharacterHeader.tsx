import { CharacterSheetData } from '../types/characterSheet';
import { calculateDerivedValues } from '../services/characterCalculations';
import { speciesOptions, classOptions } from '../constants/characterOptions';
// import { backgroundsData } from './BackgroundSelectionModal'; // Removed - now uses API
import {
  CharacterNameSection,
  CharacterHeaderRow,
  CharacterName,
  TopStatBox,
  CharacterInfoGrid,
  InfoBox,
  EditableInput,
  SectionEditControls,
  SectionEditButton,
} from '../styles/components';

interface CharacterHeaderProps {
  character: CharacterSheetData;
  editingSections: { characterInfo: boolean };
  updateCharacter: (updates: Partial<CharacterSheetData>) => void;
  onSave?: ((character: CharacterSheetData, options?: { silent?: boolean }) => void | Promise<void>) | undefined;
  toggleSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  cancelSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  selection: {
    handleSpeciesSelect: (species: string) => void;
    handleClassSelect: (cls: string) => void;
    handleBackgroundSelect: (background: string) => void;
    setIsManageFeatModalOpen: (open: boolean) => void;
  };
}

export default function CharacterHeader({
  character,
  editingSections,
  updateCharacter,
  onSave,
  toggleSectionEdit,
  cancelSectionEdit,
  selection,
}: CharacterHeaderProps) {
  const derivedValues = calculateDerivedValues(character);
  // TODO: Replace with API call for background options
  const backgroundOptions: string[] = []; // Temporary placeholder until API integration

  return (
    <CharacterNameSection>
      <CharacterHeaderRow>
        <TopStatBox>
          <div className="stat-label">Level</div>
          <div className="stat-value">
            <EditableInput
              type="number"
              value={character.level}
              onChange={(e) => {
                const newLevel = parseInt(e.target.value) || 1;
                const updatedCharacter = { ...character, level: newLevel };
                updateCharacter({ level: newLevel });

                // Auto-save level changes
                if (onSave) {
                  setTimeout(() => {
                    onSave(updatedCharacter, { silent: true });
                  }, 300);
                }
              }}
              min="1"
              max="20"
            />
          </div>
        </TopStatBox>

        <CharacterName>
          <EditableInput
            value={character.name}
            onChange={(e) => updateCharacter({ name: e.target.value })}
            placeholder="Character Name"
          />
        </CharacterName>

        <TopStatBox>
          <div className="stat-label">Proficiency Bonus</div>
          <div className="stat-value">
            +{derivedValues.proficiencyBonus}
          </div>
        </TopStatBox>
      </CharacterHeaderRow>

      <CharacterInfoGrid>
        <InfoBox>
          <div className="label">Species</div>
          <div className="value">
            {editingSections.characterInfo ? (
              <select
                value={character.species}
                onChange={(e) =>
                  selection.handleSpeciesSelect(e.target.value)
                }
              >
                <option value="">Select Species</option>
                {speciesOptions.map((species) => (
                  <option key={species} value={species}>
                    {species}
                  </option>
                ))}
              </select>
            ) : (
              character.species || 'Select Species'
            )}
          </div>
        </InfoBox>
        <InfoBox>
          <div className="label">Class</div>
          <div className="value">
            {editingSections.characterInfo ? (
              <select
                value={character.class}
                onChange={(e) => {
                  if (e.target.value) {
                    selection.handleClassSelect(e.target.value);
                  } else {
                    updateCharacter({ class: '' });
                  }
                }}
              >
                <option value="">Select Class</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            ) : (
              character.class || 'Select Class'
            )}
          </div>
        </InfoBox>
        <InfoBox>
          <div className="label">Background</div>
          <div className="value">
            {editingSections.characterInfo ? (
              <select
                value={character.background}
                onChange={(e) => {
                  if (e.target.value) {
                    selection.handleBackgroundSelect(e.target.value);
                  }
                }}
              >
                <option value="">Select Background</option>
                {backgroundOptions.map((background) => (
                  <option key={background} value={background}>
                    {background}
                  </option>
                ))}
              </select>
            ) : (
              character.background || 'Select Background'
            )}
          </div>
        </InfoBox>
        <InfoBox>
          <div className="label">Subclass</div>
          <div className="value">
            {editingSections.characterInfo ? (
              <EditableInput
                value={character.subclass}
                onChange={(e) =>
                  updateCharacter({ subclass: e.target.value })
                }
                placeholder="Enter Subclass"
              />
            ) : (
              character.subclass || 'None'
            )}
          </div>
        </InfoBox>
        <InfoBox>
          <div className="label">Feats</div>
          <div className="value">
            <div
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => selection.setIsManageFeatModalOpen(true)}
            >
              {character.feats && character.feats.length > 0
                ? character.feats.join(', ')
                : 'Select Feats'}
            </div>
          </div>
        </InfoBox>
      </CharacterInfoGrid>

      <SectionEditControls>
        {editingSections.characterInfo ? (
          <>
            <SectionEditButton
              variant="save"
              onClick={() => toggleSectionEdit('characterInfo')}
            >
              ✓
            </SectionEditButton>
            <SectionEditButton
              onClick={() => cancelSectionEdit('characterInfo')}
              style={{
                background: 'linear-gradient(145deg, #dc3545, #c82333)',
              }}
            >
              ✕
            </SectionEditButton>
          </>
        ) : (
          <SectionEditButton
            onClick={() => toggleSectionEdit('characterInfo')}
          >
            ✎
          </SectionEditButton>
        )}
      </SectionEditControls>
    </CharacterNameSection>
  );
}