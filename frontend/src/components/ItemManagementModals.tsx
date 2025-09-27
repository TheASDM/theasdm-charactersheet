import React, { useState } from 'react';
import styled from 'styled-components';
import { Item } from '../types/api';
import { isWeapon, isArmor, isShield } from '../services/itemService';

// Modal Overlay
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #d4af37;
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
  border-bottom: 2px solid #8b6914;
`;

const ModalTitle = styled.h2`
  color: #d4af37;
  margin: 0;
  font-size: 1.4rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #d4af37;
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
    color: #f4e7d1;
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
  background: rgba(139, 105, 20, 0.2);
  border: 2px solid #8b6914;
  border-radius: 6px;
  color: #f4e7d1;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  margin-bottom: 15px;

  &:focus {
    outline: none;
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.1);
  }

  &::placeholder {
    color: rgba(244, 231, 209, 0.5);
  }
`;

const CustomItemInput = styled(SearchInput)``;

const ItemList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
`;

const ItemOptionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid rgba(139, 105, 20, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(212, 175, 55, 0.1);
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
  color: #d4af37;
  font-weight: 600;
  margin-bottom: 4px;
`;

const ItemDetails = styled.div`
  color: #8b6914;
  font-size: 0.85rem;
`;

const InfoButton = styled.button`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  border: none;
  color: #f4e7d1;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: 'Cinzel', serif;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(145deg, #a0801b, #8b6914);
    transform: translateY(-1px);
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 15px;
  background: linear-gradient(145deg, #d4af37, #b8941f);
  border: none;
  color: #2c1810;
  border-radius: 6px;
  font-weight: 600;
  font-family: 'Cinzel', serif;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  }
`;

// Item Details Modal Styles
const ItemDetailsModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #d4af37;
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
  border-bottom: 1px solid rgba(139, 105, 20, 0.2);

  &:last-child {
    border-bottom: none;
  }
`;

const PropertyLabel = styled.span`
  color: #8b6914;
  font-weight: 600;
  font-size: 0.9rem;
`;

const PropertyValue = styled.span`
  color: #f4e7d1;
  text-align: right;
`;

const ItemDescription = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #8b6914;
  color: #f4e7d1;
  line-height: 1.6;
`;

const AddItemButton = styled.button<{ inInventory?: boolean }>`
  width: 100%;
  padding: 12px;
  margin-top: 20px;
  background: ${props => props.inInventory
    ? 'rgba(139, 105, 20, 0.3)'
    : 'linear-gradient(145deg, #d4af37, #b8941f)'
  };
  border: none;
  color: ${props => props.inInventory ? '#8a8a8a' : '#2c1810'};
  border-radius: 6px;
  font-weight: 600;
  font-family: 'Cinzel', serif;
  cursor: ${props => props.inInventory ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    background: ${props => props.inInventory
      ? 'rgba(139, 105, 20, 0.3)'
      : 'linear-gradient(145deg, #b8941f, #a0801b)'
    };
    transform: ${props => props.inInventory ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.inInventory ? 'none' : '0 6px 20px rgba(212, 175, 55, 0.4)'};
  }
`;

// Confirmation Modal Styles
const ConfirmationModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #dc3545;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 400px;
  padding: 20px;
  color: #f4e7d1;
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
  color: #f4e7d1;
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
  background: linear-gradient(145deg, #dc3545, #c82333);
  border: none;
  color: #fff;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    background: linear-gradient(145deg, #c82333, #bd2130);
    transform: translateY(-2px);
  }
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: rgba(139, 105, 20, 0.5);
  border: 1px solid #8b6914;
  color: #f4e7d1;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    background: rgba(139, 105, 20, 0.7);
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
    <ModalOverlay isOpen={isOpen} onClick={(e) => {
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
                <div style={{ textAlign: 'center', padding: '20px', color: '#8b6914' }}>
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
    <ModalOverlay isOpen={isOpen} onClick={(e) => {
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
                {item.entries.map((entry: any, index: number) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    {typeof entry === 'string' ? entry : JSON.stringify(entry)}
                  </div>
                ))}
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
    <ModalOverlay isOpen={isOpen} onClick={(e) => {
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