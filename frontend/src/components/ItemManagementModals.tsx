import React, { useState } from 'react';
import styled from 'styled-components';
import { Item } from '../types/api';
import { isWeapon, isArmor, isShield } from '../services/itemService';
import { processDbMarkup } from '../utils/textProcessor';
import { parseComplexDnDEntry } from '../utils/dndTemplateParser';

const renderItemEntries = (entries: any): React.ReactNode => {
  if (!entries) {
    return null;
  }

  if (Array.isArray(entries)) {
    return entries.map((entry, index) => {
      if (typeof entry === 'string') {
        return (
          <p
            key={`entry-${index}`}
            style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: processDbMarkup(entry) }}
          />
        );
      }

      if (entry && typeof entry === 'object') {
        if (entry.name && entry.entries) {
          return (
            <div key={`entry-${index}`} style={{ marginBottom: '1rem' }}>
              <h4
                style={{
                  color: '#ce9016',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  fontFamily: 'Cinzel, serif',
                }}
              >
                {entry.name}
              </h4>
              <div>{renderItemEntries(entry.entries)}</div>
            </div>
          );
        }

        if (entry.entries) {
          return (
            <div key={`entry-${index}`} style={{ marginBottom: '0.75rem' }}>
              {renderItemEntries(entry.entries)}
            </div>
          );
        }

        const parsed = parseComplexDnDEntry(entry);
        return (
          <p
            key={`entry-${index}`}
            style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: processDbMarkup(parsed) }}
          />
        );
      }

      return null;
    });
  }

  if (typeof entries === 'string') {
    return (
      <p
        style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: processDbMarkup(entries) }}
      />
    );
  }

  const parsed = parseComplexDnDEntry(entries);
  return (
    <p
      style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}
      dangerouslySetInnerHTML={{ __html: processDbMarkup(parsed) }}
    />
  );
};

// Modal Overlay
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  backdrop-filter: blur(4px);
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

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #333;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 600px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #333;
`;

const ModalTitle = styled.h2`
  color: #ce9016;
  margin: 0;
  font-size: 1.4rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #ce9016;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    color: #e0e0e0;
    transform: scale(1.1);
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

// Search and Input Styles
const SearchInput = styled.input`
  width: 100%;
  padding: 10px;
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid #333;
  border-radius: 6px;
  color: #e0e0e0;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  margin-bottom: 15px;

  &:focus {
    outline: none;
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
  }

  &::placeholder {
    color: #888;
  }
`;

const CustomItemInput = styled(SearchInput)``;

const ItemList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #333;
  border-radius: 8px;
  background: rgba(26, 26, 26, 0.6);
`;

const ItemOptionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #333;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(206, 144, 22, 0.1);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
  cursor: pointer;
  padding-right: 10px;
`;

const ItemName = styled.div`
  color: #ce9016;
  font-weight: 600;
  margin-bottom: 4px;
`;

const ItemDetails = styled.div`
  color: #b0b0b0;
  font-size: 0.85rem;
`;

const InfoButton = styled.button`
  background: rgba(33, 150, 243, 0.15);
  border: 1px solid #2196F3;
  color: #2196F3;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: 'Cinzel', serif;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(33, 150, 243, 0.25);
    transform: translateY(-1px);
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 15px;
  background: rgba(206, 144, 22, 0.15);
  border: 1px solid #ce9016;
  color: #ce9016;
  border-radius: 6px;
  font-weight: 600;
  font-family: 'Cinzel', serif;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    background: rgba(206, 144, 22, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(206, 144, 22, 0.4);
  }
`;

// Item Details Modal Styles
const ItemDetailsModal = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #333;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ItemDetailsHeader = styled(ModalHeader)``;
const ItemDetailsTitle = styled(ModalTitle)``;
const ItemDetailsBody = styled(ModalBody)``;

const ItemProperty = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;

  &:last-child {
    border-bottom: none;
  }
`;

const PropertyLabel = styled.span`
  color: #b0b0b0;
  font-weight: 600;
  font-size: 0.9rem;
`;

const PropertyValue = styled.span`
  color: #e0e0e0;
  text-align: right;
`;

const ItemDescription = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #333;
  color: #e0e0e0;
  line-height: 1.6;
`;

const AddItemButton = styled.button<{ inInventory?: boolean }>`
  width: 100%;
  padding: 12px;
  margin-top: 20px;
  background: ${props => props.inInventory
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(206, 144, 22, 0.15)'
  };
  border: ${props => props.inInventory ? 'none' : '1px solid #ce9016'};
  color: ${props => props.inInventory ? '#666' : '#ce9016'};
  border-radius: 6px;
  font-weight: 600;
  font-family: 'Cinzel', serif;
  cursor: ${props => props.inInventory ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    background: ${props => props.inInventory
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(206, 144, 22, 0.25)'
    };
    transform: ${props => props.inInventory ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.inInventory ? 'none' : '0 6px 20px rgba(206, 144, 22, 0.4)'};
  }
`;

