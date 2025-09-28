import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import equipmentService, { Equipment } from '../../services/equipmentService';
import { EquipmentItemModal } from '../EquipmentItemModal';

interface Step4EquipmentSelectionProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

const TableContainer = styled.div`
  background: rgba(26, 26, 26, 0.9);
  border: 2px solid #444;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const ScrollableTable = styled.div`
  max-height: 70vh;
  overflow-y: auto;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(40, 40, 40, 0.5);
  }

  &::-webkit-scrollbar-thumb {
    background: #d4af37;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #e6b52a;
  }
`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  th {
    text-align: left;
    padding: 1rem;
    color: #d4af37;
    font-weight: 700;
    font-size: 1rem;
    border-bottom: 3px solid #d4af37;
    font-family: 'Cinzel', serif;
  }

  tbody tr {
    border-bottom: 1px solid #333;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      background: rgba(212, 175, 55, 0.08);
      transform: translateX(2px);
    }

    &:nth-child(even) {
      background: rgba(255, 255, 255, 0.02);
    }
  }

  td {
    padding: 0.75rem 1rem;
    color: #ccc;
    font-size: 0.95rem;
    vertical-align: top;
  }

  .item-name {
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
  }

  .item-type {
    color: #888;
    font-size: 0.9rem;
    font-style: italic;
  }

  .item-stats {
    color: #d4af37;
    font-weight: 500;
  }

  .item-weight {
    text-align: right;
    font-family: 'Monaco', monospace;
  }

  .item-rarity {
    text-transform: capitalize;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    text-align: center;

    &.none {
      background: rgba(128, 128, 128, 0.2);
      color: #ccc;
    }
    &.common {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
    &.uncommon {
      background: rgba(30, 255, 0, 0.2);
      color: #1eff00;
    }
    &.rare {
      background: rgba(0, 153, 255, 0.2);
      color: #0099ff;
    }
    &.very.rare {
      background: rgba(163, 53, 238, 0.2);
      color: #a335ee;
    }
    &.legendary {
      background: rgba(255, 128, 0, 0.2);
      color: #ff8000;
    }
    &.artifact {
      background: rgba(230, 204, 128, 0.2);
      color: #e6cc80;
    }
  }

  .item-source {
    font-family: 'Monaco', monospace;
    font-size: 0.85rem;
    text-align: center;
    padding: 0.25rem 0.5rem;
    background: rgba(40, 40, 40, 0.6);
    border-radius: 4px;
  }

  .checkbox-cell {
    width: 40px;
    text-align: center;
    padding: 0.75rem 0.5rem;
  }

  .item-checkbox {
    width: 18px;
    height: 18px;
    accent-color: #d4af37;
    cursor: pointer;
    margin: 0;

    &:hover {
      transform: scale(1.1);
    }
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;

  input {
    flex: 1;
    min-width: 200px;
    padding: 0.5rem;
    background: rgba(26, 26, 26, 0.8);
    border: 1px solid #444;
    border-radius: 4px;
    color: #fff;

    &:focus {
      outline: none;
      border-color: #d4af37;
    }
  }

  select {
    padding: 0.5rem;
    background: rgba(26, 26, 26, 0.8);
    border: 1px solid #444;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: #d4af37;
    }
  }
`;


// Type mappings for display
const TYPE_LABELS: { [key: string]: string } = {
  'M|XPHB': 'Melee Weapon',
  'R|XPHB': 'Ranged Weapon',
  'A|XPHB': 'Ammunition',
  'LA|XPHB': 'Light Armor',
  'MA|XPHB': 'Medium Armor',
  'HA|XPHB': 'Heavy Armor',
  'S|XPHB': 'Shield',
  'G|XPHB': 'Adventuring Gear',
  'SCF|XPHB': 'Spellcasting Focus',
  'INS|XPHB': 'Musical Instrument',
  'AT|XPHB': 'Artisan Tools',
  'FD|XPHB': 'Food & Drink',
  'RD|XDMG': 'Rod',
  'WD|XDMG': 'Wand',
  '$G|XDMG': 'Gemstone'
};

