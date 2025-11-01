import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { CharacterAction } from '../types/characterSheet';
import { buildWeaponAction } from '@/utils/weaponCalculator';

// Modal Overlay
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  backdrop-filter: blur(3px);
  padding: 3rem 1rem 2rem;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(206, 144, 22, 0.6);
    border-radius: 6px;

    &:hover {
      background: rgba(206, 144, 22, 0.8);
    }
  }
`;

// Main Modal Container
const ActionsModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #ce9016;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 800px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 20px;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
`;

const ModalTitle = styled.h2`
  color: #ce9016;
  margin: 0 0 20px 0;
  font-size: 1.4rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid #ce9016;
  padding-bottom: 10px;
`;

// Actions List Container
const ActionsContainer = styled.div`
  margin-bottom: 20px;
`;

const ActionCard = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid rgba(139, 105, 20, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(139, 105, 20, 0.15);
    border-color: rgba(139, 105, 20, 0.5);
  }
`;

const ActionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const ActionName = styled.h3`
  color: #ce9016;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const DeleteActionButton = styled.button`
  background: linear-gradient(145deg, #dc3545, #c82333);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ActionForm = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: #8b6914;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  background: rgba(139, 105, 20, 0.2);
  border: 2px solid #8b6914;
  border-radius: 6px;
  color: #f4e7d1;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  padding: 10px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
    box-shadow: 0 0 8px rgba(206, 144, 22, 0.3);
  }

  &::placeholder {
    color: rgba(244, 231, 209, 0.5);
  }
`;

const FullWidthGroup = styled(FormGroup)`
  grid-column: 1 / -1;
`;

// Add New Action Section
const AddActionSection = styled.div`
  background: rgba(206, 144, 22, 0.1);
  border: 2px dashed #ce9016;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const AddActionTitle = styled.h3`
  color: #ce9016;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  text-align: center;
