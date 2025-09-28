import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { InventoryItem } from '../types/characterSheet';

interface InventoryManagement {
  normalizedInventory: InventoryItem[];
  handleInventoryItemClick: (itemName: string) => void;
  handleQuantityChange: (index: number, quantity: number) => void;
  handleToggleEquip: (index: number) => void;
  handleDeleteItemClick: (index: number) => void;
  handleAddOfficialItem: () => void;
  handleAddCustomItem: () => void;
  operationResult: { success: boolean; message: string; warnings?: string[] } | null;
  clearOperationResult: () => void;
  getInventoryWeight: () => number;
}

interface ConsolidatedInventoryProps {
  inventory: InventoryManagement;
  mode?: 'pagination' | 'scroll' | 'grid';
  itemsPerPage?: number;
  maxHeight?: string;
  showWeight?: boolean;
  showEquipToggle?: boolean;
  allowReordering?: boolean;
}

const InventoryContainer = styled.div<{ $mode: string; $maxHeight?: string }>`
  display: flex;
  flex-direction: column;
  background: rgba(26, 26, 26, 0.9);
  border: 2px solid #8b6914;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  ${props => props.$mode === 'scroll' && `max-height: ${props.$maxHeight || '400px'};`}
`;

const InventoryHeader = styled.div`
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  padding: 0.5rem;
  border-bottom: 2px solid #d4af37;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    color: #d4af37;
    font-family: 'Cinzel', serif;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stats {
    display: flex;
    gap: 0.5rem;
    font-size: 0.65rem;
    color: #ccc;

    .stat {
      display: flex;
      align-items: center;
      gap: 0.15rem;

      .label {
        color: #8b6914;
        font-weight: 600;
      }

      .value {
        color: #d4af37;
        font-weight: 600;
      }
    }
  }
`;

const InventoryContent = styled.div<{ $mode: string; $maxHeight?: string }>`
  ${props => props.$mode === 'scroll' ? `
    max-height: ${props.$maxHeight || '300px'};
    overflow-y: auto;
    overflow-x: hidden;
  ` : ''}

  ${props => props.$mode === 'grid' ? `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
    padding: 1rem;
  ` : ''}

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }

  &::-webkit-scrollbar-thumb {
    background: #8b6914;
    border-radius: 4px;

    &:hover {
      background: #d4af37;
    }
  }

  scrollbar-width: thin;
  scrollbar-color: #8b6914 rgba(0, 0, 0, 0.3);
`;

const InventoryItemStyled = styled.div<{ $equipped?: boolean; $mode: string }>`
  display: flex;
  align-items: center;
  padding: 0.25rem 0.4rem;
  border-bottom: 1px solid rgba(139, 105, 20, 0.2);
  transition: all 0.2s ease;
  background: ${props => props.$equipped ? 'rgba(212, 175, 55, 0.1)' : 'transparent'};

  ${props => props.$mode === 'grid' ? `
    flex-direction: column;
    align-items: stretch;
    border: 1px solid rgba(139, 105, 20, 0.2);
    border-radius: 8px;
    background: rgba(40, 40, 40, 0.6);
    padding: 0.5rem;
    min-height: 80px;
  ` : ''}

  &:hover {
    background: ${props => props.$equipped
      ? 'rgba(212, 175, 55, 0.2)'
      : 'rgba(212, 175, 55, 0.08)'
    };
    transform: translateX(1px);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ItemContent = styled.div<{ $clickable?: boolean }>`
  flex: 1;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  margin-right: 0.25rem;

  .item-name {
    color: #f0f0f0;
    font-weight: 600;
    font-size: 0.7rem;
    margin-bottom: 0.1rem;
    line-height: 1.2;

    &.equipped {
      color: #d4af37;
    }
  }

  .item-details {
    color: #aaa;
    font-size: 0.6rem;
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;

    .detail {
      background: rgba(139, 105, 20, 0.2);
      padding: 0.1rem 0.25rem;
      border-radius: 2px;
      font-size: 0.55rem;
    }
  }
`;

const ItemControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.15rem;

  .qty-label {
    color: #8b6914;
    font-size: 0.6rem;
    font-weight: 600;
  }

  .qty-input {
    width: 35px;
    padding: 0.15rem;
    background: rgba(40, 40, 40, 0.8);
    border: 1px solid #555;
    border-radius: 2px;
    color: #fff;
    text-align: center;
    font-size: 0.65rem;

    &:focus {
      outline: none;
      border-color: #d4af37;
    }
  }
`;

