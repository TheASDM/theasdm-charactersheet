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
  showEquipToggle?: boolean;
  allowReordering?: boolean;
}

const InventoryContainer = styled.div<{ $mode: string; $maxHeight?: string }>`
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 2px solid #333;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-height: fit-content;
`;

const InventoryHeader = styled.div`
  background: rgba(26, 26, 26, 0.8);
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;

  .title {
    color: #d4af37;
    font-family: 'Cinzel', serif;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);

    .icon {
      font-size: 1rem;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
    }
  }

  .stats {
    display: flex;
    gap: 0.5rem;
    font-size: 0.65rem;

    .stat {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      padding: 0.2rem 0.4rem;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 3px;
      border: 1px solid rgba(212, 175, 55, 0.2);

      .label {
        color: #888;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        font-size: 0.55rem;
      }

      .value {
        color: #e0e0e0;
        font-weight: 700;
        font-size: 0.7rem;
      }
    }
  }
`;

const InventoryContent = styled.div<{ $mode: string; $maxHeight?: string }>`
  ${props => props.$mode === 'scroll' ? `
    max-height: fit-content;
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
    background: #333;
    border-radius: 4px;

    &:hover {
      background: #d4af37;
    }
  }

  scrollbar-width: thin;
  scrollbar-color: #333 rgba(0, 0, 0, 0.3);
`;

const InventoryItemStyled = styled.div<{ $equipped?: boolean; $mode: string }>`
  display: flex;
  align-items: center;
  padding: 0.25rem 0.4rem;
  border-bottom: 1px solid #333;
  transition: all 0.2s ease;
  background: ${props => props.$equipped ? 'rgba(74, 222, 128, 0.1)' : 'rgba(26, 26, 26, 0.6)'};

  ${props => props.$mode === 'grid' ? `
    flex-direction: column;
    align-items: stretch;
    border: 1px solid #333;
    border-radius: 8px;
    background: ${props.$equipped ? 'rgba(74, 222, 128, 0.1)' : 'rgba(26, 26, 26, 0.6)'};
    padding: 0.5rem;
    min-height: 80px;
  ` : ''}

  &:hover {
    background: ${props => props.$equipped ? 'rgba(74, 222, 128, 0.15)' : 'rgba(212, 175, 55, 0.1)'};
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
    color: #e0e0e0;
    font-weight: 600;
    font-size: 0.7rem;
    margin-bottom: 0.1rem;
    line-height: 1.2;

    &.equipped {
      color: #4ade80;
    }
  }

  .item-details {
    color: #b0b0b0;
    font-size: 0.6rem;
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;

    .detail {
      background: rgba(212, 175, 55, 0.15);
      padding: 0.1rem 0.25rem;
      border-radius: 2px;
      font-size: 0.55rem;
      border: 1px solid rgba(212, 175, 55, 0.3);
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
    color: #d4af37;
    font-size: 0.6rem;
    font-weight: 600;
  }

  .qty-input {
    width: 35px;
    padding: 0.15rem;
    background: rgba(26, 26, 26, 0.8);
    border: 1px solid #333;
    border-radius: 2px;
    color: #e0e0e0;
    text-align: center;
    font-size: 0.65rem;

    &:focus {
      outline: none;
      border-color: #d4af37;
    }
  }
`;

const ActionButton = styled.button<{ $variant?: 'equip' | 'delete' | 'primary'; $equipped?: boolean }>`
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
          width: 65px;
          text-align: center;
          background: ${props.$equipped ? 'rgba(74, 222, 128, 0.2)' : 'rgba(74, 222, 128, 0.15)'};
          color: ${props.$equipped ? '#4ade80' : '#4ade80'};
          border: 1px solid ${props.$equipped ? '#4ade80' : 'rgba(74, 222, 128, 0.5)'};
          font-weight: ${props.$equipped ? '700' : '600'};

          &:hover {
            background: ${props.$equipped ? 'rgba(74, 222, 128, 0.25)' : 'rgba(74, 222, 128, 0.2)'};
            transform: translateY(-1px);
          }
        `;
      case 'delete':
        return `
          background: rgba(244, 67, 54, 0.15);
          color: #f44336;
          border: 1px solid #f44336;

          &:hover {
            background: rgba(244, 67, 54, 0.25);
            transform: translateY(-1px);
          }
        `;
      default:
        return `
          background: rgba(212, 175, 55, 0.15);
          color: #d4af37;
          border: 1px solid #d4af37;

          &:hover {
            background: rgba(212, 175, 55, 0.25);
            transform: translateY(-1px);
          }
        `;
    }
  }}
`;

const InventoryActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border-top: 1px solid #333;
  background: rgba(26, 26, 26, 0.8);
`;

const AddItemButton = styled.button`
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #333;
  border-radius: 4px;
  color: #d4af37;
  font-weight: 600;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;

  .icon {
    font-size: 0.85rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: #d4af37;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid #333;
  background: rgba(26, 26, 26, 0.8);
`;

const PaginationButton = styled.button<{ $disabled?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.$disabled ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.15)'};
  border: 1px solid ${props => props.$disabled ? '#333' : '#d4af37'};
  border-radius: 4px;
  color: ${props => props.$disabled ? '#888' : '#d4af37'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.25);
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
  color: #888;
  font-style: italic;
  border: 1px dashed #333;
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
  cursor: pointer;
  position: relative;
  background: ${props => props.$success
    ? 'rgba(76, 175, 80, 0.1)'
    : 'rgba(244, 67, 54, 0.1)'
  };
  border: 1px solid ${props => props.$success
    ? 'rgba(76, 175, 80, 0.3)'
    : 'rgba(244, 67, 54, 0.3)'
  };
  color: ${props => props.$success ? '#4caf50' : '#f44336'};
  animation: fadeIn 0.3s ease-in;
  transition: opacity 0.3s ease-out;

  &:hover {
    opacity: 0.8;
  }

  &::after {
    content: '(Auto-dismisses in 3s • Click to close)';
    display: block;
    font-size: 0.65rem;
    margin-top: 0.25rem;
    opacity: 0.7;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const ConsolidatedInventorySection: React.FC<ConsolidatedInventoryProps> = ({
  inventory,
  mode = 'scroll',
  itemsPerPage = 10,
  maxHeight = '400px',
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
              $equipped={item.equipped}
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
        <div className="title">
          <span className="icon">🎒</span>
          <span>Inventory</span>
        </div>
        <div className="stats">
          <div className="stat">
            <span className="label">Items</span>
            <span className="value">{totalItems}</span>
          </div>
          {equippedCount > 0 && (
            <div className="stat">
              <span className="label">Equipped</span>
              <span className="value">{equippedCount}</span>
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
          <span className="icon">⚔️</span>
          <span>Add Official</span>
        </AddItemButton>
        <AddItemButton onClick={inventory.handleAddCustomItem}>
          <span className="icon">✨</span>
          <span>Add Custom</span>
        </AddItemButton>
      </InventoryActions>
    </InventoryContainer>
  );
};

export default ConsolidatedInventorySection;