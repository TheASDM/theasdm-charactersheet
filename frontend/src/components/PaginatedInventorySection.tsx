import { useState, useMemo } from 'react';
import styled from 'styled-components';
import {
  InventorySection as StyledInventorySection,
  InventoryTitle,
  InventoryItem,
  InventoryItemContent,
  DeleteButton,
  QuantityContainer,
  QuantityLabel,
  QuantityInput,
  SaveInventoryButton,
  InventoryButtonContainer,
  InventoryActionButton,
} from '../styles/components';

interface InventoryEntry {
  name: string;
  quantity: number;
}

interface PaginatedInventorySectionProps {
  inventory: {
    localInventory: InventoryEntry[];
    pendingInventoryChanges: boolean;
    handleInventoryItemClick: (itemName: string) => void;
    handleQuantityChange: (index: number, quantity: number) => void;
    handleDeleteItemClick: (index: number) => void;
    handleAddOfficialItem: () => void;
    handleAddCustomItem: () => void;
    handleSaveInventory: () => void;
  };
  mode?: 'pagination' | 'scroll';
  itemsPerPage?: number;
  maxHeight?: string;
}

const InventoryContainer = styled.div<{ $mode: 'pagination' | 'scroll'; $maxHeight?: string }>`
  display: flex;
  flex-direction: column;
  ${props => props.$mode === 'scroll' && `max-height: ${props.$maxHeight || '300px'};`}
`;

const ScrollableInventoryList = styled.div<{ $maxHeight: string }>`
  position: relative;
  z-index: 2;
  background: rgba(20, 20, 20, 0.8);
  border: 2px solid #8b6914;
  border-radius: 5px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  max-height: ${props => props.$maxHeight};
  overflow-y: auto;
  overflow-x: hidden;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #8b6914;
    border-radius: 4px;

    &:hover {
      background: #d4af37;
    }
  }

  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #8b6914 rgba(0, 0, 0, 0.3);
`;

const PaginatedInventoryList = styled.div`
  position: relative;
  z-index: 2;
  background: rgba(20, 20, 20, 0.8);
  border: 2px solid #8b6914;
  border-radius: 5px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  min-height: 200px; /* Consistent height for pagination */
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 1px solid #8b6914;
`;

const PaginationButton = styled.button<{ $disabled?: boolean }>`
  background: ${props => props.$disabled ? 'rgba(139, 105, 20, 0.3)' : 'linear-gradient(145deg, #8b6914, #d4af37)'};
  color: ${props => props.$disabled ? '#666' : '#1a1a1a'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    ${props => !props.$disabled && `
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
    `}
  }

  &:disabled {
    cursor: not-allowed;
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
  min-height: 40px;
  color: #666;
  font-style: italic;
  border: 1px dashed #444;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
`;

const InventoryStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: #ccc;
`;

export default function PaginatedInventorySection({
  inventory,
  mode = 'pagination',
  itemsPerPage = 8,
  maxHeight = '400px'
}: PaginatedInventorySectionProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Get only items that have names (actual inventory items)
  const actualItems = useMemo(() => {
    return inventory.localInventory.filter(item => item.name && item.name.trim());
  }, [inventory.localInventory]);

  // For pagination mode, calculate pages
  const totalPages = Math.max(1, Math.ceil(Math.max(actualItems.length, itemsPerPage) / itemsPerPage));
  const startIndex = currentPage * itemsPerPage;
  // const endIndex = startIndex + itemsPerPage;

  // Get items for current page (including empty slots)
  const currentPageItems = useMemo(() => {
    if (mode === 'scroll') {
      return actualItems;
    }

    const pageItems = [];
    for (let i = 0; i < itemsPerPage; i++) {
      const itemIndex = startIndex + i;
      const actualItem = actualItems[itemIndex];

      if (actualItem) {
        pageItems.push({
          ...actualItem,
          originalIndex: inventory.localInventory.findIndex(item =>
            item.name === actualItem.name && item.quantity === actualItem.quantity
          )
        });
      } else {
        pageItems.push(null);
      }
    }
    return pageItems;
  }, [actualItems, currentPage, itemsPerPage, mode, startIndex, inventory.localInventory]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const renderInventoryItem = (item: any, index: number) => {
    const hasItem = item && item.name && item.name.trim();
    const itemIndex = hasItem ? item.originalIndex ?? index : -1;

    if (!hasItem && mode === 'scroll') {
      return null; // Don't render empty slots in scroll mode
    }

    if (!hasItem) {
      return (
        <EmptySlot key={`empty-${index}`}>
          Empty Slot
        </EmptySlot>
      );
    }

    return (
      <InventoryItem key={`item-${itemIndex}-${item.name}`}>
        <InventoryItemContent
          clickable={true}
          onClick={() => inventory.handleInventoryItemClick(item.name)}
          title={`Click to view details for ${item.name}`}
        >
          {item.name}
        </InventoryItemContent>
        <QuantityContainer>
          <QuantityLabel>×</QuantityLabel>
          <QuantityInput
            type="number"
            min="1"
            value={item.quantity === 0 ? '' : item.quantity}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                inventory.handleQuantityChange(itemIndex, 0);
              } else {
                const newQuantity = parseInt(value) || 0;
                inventory.handleQuantityChange(itemIndex, newQuantity);
              }
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value);
              if (!value || value < 1) {
                inventory.handleQuantityChange(itemIndex, 1);
              }
            }}
            onFocus={(e) => e.target.select()}
          />
        </QuantityContainer>
        <DeleteButton
          onClick={(e) => {
            e.stopPropagation();
            inventory.handleDeleteItemClick(itemIndex);
          }}
          title={`Delete ${item.name}`}
        >
          ×
        </DeleteButton>
      </InventoryItem>
    );
  };

  return (
    <StyledInventorySection style={{ flex: '1', marginTop: '0' }}>
      <InventoryTitle>Inventory</InventoryTitle>

      <InventoryStats>
        <span>Items: {actualItems.length}</span>
        {mode === 'pagination' && (
          <span>Slots: {itemsPerPage} per page</span>
        )}
      </InventoryStats>

      <InventoryContainer $mode={mode} $maxHeight={maxHeight}>
        {mode === 'pagination' && totalPages > 1 && (
          <PaginationControls>
            <PaginationButton
              onClick={handlePrevPage}
              $disabled={currentPage === 0}
              disabled={currentPage === 0}
            >
              ← Previous
            </PaginationButton>

            <PageInfo>
              Page {currentPage + 1} of {totalPages}
            </PageInfo>

            <PaginationButton
              onClick={handleNextPage}
              $disabled={currentPage === totalPages - 1}
              disabled={currentPage === totalPages - 1}
            >
              Next →
            </PaginationButton>
          </PaginationControls>
        )}

        {mode === 'scroll' ? (
          <ScrollableInventoryList $maxHeight={maxHeight}>
            {actualItems.length === 0 ? (
              <EmptySlot>No items in inventory</EmptySlot>
            ) : (
              actualItems.map((item, index) => {
                const originalIndex = inventory.localInventory.findIndex(invItem =>
                  invItem.name === item.name && invItem.quantity === item.quantity
                );
                return renderInventoryItem({ ...item, originalIndex }, index);
              })
            )}
          </ScrollableInventoryList>
        ) : (
          <PaginatedInventoryList>
            {currentPageItems.map((item, index) => renderInventoryItem(item, index))}
          </PaginatedInventoryList>
        )}
      </InventoryContainer>

      <InventoryButtonContainer>
        <InventoryActionButton onClick={inventory.handleAddOfficialItem}>
          📦 Add Official Item
        </InventoryActionButton>
        <InventoryActionButton onClick={inventory.handleAddCustomItem}>
          ✏️ Add Custom Item
        </InventoryActionButton>
      </InventoryButtonContainer>

      {inventory.pendingInventoryChanges && (
        <SaveInventoryButton onClick={inventory.handleSaveInventory}>
          💾 Save Inventory Changes
        </SaveInventoryButton>
      )}
    </StyledInventorySection>
  );
}