const ActionButton = styled.button<{ $variant?: 'equip' | 'delete' | 'primary' }>`
  padding: 0.2rem 0.4rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  transition: all 0.2s ease;

  ${props => {
    switch (props.$variant) {
      case 'equip':
        return `
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
          border: 1px solid rgba(76, 175, 80, 0.5);

          &:hover {
            background: rgba(76, 175, 80, 0.3);
            transform: translateY(-1px);
          }
        `;
      case 'delete':
        return `
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
          border: 1px solid rgba(244, 67, 54, 0.5);

          &:hover {
            background: rgba(244, 67, 54, 0.3);
            transform: translateY(-1px);
          }
        `;
      default:
        return `
          background: rgba(139, 105, 20, 0.3);
          color: #d4af37;
          border: 1px solid rgba(139, 105, 20, 0.5);

          &:hover {
            background: rgba(139, 105, 20, 0.5);
            transform: translateY(-1px);
          }
        `;
    }
  }}
`;

const InventoryActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid rgba(139, 105, 20, 0.3);
  background: rgba(0, 0, 0, 0.2);
`;

const AddItemButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: linear-gradient(145deg, #8b6914, #d4af37);
  border: none;
  border-radius: 6px;
  color: #1a1a1a;
  font-weight: 600;
  font-family: 'Cinzel', serif;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-size: 0.85rem;

  &:hover {
    background: linear-gradient(145deg, #d4af37, #e6b52a);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid rgba(139, 105, 20, 0.3);
  background: rgba(0, 0, 0, 0.2);
`;

const PaginationButton = styled.button<{ $disabled?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.$disabled ? 'rgba(139, 105, 20, 0.2)' : 'rgba(139, 105, 20, 0.5)'};
  border: 1px solid ${props => props.$disabled ? 'rgba(139, 105, 20, 0.3)' : '#8b6914'};
  border-radius: 4px;
  color: ${props => props.$disabled ? '#666' : '#d4af37'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(139, 105, 20, 0.7);
    transform: translateY(-1px);
  }
`;

const PageInfo = styled.span`
  color: #d4af37;
  font-weight: 600;
  font-size: 0.9rem;
`;

const EmptySlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  color: #666;
  font-style: italic;
  border: 1px dashed #444;
  border-radius: 4px;
  margin: 0.25rem;
  font-size: 0.85rem;
`;

const OperationFeedback = styled.div<{ $success: boolean }>`
  padding: 0.75rem;
  margin: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  background: ${props => props.$success
    ? 'rgba(76, 175, 80, 0.1)'
    : 'rgba(244, 67, 54, 0.1)'
  };
  border: 1px solid ${props => props.$success
    ? 'rgba(76, 175, 80, 0.3)'
    : 'rgba(244, 67, 54, 0.3)'
  };
  color: ${props => props.$success ? '#4caf50' : '#f44336'};
`;