// Confirmation Modal Styles
const ConfirmationModal = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #dc3545;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 400px;
  padding: 20px;
  color: #e0e0e0;
  font-family: 'Cinzel', serif;
  text-align: center;
`;

const ConfirmationTitle = styled.h3`
  color: #dc3545;
  margin: 0 0 15px 0;
  font-size: 1.3rem;
  text-transform: uppercase;
`;

const ConfirmationText = styled.p`
  color: #e0e0e0;
  margin: 20px 0;
  line-height: 1.5;
`;

const ConfirmationButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 25px;
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid #f44336;
  color: #f44336;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    background: rgba(244, 67, 54, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  }
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  color: #b0b0b0;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
`;

// Props Interfaces
interface AddItemModalProps {
  isOpen: boolean;
  modalType: 'official' | 'custom';
  searchTerm: string;
  searchResults: Item[];
  isSearching: boolean;
  onSearchChange: (value: string) => void;
  onItemSelect: (item: Item) => void;
  onCustomItemAdd: (itemName: string) => void;
  onShowItemDetails: (item: Item) => void;
  onClose: () => void;
}

interface ItemDetailsModalProps {
  isOpen: boolean;
  item: Item | null;
  isItemInInventory: (itemName: string) => boolean;
  onAddToInventory: (item: Item) => void;
  onClose: () => void;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Add Item Modal Component
export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  modalType,
  searchTerm,
  searchResults,
  isSearching,
  onSearchChange,
  onItemSelect,
  onCustomItemAdd,
  onShowItemDetails,
  onClose
}) => {
  const [customItemName, setCustomItemName] = useState('');

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {modalType === 'official' ? 'Add Official Item' : 'Add Custom Item'}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            ×
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          {modalType === 'official' ? (
            <>
              <SearchInput
                type="text"
                placeholder="Search for items..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {isSearching && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  Searching...
                </div>
              )}
              {searchResults.length > 0 && (
                <ItemList>
                  {searchResults.map((item) => (
                    <ItemOptionContainer key={item.id}>
                      <ItemInfo onClick={() => onItemSelect(item)}>
                        <ItemName>{item.name}</ItemName>
                        <ItemDetails>
                          {item.type}
                          {item.dmg1 && ` • ${item.dmg1} ${item.dmgType || ''}`}
                          {item.ac && ` • AC ${item.ac}`}
                          {item.weight && ` • ${item.weight} lbs`}
                        </ItemDetails>
                      </ItemInfo>
                      <InfoButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowItemDetails(item);
                        }}
                      >
                        Info
                      </InfoButton>
                    </ItemOptionContainer>
                  ))}
                </ItemList>
              )}
              {searchTerm && !isSearching && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                  No items found. Try a different search term.
                </div>
              )}
            </>
          ) : (
            <>
              <CustomItemInput
                type="text"
                placeholder="Enter custom item name..."
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customItemName.trim()) {
                    onCustomItemAdd(customItemName.trim());
                    setCustomItemName('');
                  }
                }}
              />
              <AddButton
                onClick={() => {
                  if (customItemName.trim()) {
                    onCustomItemAdd(customItemName.trim());
                    setCustomItemName('');
                  }
                }}
              >
                Add Item
              </AddButton>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