`;

// Button Container
const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AddButton = styled(Button)`
  background: linear-gradient(145deg, #28a745, #20892c);
  color: white;

  &:hover {
    background: linear-gradient(145deg, #20892c, #1e7e34);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
  }

  &:disabled {
    background: linear-gradient(145deg, #6c757d, #5a6268);
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const CancelButton = styled(Button)`
  background: rgba(139, 69, 19, 0.8);
  color: #f4e7d1;

  &:hover {
    background: rgba(139, 69, 19, 1);
    transform: translateY(-2px);
  }
`;

const SaveButton = styled(Button)`
  background: linear-gradient(145deg, #ce9016, #b8860b);
  color: #2c1810;

  &:hover {
    background: linear-gradient(145deg, #b8860b, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
  }
`;

const PopulateButton = styled(Button)`
  background: linear-gradient(145deg, #6a5acd, #483d8b);
  color: white;

  &:hover {
    background: linear-gradient(145deg, #483d8b, #352a69);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(106, 90, 205, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #8b6914;
  font-style: italic;
  padding: 40px;
  font-size: 1.1rem;
`;

type ActionDraft = {
  name: string;
  attack: string;
  damage: string;
};

type EditableAction = {
  draft: ActionDraft;
  original: CharacterAction | null;
};

interface ActionsManagementModalProps {
  isOpen: boolean;
  actions: CharacterAction[];
  equippedItems?: any[]; // Will be passed from parent
  characterData?: any; // For calculating attack bonuses
  onSave: (actions: CharacterAction[]) => void;
  onCancel: () => void;
}

const ActionsManagementModal: React.FC<ActionsManagementModalProps> = ({
  isOpen,
  actions,
  equippedItems,
  characterData,
  onSave,
  onCancel
}) => {
  const createEmptyCharacterAction = (): CharacterAction => ({
    name: '',
    type: 'custom',
    attack: null,
    damage: null,
    healing: null,
    displayOverrides: { attack: '', damage: '' },
    legacy: { atkBonus: '', damage: '' },
  });

  const toDraft = (action: CharacterAction): ActionDraft => ({
    name: action.name ?? '',
    attack: action.displayOverrides?.attack ?? action.legacy?.atkBonus ?? '',
    damage: action.displayOverrides?.damage ?? action.legacy?.damage ?? '',
  });

  const [currentActions, setCurrentActions] = useState<EditableAction[]>([]);
  const [newAction, setNewAction] = useState<ActionDraft>({
    name: '',
    attack: '',
    damage: ''
  });

  // Initialize with provided actions when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentActions(actions.map((action) => ({
        original: action,
        draft: toDraft(action),
      })));
      setNewAction({ name: '', attack: '', damage: '' });
    }
  }, [isOpen, actions]);

  const handleActionUpdate = (index: number, field: keyof ActionDraft, value: string) => {
    setCurrentActions((prev) => {
      const next = [...prev];
      const existing = next[index] ?? { original: null, draft: { name: '', attack: '', damage: '' } };
      next[index] = {
        original: existing.original,
        draft: {
          ...existing.draft,
          [field]: value,
        },
      };
      return next;
    });
  };

  const handleRemoveAction = (index: number) => {
    setCurrentActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddAction = () => {
    if (!newAction.name.trim()) return;

    setCurrentActions((prev) => [
      ...prev,
      {
        original: null,
        draft: { ...newAction },
      },
    ]);
    setNewAction({ name: '', attack: '', damage: '' });
  };

  const handlePopulateFromEquipped = () => {
    if (!equippedItems || !characterData) return;

    const weaponDrafts: EditableAction[] = [];

    equippedItems.forEach((item) => {
      if (!item || !item.name) return;

      try {
        const action = buildWeaponAction(item, characterData);
        weaponDrafts.push({
          original: action,
          draft: toDraft(action),
        });
      } catch (error) {
        console.warn('Unable to derive weapon action for item', item, error);
      }
    });

    if (weaponDrafts.length === 0) {
      return;
    }

    setCurrentActions((prev) => {
      const nonWeapon = prev.filter(({ original }) => original?.type !== 'weapon');
      return [...weaponDrafts, ...nonWeapon];
    });
  };

  const handleSave = () => {
    const transformed = currentActions
      .map(({ original, draft }) => {
        if (!draft.name.trim()) {
          return null;
        }

        const base = original ? { ...original } : createEmptyCharacterAction();
        base.name = draft.name;
        base.displayOverrides = {
          ...(base.displayOverrides ?? {}),
          attack: draft.attack,
          damage: draft.damage,
        };
        base.legacy = {
          ...(base.legacy ?? {}),
          atkBonus: draft.attack,
          damage: draft.damage,
        };
        return base;
      })
      .filter((action): action is CharacterAction => Boolean(action));

    onSave(transformed);
  };

  const isNewActionValid = newAction.name.trim() !== '';

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <ActionsModal>
        <ModalTitle>⚔️ Manage Actions & Combat Options</ModalTitle>

        {/* Populate from Equipped Button */}
        {equippedItems && equippedItems.length > 0 && (
          <ButtonContainer style={{ marginBottom: '20px' }}>
            <PopulateButton onClick={handlePopulateFromEquipped}>
              🗡️ Populate from Equipped Items
            </PopulateButton>
          </ButtonContainer>
        )}

        <ActionsContainer>
          {currentActions.length === 0 ? (
            <EmptyState>
              No actions yet. Add your first action below!
            </EmptyState>
          ) : (
            currentActions.map(({ draft }, index) => (
              <ActionCard key={index}>
                <ActionHeader>
                  <ActionName>{draft.name || `Action ${index + 1}`}</ActionName>
                  <DeleteActionButton onClick={() => handleRemoveAction(index)}>
                    ✕
                  </DeleteActionButton>
                </ActionHeader>

                <ActionForm>
                  <FormGroup>
                    <Label>Action Name</Label>
                    <Input
                      type="text"
                      value={draft.name}
                      placeholder="e.g., Longsword, Fire Bolt, Dash"
                      onChange={(e) => handleActionUpdate(index, 'name', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Attack Bonus / DC</Label>
                    <Input
                      type="text"
                      value={draft.attack}
                      placeholder="e.g., +5, DC 13"
                      onChange={(e) => handleActionUpdate(index, 'attack', e.target.value)}
                    />
                  </FormGroup>

                  <FullWidthGroup>
                    <Label>Damage & Type</Label>
                    <Input
                      type="text"
                      value={draft.damage}
                      placeholder="e.g., 1d8+3 slashing, 1d10 fire"
                      onChange={(e) => handleActionUpdate(index, 'damage', e.target.value)}
                    />
                  </FullWidthGroup>
                </ActionForm>
              </ActionCard>
            ))
          )}
        </ActionsContainer>

        {/* Add New Action Section */}
        <AddActionSection>
          <AddActionTitle>➕ Add New Action</AddActionTitle>
          <ActionForm>
            <FormGroup>
              <Label>Action Name</Label>
              <Input
                type="text"
                value={newAction.name}
                placeholder="e.g., Longsword, Fire Bolt, Dash"
                onChange={(e) => setNewAction({...newAction, name: e.target.value})}
              />
            </FormGroup>

            <FormGroup>
              <Label>Attack Bonus / DC</Label>
              <Input
                type="text"
                value={newAction.attack}
                placeholder="e.g., +5, DC 13"
                onChange={(e) => setNewAction({ ...newAction, attack: e.target.value })}
              />
            </FormGroup>

            <FullWidthGroup>
              <Label>Damage & Type</Label>
              <Input
                type="text"
                value={newAction.damage}
                placeholder="e.g., 1d8+3 slashing, 1d10 fire"
                onChange={(e) => setNewAction({ ...newAction, damage: e.target.value })}
              />
            </FullWidthGroup>
          </ActionForm>

          <ButtonContainer>
            <AddButton
              onClick={handleAddAction}
              disabled={!isNewActionValid}
            >
              Add Action
            </AddButton>
          </ButtonContainer>
        </AddActionSection>

        {/* Modal Actions */}
        <ButtonContainer>
          <CancelButton onClick={onCancel}>
            Cancel
          </CancelButton>
          <SaveButton onClick={handleSave}>
            Save Changes
          </SaveButton>
        </ButtonContainer>
      </ActionsModal>
    </ModalOverlay>
  );
};

export default ActionsManagementModal;