export const ConsolidatedInventorySection: React.FC<ConsolidatedInventoryProps> = ({
  inventory,
  mode = 'scroll',
  itemsPerPage = 10,
  maxHeight = '400px',
  showWeight = true,
  showEquipToggle = true,
  allowReordering: _allowReordering = false
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Get actual items (not empty slots)
  const actualItems = useMemo(() => {
    return inventory.normalizedInventory.filter(item => item.name && item.name.trim());
  }, [inventory.normalizedInventory]);

  // Calculate stats
  const totalItems = actualItems.length;
  const totalWeight = showWeight ? inventory.getInventoryWeight() : 0;
  const equippedCount = actualItems.filter(item => item.equipped).length;

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(Math.max(actualItems.length, itemsPerPage) / itemsPerPage));
  const startIndex = currentPage * itemsPerPage;

  const currentPageItems = useMemo(() => {
    if (mode === 'scroll' || mode === 'grid') {
      return actualItems;
    }

    // Pagination mode
    const pageItems = [];
    for (let i = 0; i < itemsPerPage; i++) {
      const itemIndex = startIndex + i;
      const item = actualItems[itemIndex];

      if (item) {
        pageItems.push({
          ...item,
          originalIndex: inventory.normalizedInventory.findIndex(invItem =>
            invItem.id === item.id
          )
        });
      } else {
        pageItems.push(null);
      }
    }
    return pageItems;
  }, [actualItems, currentPage, itemsPerPage, mode, startIndex, inventory.normalizedInventory]);

  const renderInventoryItem = (item: any, index: number) => {
    if (!item && mode !== 'pagination') {
      return null; // Don't render empty slots in scroll/grid mode
    }

    if (!item) {
      return (
        <EmptySlot key={`empty-${index}`}>
          Empty Slot
        </EmptySlot>
      );
    }

    const hasItem = item && item.name && item.name.trim();
    const itemIndex = hasItem ? (item.originalIndex ?? index) : -1;

    return (
      <InventoryItemStyled key={`item-${item.id}`} $equipped={item.equipped} $mode={mode}>
        <ItemContent
          $clickable={true}
          onClick={() => inventory.handleInventoryItemClick(item.name)}
        >
          <div className={`item-name ${item.equipped ? 'equipped' : ''}`}>
            {item.equipped && '⚡ '}{item.name}
          </div>
          <div className="item-details">
            {item.quantity > 1 && <span className="detail">×{item.quantity}</span>}
            {item.equipped && <span className="detail">Equipped</span>}
            {item.attuned && <span className="detail">Attuned</span>}
            {item.customProperties?.damage && <span className="detail">{item.customProperties.damage}</span>}
            {item.customProperties?.ac && <span className="detail">AC {item.customProperties.ac}</span>}
          </div>
        </ItemContent>

        <ItemControls>
          <QuantityControl>
            <span className="qty-label">×</span>
            <input
              type="number"
              className="qty-input"
              min="1"
              value={item.quantity || 1}
              onChange={(e) => {
                const newQuantity = parseInt(e.target.value) || 1;
                inventory.handleQuantityChange(itemIndex, newQuantity);
              }}
              onFocus={(e) => e.target.select()}
            />
          </QuantityControl>

          {showEquipToggle && (
            <ActionButton
              $variant="equip"
              onClick={() => inventory.handleToggleEquip(itemIndex)}
              title={item.equipped ? 'Unequip item' : 'Equip item'}
            >
              {item.equipped ? 'Unequip' : 'Equip'}
            </ActionButton>
          )}

          <ActionButton
            $variant="delete"
            onClick={() => inventory.handleDeleteItemClick(itemIndex)}
            title={`Delete ${item.name}`}
          >
            ×
          </ActionButton>
        </ItemControls>
      </InventoryItemStyled>
    );
  };

  return (
    <InventoryContainer $mode={mode} $maxHeight={maxHeight}>
      <InventoryHeader>
        <div className="title">Inventory</div>
        <div className="stats">
          <div className="stat">
            <span className="label">Items:</span>
            <span className="value">{totalItems}</span>
          </div>
          {equippedCount > 0 && (
            <div className="stat">
              <span className="label">Equipped:</span>
              <span className="value">{equippedCount}</span>
            </div>
          )}
          {showWeight && (
            <div className="stat">
              <span className="label">Weight:</span>
              <span className="value">{totalWeight} lbs</span>
            </div>
          )}
        </div>
      </InventoryHeader>

      {inventory.operationResult && (
        <OperationFeedback
          $success={inventory.operationResult.success}
          onClick={inventory.clearOperationResult}
        >
          {inventory.operationResult.message}
          {inventory.operationResult.warnings && inventory.operationResult.warnings.length > 0 && (
            <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
              {inventory.operationResult.warnings.join(', ')}
            </div>
          )}
        </OperationFeedback>
      )}

      <InventoryContent $mode={mode} $maxHeight={maxHeight}>
        {actualItems.length === 0 ? (
          <EmptySlot style={{ margin: '2rem', minHeight: '100px' }}>
            No items in inventory
          </EmptySlot>
        ) : (
          currentPageItems.map((item, index) => renderInventoryItem(item, index))
        )}
      </InventoryContent>

      {mode === 'pagination' && totalPages > 1 && (
        <PaginationControls>
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            $disabled={currentPage === 0}
          >
            ← Previous
          </PaginationButton>

          <PageInfo>
            Page {currentPage + 1} of {totalPages}
          </PageInfo>

          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            $disabled={currentPage === totalPages - 1}
          >
            Next →
          </PaginationButton>
        </PaginationControls>
      )}

      <InventoryActions>
        <AddItemButton onClick={inventory.handleAddOfficialItem}>
          📦 Add Official Item
        </AddItemButton>
        <AddItemButton onClick={inventory.handleAddCustomItem}>
          ✏️ Add Custom Item
        </AddItemButton>
      </InventoryActions>
    </InventoryContainer>
  );
};

export default ConsolidatedInventorySection;