import React from 'react';
import styled from 'styled-components';
import type { Equipment } from '@/types/api';
import { processDbMarkup } from '../utils/textProcessor';

interface EquipmentItemModalProps {
  item: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToInventory: (item: Equipment) => void;
}

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid #ce9016;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  color: #f0f0f0;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 2px solid #444;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    color: #ce9016;
    font-family: 'Cinzel', serif;
    font-size: 1.5rem;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #ccc;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ff6b6b;
    }
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ItemStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(26, 26, 26, 0.6);
  border-radius: 8px;
  border: 1px solid #444;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .stat-label {
      color: #ce9016;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      color: #f0f0f0;
      font-size: 1rem;
      font-weight: 500;
    }
  }
`;

const ItemDescription = styled.div`
  margin-bottom: 1.5rem;

  h3 {
    color: #ce9016;
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    font-family: 'Cinzel', serif;
  }

  .description-content {
    color: #ccc;
    line-height: 1.6;
    font-size: 0.95rem;
  }
`;

const ItemRarity = styled.div<{ rarity: string }>`
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
  margin-bottom: 1rem;

  ${props => {
    switch (props.rarity?.toLowerCase()) {
      case 'none':
      case 'common':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.3);
        `;
      case 'uncommon':
        return `
          background: rgba(30, 255, 0, 0.1);
          color: #1eff00;
          border: 1px solid rgba(30, 255, 0, 0.3);
        `;
      case 'rare':
        return `
          background: rgba(0, 153, 255, 0.1);
          color: #0099ff;
          border: 1px solid rgba(0, 153, 255, 0.3);
        `;
      case 'very rare':
        return `
          background: rgba(163, 53, 238, 0.1);
          color: #a335ee;
          border: 1px solid rgba(163, 53, 238, 0.3);
        `;
      case 'legendary':
        return `
          background: rgba(255, 128, 0, 0.1);
          color: #ff8000;
          border: 1px solid rgba(255, 128, 0, 0.3);
        `;
      case 'artifact':
        return `
          background: rgba(230, 204, 128, 0.1);
          color: #e6cc80;
          border: 1px solid rgba(230, 204, 128, 0.3);
        `;
      default:
        return `
          background: rgba(128, 128, 128, 0.1);
          color: #ccc;
          border: 1px solid rgba(128, 128, 128, 0.3);
        `;
    }
  }}
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 2px solid #444;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  .item-source {
    color: #888;
    font-size: 0.9rem;
    font-family: 'Monaco', monospace;
  }

  .add-to-inventory-btn {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(145deg, #ce9016, #b8860b);
    border: none;
    border-radius: 8px;
    color: #1a1a1a;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &:hover {
      background: linear-gradient(145deg, #e6b52a, #ce9016);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }
`;

const processItemDescription = (entries: any): React.ReactNode => {
  if (!entries) return 'No description available.';

  if (Array.isArray(entries)) {
    return entries.map((entry, index) => {
      if (typeof entry === 'string') {
        return (
          <p
            key={index}
            style={{ marginBottom: '0.75rem', lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: processDbMarkup(entry) }}
          />
        );
      } else if (typeof entry === 'object' && entry.name && entry.entries) {
        // Handle D&D-style named sections with bold headers
        return (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <h4 style={{
              color: '#ce9016',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              fontFamily: 'Cinzel, serif'
            }}>
              {entry.name}
            </h4>
            <div>{processItemDescription(entry.entries)}</div>
          </div>
        );
      } else if (typeof entry === 'object' && entry.entries) {
        return (
          <div key={index}>
            {processItemDescription(entry.entries)}
          </div>
        );
      }
      return null;
    });
  }

  if (typeof entries === 'string') {
    return (
      <p
        style={{ marginBottom: '0.75rem', lineHeight: '1.6' }}
        dangerouslySetInnerHTML={{ __html: processDbMarkup(entries) }}
      />
    );
  }

  return 'No description available.';
};

export const EquipmentItemModal: React.FC<EquipmentItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToInventory
}) => {
  if (!item) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddToInventory = () => {
    onAddToInventory(item);
    onClose();
  };

  const getStatValue = (label: string): string => {
    switch (label) {
      case 'Damage':
        return item.dmg1 ? `${item.dmg1} ${item.dmgType || ''}`.trim() : '-';
      case 'AC':
        return item.ac ? `${item.ac}` : '-';
      case 'Weight':
        return item.weight ? `${item.weight} lb` : '-';
      case 'Value':
        return item.value ? `${item.value} ${item.valueCurrency || 'gp'}` : '-';
      case 'Range':
        return item.range || '-';
      case 'Properties':
        return item.property ? item.property.join(', ') : '-';
      default:
        return '-';
    }
  };

  const relevantStats = [];
  if (item.dmg1) relevantStats.push('Damage');
  if (item.ac) relevantStats.push('AC');
  if (item.weight) relevantStats.push('Weight');
  if (item.value) relevantStats.push('Value');
  if (item.range) relevantStats.push('Range');
  if (item.property && item.property.length > 0) relevantStats.push('Properties');

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <h2>{item.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </ModalHeader>

        <ModalBody>
          <ItemRarity rarity={item.rarity || 'none'}>
            {item.rarity || 'Common'}
          </ItemRarity>

          {relevantStats.length > 0 && (
            <ItemStats>
              {relevantStats.map(stat => (
                <div key={stat} className="stat-item">
                  <div className="stat-label">{stat}</div>
                  <div className="stat-value">{getStatValue(stat)}</div>
                </div>
              ))}
            </ItemStats>
          )}

          <ItemDescription>
            <h3>Description</h3>
            <div className="description-content">
              {processItemDescription(item.entries)}
            </div>
          </ItemDescription>
        </ModalBody>

        <ModalFooter>
          <div className="item-source">Source: {item.source}</div>
          <button
            className="add-to-inventory-btn"
            onClick={handleAddToInventory}
          >
            Add to Inventory
          </button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