export const Step4EquipmentSelection: React.FC<Step4EquipmentSelectionProps> = ({
  data,
  onUpdate
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>(data.selectedEquipment?.equipment || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  // Load checked items from localStorage on component mount
  useEffect(() => {
    const savedCheckedItems = localStorage.getItem('wizardEquipmentCheckedItems');
    if (savedCheckedItems) {
      try {
        const itemIds = JSON.parse(savedCheckedItems);
        setCheckedItems(new Set(itemIds));
      } catch (error) {
        console.error('Error loading checked items:', error);
      }
    }
  }, []);

  // Auto-save checked items to localStorage
  useEffect(() => {
    const itemIds = Array.from(checkedItems);
    localStorage.setItem('wizardEquipmentCheckedItems', JSON.stringify(itemIds));
  }, [checkedItems]);

  // Fetch equipment data - load all items for selection
  const { data: equipmentResponse, isLoading, error } = useQuery(
    'equipment-all',
    async () => {
      // Fetch all pages of equipment for the selection step
      const allItems = [];
      const firstPage = await equipmentService.getAll();
      const totalPages = firstPage.data?.pagination?.pages || 1;

      for (let page = 1; page <= totalPages; page++) {
        const response = await fetch(`http://localhost:3001/api/items?page=${page}&limit=50`);
        const data = await response.json();
        if (data.items) {
          allItems.push(...data.items);
        }
      }

      return { data: { items: allItems, pagination: firstPage.data?.pagination } };
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const equipment = equipmentResponse?.data?.items || [];

  // Filter equipment based on search and filters
  const filteredEquipment = equipment.filter((item: Equipment) => {
    if (!item) return false;

    // Search filter
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && item.type !== typeFilter) {
      return false;
    }

    // Rarity filter
    if (rarityFilter !== 'all' && item.rarity !== rarityFilter) {
      return false;
    }

    return true;
  });

  // Get unique types and rarities for filters
  const uniqueTypes = [...new Set(equipment.map((item: Equipment) => item.type))].filter(Boolean).sort();
  const uniqueRarities = [...new Set(equipment.map((item: Equipment) => item.rarity))].filter(Boolean).sort();

  useEffect(() => {
    onUpdate({
      selectedEquipment: {
        weapons: [],
        equipment: selectedItems
      }
    });
  }, [selectedItems, onUpdate]);

  const handleItemClick = (item: Equipment, event: React.MouseEvent) => {
    // Don't open modal if checkbox was clicked
    if ((event.target as HTMLElement).closest('.checkbox-cell')) {
      return;
    }
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleAddToInventory = (item: Equipment) => {
    // Add to checked items when adding to inventory
    setCheckedItems(prev => new Set([...prev, item.id]));
    // Also add to selected items for the wizard
    setSelectedItems(prev => {
      if (!prev.includes(item.name)) {
        return [...prev, item.name];
      }
      return prev;
    });
  };

  const handleCheckboxChange = (itemId: number, itemName: string, checked: boolean) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });

    // Also update the selected items for the wizard
    setSelectedItems(prev => {
      if (checked && !prev.includes(itemName)) {
        return [...prev, itemName];
      } else if (!checked) {
        return prev.filter(name => name !== itemName);
      }
      return prev;
    });
  };

  const formatDamage = (item: Equipment) => {
    if (item.dmg1) {
      return `${item.dmg1}${item.dmgType ? ` ${item.dmgType}` : ''}`;
    }
    return '';
  };

  const formatAC = (item: Equipment) => {
    if (item.ac) {
      return `AC ${item.ac}`;
    }
    return '';
  };

  if (isLoading) {
    return (
      <StepContainer>
        <div className="step-title">Equipment Selection</div>
        <div style={{ textAlign: 'center', color: '#d4af37', padding: '2rem' }}>
          Loading equipment...
        </div>
      </StepContainer>
    );
  }

  if (error) {
    return (
      <StepContainer>
        <div className="step-title">Equipment Selection</div>
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '2rem' }}>
          Error loading equipment: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <div className="step-title">Equipment Selection</div>
      <div className="step-description">
        Complete equipment list from the database. Click items to select them for your character.
      </div>

      <FilterBar>
        <input
          type="text"
          placeholder="Search equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>
              {TYPE_LABELS[type] || type}
            </option>
          ))}
        </select>
        <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}>
          <option value="all">All Rarities</option>
          {uniqueRarities.map(rarity => (
            <option key={rarity} value={rarity}>
              {rarity}
            </option>
          ))}
        </select>
      </FilterBar>

      <div style={{ color: '#888', fontSize: '0.9rem', margin: '0.5rem 0' }}>
        Showing {filteredEquipment.length} of {equipment.length} items
        {selectedItems.length > 0 && (
          <span style={{ color: '#d4af37', marginLeft: '1rem' }}>
            • {selectedItems.length} selected
          </span>
        )}
      </div>

      <TableContainer>
        <ScrollableTable>
          <ItemTable>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Name</th>
                <th>Type</th>
                <th>Stats</th>
                <th>Weight</th>
                <th>Rarity</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((item: Equipment) => (
                <tr key={item.id} onClick={(e) => handleItemClick(item, e)}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      className="item-checkbox"
                      checked={checkedItems.has(item.id) || selectedItems.includes(item.name)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCheckboxChange(item.id, item.name, e.target.checked);
                      }}
                    />
                  </td>
                  <td className="item-name">{item.name}</td>
                  <td className="item-type">{TYPE_LABELS[item.type] || item.type}</td>
                  <td className="item-stats">
                    {formatDamage(item) || formatAC(item) || '-'}
                  </td>
                  <td className="item-weight">
                    {item.weight ? `${item.weight} lb` : '-'}
                  </td>
                  <td className={`item-rarity ${item.rarity?.replace(' ', '.')}`}>
                    {item.rarity || '-'}
                  </td>
                  <td className="item-source">{item.source}</td>
                </tr>
              ))}
            </tbody>
          </ItemTable>
        </ScrollableTable>
      </TableContainer>

      <EquipmentItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToInventory={handleAddToInventory}
      />
    </StepContainer>
  );
};