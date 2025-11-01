import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { CharacterSheetData, InventoryItem } from '../types/characterSheet';
import {
  applyEquippedItems,
  getEquipmentMetadata,
  EQUIPPED_ITEM_CAP,
  canEquipVerbose,
} from '../services/characterCalculations';
import { characterApi } from '../services/characterApi';
import { isError } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';
import type { ToastPayload } from '@/utils/toastBus';

const InventoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InventoryHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #ce9016;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  border: 1px solid ${({ $variant }) =>
    $variant === 'secondary' ? 'rgba(206, 144, 22, 0.35)' : 'rgba(74, 222, 128, 0.6)'};
  background: ${({ $variant }) =>
    $variant === 'secondary'
      ? 'rgba(26, 26, 26, 0.65)'
      : 'linear-gradient(135deg, rgba(74, 222, 128, 0.22), rgba(21, 128, 61, 0.28))'};
  color: ${({ $variant }) => ($variant === 'secondary' ? '#f0f0f0' : '#bbf7d0')};
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const InventoryTable = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(15, 15, 15, 0.65);
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(26, 26, 26, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #c2a87a;

  @media (max-width: 640px) {
    grid-template-columns: 2fr 1fr auto;
  }
`;

const Row = styled.div<{ $equipped: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: ${({ $equipped }) =>
    $equipped ? 'rgba(74, 222, 128, 0.08)' : 'rgba(18, 18, 18, 0.75)'};
  color: ${({ $equipped }) => ($equipped ? '#f8fafc' : 'rgba(203, 213, 225, 0.8)')};
  filter: ${({ $equipped }) => ($equipped ? 'none' : 'grayscale(0.7)')};
  transition: background 0.2s ease;

  &:hover {
    background: ${({ $equipped }) =>
      $equipped ? 'rgba(74, 222, 128, 0.12)' : 'rgba(31, 41, 55, 0.55)'};
  }

  @media (max-width: 640px) {
    grid-template-columns: 2fr 1fr auto;
  }
`;

const ItemName = styled.div<{ $clickable?: boolean }>`
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: color 0.2s ease;

  ${({ $clickable }) =>
    $clickable &&
    `
    &:hover {
      color: #ce9016;
    }
  `}
`;

const ItemMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const MetaTag = styled.span<{ $variant?: 'equipped' | 'default' }>`
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  background: ${({ $variant }) =>
    $variant === 'equipped'
      ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.45), rgba(21, 128, 61, 0.5))'
      : 'rgba(148, 163, 184, 0.15)'};
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${({ $variant }) => ($variant === 'equipped' ? '#dcfce7' : '#cbd5f5')};
`;

const Quantity = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #e2e8f0;
`;

const ButtonGroup = styled.div`
  display: inline-flex;
  gap: 0.4rem;
`;

const EquipButton = styled.button<{ $equipped?: boolean }>`
  border: 1px solid ${({ $equipped }) =>
    $equipped ? 'rgba(248, 113, 113, 0.75)' : 'rgba(74, 222, 128, 0.8)'};
  background: ${({ $equipped }) =>
    $equipped
      ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.18), rgba(185, 28, 28, 0.18))'
      : 'linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(21, 128, 61, 0.2))'};
  color: ${({ $equipped }) => ($equipped ? '#fecaca' : '#bbf7d0')};
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(30, 41, 59, 0.65);
  color: rgba(226, 232, 240, 0.85);
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(51, 65, 85, 0.75);
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: rgba(203, 213, 225, 0.7);
  font-size: 0.85rem;
  letter-spacing: 0.03em;
