import { CharacterSheetData } from '../types/characterSheet';
import { calculateDerivedValues } from '../services/characterCalculations';
import {
  CharacterNameSection,
  CharacterHeaderRow,
  CharacterName,
  TopStatBox,
  CharacterInfoGrid,
  InfoBox,
  EditableInput,
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
  tabBar?: React.ReactNode;
}

export default function CharacterHeader({
  character,
  updateCharacter,
  onSave,
  tabBar,
}: CharacterHeaderProps) {
  const derivedValues = calculateDerivedValues(character);

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
            {character.species || 'Select Species'}
          </div>
        </InfoBox>
        <InfoBox>
          <div className="label">Class</div>
          <div className="value">
            {character.class || 'Select Class'}
          </div>
        </InfoBox>

        {/* Tab Bar in the middle */}
        {tabBar && <div style={{ gridColumn: '3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tabBar}</div>}

        <InfoBox>
          <div className="label">Subclass</div>
          <div className="value">
            {character.subclass || 'None'}
          </div>
        </InfoBox>
        <InfoBox>
          <div className="label">Background</div>
          <div className="value">
            {character.background || 'Select Background'}
          </div>
        </InfoBox>
      </CharacterInfoGrid>
    </CharacterNameSection>
  );
}