// Item Details Modal Component
export const ItemDetailsModalComponent: React.FC<ItemDetailsModalProps> = ({
  isOpen,
  item,
  isItemInInventory,
  onAddToInventory,
  onClose
}) => {
  if (!isOpen || !item) return null;

  const inInventory = isItemInInventory(item.name);

  return (
    <ModalOverlay $isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <ItemDetailsModal>
        <ItemDetailsHeader>
          <ItemDetailsTitle>
            {item.name}
          </ItemDetailsTitle>
          <CloseButton onClick={onClose}>
            ×
          </CloseButton>
        </ItemDetailsHeader>
        <ItemDetailsBody>
          <ItemProperty>
            <PropertyLabel>Type:</PropertyLabel>
            <PropertyValue>{item.type}</PropertyValue>
          </ItemProperty>

          {item.rarity && (
            <ItemProperty>
              <PropertyLabel>Rarity:</PropertyLabel>
              <PropertyValue>{item.rarity}</PropertyValue>
            </ItemProperty>
          )}

          {item.weight && (
            <ItemProperty>
              <PropertyLabel>Weight:</PropertyLabel>
              <PropertyValue>{item.weight} lbs</PropertyValue>
            </ItemProperty>
          )}

          {item.value && (
            <ItemProperty>
              <PropertyLabel>Cost:</PropertyLabel>
              <PropertyValue>
                {item.value} {item.valueCurrency || 'gp'}
              </PropertyValue>
            </ItemProperty>
          )}

          {/* Weapon Properties */}
          {isWeapon(item) && (
            <>
              {item.dmg1 && (
                <ItemProperty>
                  <PropertyLabel>Damage:</PropertyLabel>
                  <PropertyValue>
                    {item.dmg1}
                    {item.dmg2 && ` (${item.dmg2} versatile)`}
                    {item.dmgType && ` ${item.dmgType}`}
                  </PropertyValue>
                </ItemProperty>
              )}

              {item.weaponCategory && (
                <ItemProperty>
                  <PropertyLabel>Category:</PropertyLabel>
                  <PropertyValue>{item.weaponCategory}</PropertyValue>
                </ItemProperty>
              )}

              {item.range && (
                <ItemProperty>
                  <PropertyLabel>Range:</PropertyLabel>
                  <PropertyValue>{item.range}</PropertyValue>
                </ItemProperty>
              )}

              {item.property && item.property.length > 0 && (
                <ItemProperty>
                  <PropertyLabel>Properties:</PropertyLabel>
                  <PropertyValue>{item.property.join(', ')}</PropertyValue>
                </ItemProperty>
              )}
            </>
          )}

          {/* Armor Properties */}
          {isArmor(item) && (
            <>
              {item.ac && (
                <ItemProperty>
                  <PropertyLabel>Armor Class:</PropertyLabel>
                  <PropertyValue>{item.ac}</PropertyValue>
                </ItemProperty>
              )}

              {item.armorType && (
                <ItemProperty>
                  <PropertyLabel>Armor Type:</PropertyLabel>
                  <PropertyValue>{item.armorType}</PropertyValue>
                </ItemProperty>
              )}

              {item.strength && (
                <ItemProperty>
                  <PropertyLabel>Strength Req:</PropertyLabel>
                  <PropertyValue>{item.strength}</PropertyValue>
                </ItemProperty>
              )}

              {item.stealth && (
                <ItemProperty>
                  <PropertyLabel>Stealth:</PropertyLabel>
                  <PropertyValue>Disadvantage</PropertyValue>
                </ItemProperty>
              )}
            </>
          )}

          {/* Shield Properties */}
          {isShield(item) && (
            <ItemProperty>
              <PropertyLabel>AC Bonus:</PropertyLabel>
              <PropertyValue>+2</PropertyValue>
            </ItemProperty>
          )}

          {/* Magic Properties */}
          {item.reqAttune && (
            <ItemProperty>
              <PropertyLabel>Attunement:</PropertyLabel>
              <PropertyValue>{item.reqAttune}</PropertyValue>
            </ItemProperty>
          )}

          {item.charges && (
            <ItemProperty>
              <PropertyLabel>Charges:</PropertyLabel>
              <PropertyValue>{item.charges}</PropertyValue>
            </ItemProperty>
          )}

          {/* Source Information */}
          {item.source && (
            <ItemProperty>
              <PropertyLabel>Source:</PropertyLabel>
              <PropertyValue>
                {item.source}
                {item.page && ` p. ${item.page}`}
              </PropertyValue>
            </ItemProperty>
          )}

          {/* Description */}
          {item.entries && item.entries.length > 0 && (
            <ItemDescription>
              <strong>Description:</strong>
              <div style={{ marginTop: '8px' }}>
                {renderItemEntries(item.entries)}
              </div>
            </ItemDescription>
          )}

          <AddItemButton
            inInventory={inInventory}
            onClick={() => {
              if (!inInventory) {
                onAddToInventory(item);
                onClose();
              }
            }}
          >
            {inInventory ? 'In Inventory' : 'Add to Inventory'}
          </AddItemButton>
        </ItemDetailsBody>
      </ItemDetailsModal>
    </ModalOverlay>
  );
};

// Delete Confirmation Modal Component
export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  itemName,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <ConfirmationModal>
        <ConfirmationTitle>Delete Item</ConfirmationTitle>
        <ConfirmationText>
          Are you sure you want to delete "{itemName}"?
          <br />
          This will remove the item from your inventory and any effects it was providing.
        </ConfirmationText>
        <ConfirmationButtons>
          <ConfirmButton onClick={onConfirm}>
            Delete
          </ConfirmButton>
          <CancelButton onClick={onCancel}>
            Cancel
          </CancelButton>
        </ConfirmationButtons>
      </ConfirmationModal>
    </ModalOverlay>
  );
};

export default {
  AddItemModal,
  ItemDetailsModalComponent,
  DeleteConfirmationModal
};
