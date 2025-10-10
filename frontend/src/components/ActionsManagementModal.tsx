import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

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
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
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

// Types
interface Action {
  name: string;
  atkBonus: string;
  damage: string;
}

interface ActionsManagementModalProps {
  isOpen: boolean;
  actions: Action[];
  equippedItems?: any[]; // Will be passed from parent
  characterData?: any; // For calculating attack bonuses
  onSave: (actions: Action[]) => void;
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
  const [currentActions, setCurrentActions] = useState<Action[]>([]);
  const [newAction, setNewAction] = useState<Action>({
    name: '',
    atkBonus: '',
    damage: ''
  });

  // Initialize with provided actions when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentActions([...actions]);
      setNewAction({ name: '', atkBonus: '', damage: '' });
    }
  }, [isOpen, actions]);

  const handleActionUpdate = (index: number, field: keyof Action, value: string) => {
    const updatedActions = [...currentActions];
    updatedActions[index] = {
      ...updatedActions[index],
      [field]: value
    };
    setCurrentActions(updatedActions);
  };

  const handleRemoveAction = (index: number) => {
    const updatedActions = currentActions.filter((_, i) => i !== index);
    setCurrentActions(updatedActions);
  };

  const handleAddAction = () => {
    if (!newAction.name.trim()) return;

    setCurrentActions([...currentActions, { ...newAction }]);
    setNewAction({ name: '', atkBonus: '', damage: '' });
  };

  const handlePopulateFromEquipped = () => {
    if (!equippedItems || !characterData) return;

    // Calculate proficiency bonus
    const profBonus = Math.floor((characterData.level - 1) / 4) + 2;

    // Calculate ability modifiers
    const strMod = Math.floor((characterData.abilityScores?.strength || 10) / 2) - 5;
    const dexMod = Math.floor((characterData.abilityScores?.dexterity || 10) / 2) - 5;

    const weaponActions: Action[] = [];

    equippedItems.forEach(item => {
      if (!item || !item.name) return;

      const itemName = item.name.toLowerCase();

      // Check if it's a weapon using comprehensive weapon list
      const weaponTypes = [
        // Melee weapons
        'sword', 'axe', 'mace', 'dagger', 'spear', 'javelin', 'club', 'rapier', 'scimitar',
        'hammer', 'flail', 'morningstar', 'pike', 'glaive', 'halberd', 'lance', 'trident',
        'whip', 'quarterstaff', 'staff', 'maul', 'greataxe', 'greatsword', 'longsword',
        'shortsword', 'sickle', 'handaxe', 'battleaxe', 'warhammer',
        // Ranged weapons
        'bow', 'crossbow', 'longbow', 'shortbow', 'blowgun', 'sling', 'dart', 'net'
      ];

      const isWeapon = weaponTypes.some(type => itemName.includes(type));

      if (isWeapon) {
        // Determine if it's finesse or ranged
        const isFinesse = ['dagger', 'rapier', 'scimitar', 'shortsword', 'whip', 'dart'].some(w => itemName.includes(w));
        const isRanged = ['bow', 'crossbow', 'longbow', 'shortbow', 'blowgun', 'sling', 'dart', 'net'].some(w => itemName.includes(w));

        // Calculate attack bonus
        let atkMod = isRanged || isFinesse ? Math.max(strMod, dexMod) : strMod;
        const magicBonus = item.name.match(/^\+(\d+)/) ? parseInt(item.name.match(/^\+(\d+)/)[1]) : 0;
        const attackBonus = profBonus + atkMod + magicBonus;

        // Determine damage (this is simplified - ideally would look up actual weapon damage)
        let damage = item.customProperties?.damage || '';
        if (!damage) {
          // Default damage dice based on weapon type
          if (itemName.includes('dagger') || itemName.includes('dart')) damage = '1d4';
          else if (itemName.includes('shortsword') || itemName.includes('scimitar')) damage = '1d6';
          else if (itemName.includes('longsword') || itemName.includes('rapier')) damage = '1d8';
          else if (itemName.includes('greatsword') || itemName.includes('maul')) damage = '2d6';
          else if (itemName.includes('greataxe')) damage = '1d12';
          else if (itemName.includes('handaxe')) damage = '1d6';
          else if (itemName.includes('battleaxe') || itemName.includes('warhammer')) damage = '1d8';
          else if (itemName.includes('club') || itemName.includes('sling')) damage = '1d4';
          else if (itemName.includes('mace') || itemName.includes('quarterstaff')) damage = '1d6';
          else if (itemName.includes('flail') || itemName.includes('morningstar') || itemName.includes('pike')) damage = '1d8';
          else if (itemName.includes('glaive') || itemName.includes('halberd')) damage = '1d10';
          else if (itemName.includes('lance')) damage = '1d12';
          else if (itemName.includes('spear') || itemName.includes('trident') || itemName.includes('javelin')) damage = '1d6';
          else if (itemName.includes('whip')) damage = '1d4';
          else if (itemName.includes('shortbow')) damage = '1d6';
          else if (itemName.includes('longbow') || itemName.includes('crossbow')) damage = '1d8';
          else if (itemName.includes('blowgun')) damage = '1';
          else if (itemName.includes('net')) damage = '—';
          else damage = '1d6'; // Default
        }

        // Add damage modifier
        if (damage && damage !== '—') {
          const modifier = atkMod + magicBonus;
          const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
          damage = `${damage}${modifierStr}`;

          // Add damage type
          if (itemName.includes('bow') || itemName.includes('crossbow') || itemName.includes('sling') || itemName.includes('dart') || itemName.includes('blowgun')) {
            damage += ' piercing';
          } else if (itemName.includes('sword') || itemName.includes('dagger') || itemName.includes('rapier') || itemName.includes('scimitar') || itemName.includes('glaive') || itemName.includes('halberd') || itemName.includes('axe')) {
            damage += ' slashing';
          } else if (itemName.includes('spear') || itemName.includes('pike') || itemName.includes('javelin') || itemName.includes('trident') || itemName.includes('lance')) {
            damage += ' piercing';
          } else if (itemName.includes('net')) {
            damage = 'Restrained';
          } else {
            damage += ' bludgeoning';
          }
        }

        weaponActions.push({
          name: item.name,
          atkBonus: `+${attackBonus}`,
          damage: damage
        });
      }
    });

    // Replace current actions with weapon actions, keeping any non-weapon actions
    const nonWeaponActions = currentActions.filter(action => {
      const actionName = action.name.toLowerCase();
      return !equippedItems.some(item => item && item.name && item.name.toLowerCase() === actionName);
    });

    setCurrentActions([...weaponActions, ...nonWeaponActions]);
  };

  const handleSave = () => {
    // Filter out empty actions
    const validActions = currentActions.filter(action =>
      action.name.trim() !== ''
    );
    onSave(validActions);
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
            currentActions.map((action, index) => (
              <ActionCard key={index}>
                <ActionHeader>
                  <ActionName>{action.name || `Action ${index + 1}`}</ActionName>
                  <DeleteActionButton onClick={() => handleRemoveAction(index)}>
                    ✕
                  </DeleteActionButton>
                </ActionHeader>

                <ActionForm>
                  <FormGroup>
                    <Label>Action Name</Label>
                    <Input
                      type="text"
                      value={action.name}
                      placeholder="e.g., Longsword, Fire Bolt, Dash"
                      onChange={(e) => handleActionUpdate(index, 'name', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Attack Bonus / DC</Label>
                    <Input
                      type="text"
                      value={action.atkBonus}
                      placeholder="e.g., +5, DC 13"
                      onChange={(e) => handleActionUpdate(index, 'atkBonus', e.target.value)}
                    />
                  </FormGroup>

                  <FullWidthGroup>
                    <Label>Damage & Type</Label>
                    <Input
                      type="text"
                      value={action.damage}
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
                value={newAction.atkBonus}
                placeholder="e.g., +5, DC 13"
                onChange={(e) => setNewAction({...newAction, atkBonus: e.target.value})}
              />
            </FormGroup>

            <FullWidthGroup>
              <Label>Damage & Type</Label>
              <Input
                type="text"
                value={newAction.damage}
                placeholder="e.g., 1d8+3 slashing, 1d10 fire"
                onChange={(e) => setNewAction({...newAction, damage: e.target.value})}
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