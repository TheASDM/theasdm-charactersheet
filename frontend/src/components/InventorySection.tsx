import {
  InventorySection as StyledInventorySection,
  InventoryTitle,
  InventoryList,
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

interface InventorySectionProps {
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
}

export default function CharacterInventory({ inventory }: InventorySectionProps) {
  return (
    <StyledInventorySection style={{ flex: '1', marginTop: '0' }}>
      <InventoryTitle>Inventory</InventoryTitle>
      <InventoryList>
        {Array.from({ length: 8 }, (_, index) => {
          const inventoryItem = inventory.localInventory[index];
          const hasItem =
            inventoryItem &&
            inventoryItem.name &&
            inventoryItem.name.trim();

          return (
            <InventoryItem key={index}>
              <InventoryItemContent
                clickable={!!hasItem}
                onClick={() =>
                  hasItem &&
                  inventory.handleInventoryItemClick(
                    inventoryItem.name
                  )
                }
                title={
                  hasItem
                    ? `Click to view details for ${inventoryItem.name}`
                    : undefined
                }
              >
                {hasItem ? inventoryItem.name : ''}
              </InventoryItemContent>
              {hasItem && (
                <>
                  <QuantityContainer>
                    <QuantityLabel>×</QuantityLabel>
                    <QuantityInput
                      type="number"
                      min="1"
                      value={
                        inventoryItem.quantity === 0
                          ? ''
                          : inventoryItem.quantity
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string during editing
                        if (value === '') {
                          // Store as 0 temporarily to allow clearing
                          inventory.handleQuantityChange(index, 0);
                        } else {
                          const newQuantity = parseInt(value) || 0;
                          inventory.handleQuantityChange(
                            index,
                            newQuantity
                          );
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure minimum quantity of 1 when focus is lost
                        const value = parseInt(e.target.value);
                        if (!value || value < 1) {
                          inventory.handleQuantityChange(index, 1);
                        }
                      }}
                      onFocus={(e) => {
                        // Select all text when focused for easy replacement
                        e.target.select();
                      }}
                    />
                  </QuantityContainer>
                  <DeleteButton
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the item click
                      inventory.handleDeleteItemClick(index);
                    }}
                    title={`Delete ${inventoryItem.name}`}
                  >
                    ×
                  </DeleteButton>
                </>
              )}
            </InventoryItem>
          );
        })}
      </InventoryList>

      <InventoryButtonContainer>
        <InventoryActionButton
          onClick={inventory.handleAddOfficialItem}
        >
          📦 Add Official Item
        </InventoryActionButton>
        <InventoryActionButton
          onClick={inventory.handleAddCustomItem}
        >
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