`;

interface InventoryTabProps {
  character: CharacterSheetData;
  characterId?: number | undefined;
  onCharacterUpdate: (updated: CharacterSheetData) => void;
  onSave?: ((
    updated: CharacterSheetData,
    options?: { silent?: boolean } | undefined
  ) => void | Promise<void>) | undefined;
  onAddOfficialItem?: () => void;
  onAddCustomItem?: () => void;
  onInspectItem?: (itemName: string) => void;
}

const InventoryTab = ({
  character,
  characterId,
  onCharacterUpdate,
  onSave,
  onAddOfficialItem,
  onAddCustomItem,
  onInspectItem,
}: InventoryTabProps) => {
  const { addToast } = useToast();
  const [isPersisting, setIsPersisting] = useState(false);

  const equippedIds = character.equippedItemIds ?? [];
  const equippedSet = useMemo(() => new Set(equippedIds), [equippedIds]);

  const items = useMemo(() => {
    const inventory = character.inventory ?? [];
    return [...inventory].sort((a, b) => a.name.localeCompare(b.name));
  }, [character.inventory]);

  const evaluateEquipEligibility = (item: InventoryItem): { ok: boolean; error?: string } => {
    const check = canEquipVerbose(character, item);
    return check.ok ? { ok: true } : { ok: false, error: check.reason ?? 'Cannot equip this item.' };
  };

  const applyEquipmentRules = (item: InventoryItem, nextEquipped: string[]): string[] => {
    const metadata = getEquipmentMetadata(item.name);

    if (metadata.category === 'armor') {
      return nextEquipped.filter((id) => {
        if (id === item.id) {
          return true;
        }
        const candidate = items.find((candidateItem) => candidateItem.id === id);
        if (!candidate) {
          return true;
        }
        const candidateMetadata = getEquipmentMetadata(candidate.name);
        return candidateMetadata.category !== 'armor';
      });
    }

    if (metadata.category === 'shield') {
      return nextEquipped.filter((id) => {
        if (id === item.id) {
          return true;
        }
        const candidate = items.find((candidateItem) => candidateItem.id === id);
        if (!candidate) {
          return true;
        }
        const candidateMetadata = getEquipmentMetadata(candidate.name);
        return candidateMetadata.category !== 'shield';
      });
    }

    return nextEquipped;
  };

  const persistEquippedItems = async (nextIds: string[], successMessage: string) => {
    const recalculated = applyEquippedItems(character, nextIds);
    onCharacterUpdate(recalculated);

    if (onSave) {
      try {
        await onSave(recalculated, { silent: true });
      } catch (error) {
        addToast({ type: 'warning', message: 'Autosave failed. Please try saving manually.' });
      }
    }

    if (!characterId) {
      addToast({ type: 'success', message: successMessage });
      return;
    }

    setIsPersisting(true);
    try {
      const response = await characterApi.updateEquippedItems(characterId, {
        name: recalculated.name,
        level: recalculated.level,
        characterData: recalculated,
      });

      if (isError(response)) {
        const toastPayload: ToastPayload = {
          type: 'error',
          message: response.error ?? 'Failed to save equipped items.',
        };

        if (response.statusCode !== undefined) {
          toastPayload.statusCode = response.statusCode;
        }
        if (response.errorCode !== undefined) {
          toastPayload.code = response.errorCode;
        }

        addToast(toastPayload);
        return;
      }

      addToast({ type: 'success', message: successMessage });
    } catch (error) {
      addToast({ type: 'error', message: 'Network error while saving equipped items.' });
    } finally {
      setIsPersisting(false);
    }
  };

  const handleToggleEquip = async (item: InventoryItem) => {
    if (isPersisting) {
      return;
    }

    const isEquipped = equippedSet.has(item.id);

    if (isEquipped) {
      const nextIds = equippedIds.filter((id) => id !== item.id);
      await persistEquippedItems(nextIds, `Unequipped ${item.name}.`);
      return;
    }

    const eligibility = evaluateEquipEligibility(item);
    if (!eligibility.ok) {
      if (import.meta.env.DEV) {
        console.warn('Equip blocked', { item, reason: eligibility.error });
      }
      addToast({ type: 'error', message: eligibility.error ?? 'Cannot equip this item.' });
      return;
    }

    let nextIds = applyEquipmentRules(item, equippedIds.filter((id) => id !== item.id));
    nextIds = [...nextIds, item.id];

    if (nextIds.length > EQUIPPED_ITEM_CAP) {
      addToast({
        type: 'warning',
        message: `You can equip at most ${EQUIPPED_ITEM_CAP} items at once.`,
      });
      return;
    }

    await persistEquippedItems(nextIds, `Equipped ${item.name}.`);
  };

  const renderTags = (item: InventoryItem) => {
    const metadata = getEquipmentMetadata(item.name);
    const tags: string[] = [];

    if (metadata.category === 'armor' && metadata.armorType) {
      tags.push(`${metadata.armorType.charAt(0).toUpperCase()}${metadata.armorType.slice(1)} Armor`);
    } else if (metadata.category === 'weapon' && metadata.weaponCategory) {
      tags.push(`${metadata.weaponCategory.charAt(0).toUpperCase()}${metadata.weaponCategory.slice(1)} Weapon`);
    } else if (metadata.category === 'shield') {
      tags.push('Shield');
    }

    return tags;
  };

  return (
    <InventoryContainer>
      <InventoryHeader>
        <HeaderTitle>Inventory</HeaderTitle>
        <HeaderActions>
          {onAddOfficialItem && (
            <ActionButton type="button" onClick={onAddOfficialItem} disabled={isPersisting}>
              + Add Official Item
            </ActionButton>
          )}
          {onAddCustomItem && (
            <ActionButton type="button" $variant="secondary" onClick={onAddCustomItem} disabled={isPersisting}>
              + Custom Item
            </ActionButton>
          )}
        </HeaderActions>
      </InventoryHeader>

      <InventoryTable>
        <TableHeader>
          <span>Item</span>
          <span>Tags</span>
          <span>Quantity</span>
          <span>Actions</span>
        </TableHeader>

        {items.length === 0 ? (
          <EmptyState>No items in your inventory yet.</EmptyState>
        ) : (
          items.map((item) => {
            const isEquipped = equippedSet.has(item.id);
            const tags = renderTags(item);

            return (
              <Row key={item.id} $equipped={isEquipped}>
                <div>
                  <ItemName
                    $clickable={!!onInspectItem}
                    onClick={() => onInspectItem && onInspectItem(item.name)}
                  >
                    {item.name}
                  </ItemName>
                  <ItemMeta>
                    {isEquipped && <MetaTag $variant="equipped">Equipped</MetaTag>}
                    {tags.map((tag) => (
                      <MetaTag key={`${item.id}-${tag}`}>{tag}</MetaTag>
                    ))}
                  </ItemMeta>
                </div>

                <Quantity>x{item.quantity}</Quantity>

                <div>
                  <MetaTag>{isEquipped ? 'Active' : 'Stored'}</MetaTag>
                </div>

                <ButtonGroup>
                  <EquipButton
                    type="button"
                    onClick={() => {
                      void handleToggleEquip(item);
                    }}
                    $equipped={isEquipped}
                    disabled={isPersisting}
                  >
                    {isEquipped ? 'Unequip' : 'Equip'}
                  </EquipButton>
                  {onInspectItem && (
                    <SecondaryButton
                      type="button"
                      onClick={() => onInspectItem(item.name)}
                    >
                      Details
                    </SecondaryButton>
                  )}
                </ButtonGroup>
              </Row>
            );
          })
        )}
      </InventoryTable>
    </InventoryContainer>
  );
};

export default InventoryTab;
