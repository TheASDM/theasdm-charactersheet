import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import equipmentService, { Equipment } from '../../services/equipmentService';
import { EquipmentItemModal } from '../EquipmentItemModal';
import { AbilityScoresHeader } from './AbilityScoresHeader';

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

const EquippedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.4rem;
  background: linear-gradient(135deg, #d4af37, #b8941f);
  color: #1a1a1a;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px;
  margin-left: 0.5rem;
  font-family: 'Cinzel', serif;
  box-shadow: 0 2px 6px rgba(212, 175, 55, 0.3);

  &::before {
    content: '⚔';
    margin-right: 0.25rem;
    font-size: 0.8rem;
  }
`;

const WeightDisplay = styled.span<{ $isHeavy?: boolean }>`
  color: ${props => props.$isHeavy ? '#ff6b6b' : '#ccc'};
  font-family: 'Monaco', monospace;
  font-weight: ${props => props.$isHeavy ? '600' : 'normal'};

  ${props => props.$isHeavy && `
    &::after {
      content: ' ⚠';
      color: #ff6b6b;
      margin-left: 0.25rem;
    }
  `}
`;

const ItemNameCell = styled.td`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .name-content {
    display: flex;
    align-items: center;
    flex: 1;
  }
`;

const SummarySection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  color: #888;
  font-size: 0.9rem;
  margin: 0.5rem 0;
  padding: 0.75rem;
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid #333;
  border-radius: 8px;

  .summary-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .label {
      color: #d4af37;
      font-weight: 600;
    }

    .value {
      color: #fff;
      font-weight: 500;
    }

    .weight-value {
      font-family: 'Monaco', monospace;
    }

    .weight-heavy {
      color: #ff6b6b;
    }

    .weight-normal {
      color: #4caf50;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

const SmartDefaultsSection = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin: 1rem 0;
`;

const SmartDefaultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    color: #d4af37;
    margin: 0;
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .class-info {
    color: #ccc;
    font-size: 0.9rem;
    font-style: italic;
  }
`;

const SmartDefaultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const DefaultItem = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.1);
  }

  .item-info {
    .name {
      color: #fff;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .type {
      color: #888;
      font-size: 0.8rem;
      font-style: italic;
    }
  }

  .item-weight {
    color: #ccc;
    font-family: 'Monaco', monospace;
    font-size: 0.8rem;
  }
`;

const ApplyDefaultsButton = styled.button`
  background: linear-gradient(135deg, #d4af37, #b8941f);
  border: 2px solid #d4af37;
  border-radius: 8px;
  color: #1a1a1a;
  padding: 0.75rem 1.5rem;
  font-family: 'Cinzel', serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
    background: linear-gradient(135deg, #e0bb43, #c4a025);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
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

  // Categorize selected items
  const categorizeSelectedItems = () => {
    const weapons: string[] = [];
    const armor: string[] = [];
    const shields: string[] = [];
    const otherEquipment: string[] = [];

    // Get full item data for selected items
    const selectedItemsData = equipment.filter(item => checkedItems.has(item.id));

    selectedItemsData.forEach(item => {
      const itemType = item.type;

      // Categorize based on type
      if (['M', 'R', 'A'].includes(itemType)) {
        weapons.push(item.name);
      } else if (['LA', 'MA', 'HA'].includes(itemType)) {
        armor.push(item.name);
      } else if (itemType === 'S') {
        shields.push(item.name);
      } else {
        otherEquipment.push(item.name);
      }
    });

    return {
      weapons,
      armor: armor[0], // Only one armor piece
      shield: shields[0], // Only one shield
      equipment: otherEquipment
    };
  };

  useEffect(() => {
    const categorizedEquipment = categorizeSelectedItems();
    onUpdate({
      selectedEquipment: categorizedEquipment
    });
  }, [checkedItems, equipment]);

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
      const dmg = typeof item.dmg1 === 'object' ? JSON.stringify(item.dmg1) : item.dmg1;
      const dmgType = typeof item.dmgType === 'object' ? JSON.stringify(item.dmgType) : item.dmgType;
      return `${dmg}${dmgType ? ` ${dmgType}` : ''}`;
    }
    return '';
  };

  const formatAC = (item: Equipment) => {
    if (item.ac) {
      const ac = typeof item.ac === 'object' ? JSON.stringify(item.ac) : item.ac;
      return `AC ${ac}`;
    }
    return '';
  };

  const calculateSelectedWeight = () => {
    return equipment
      .filter(item => checkedItems.has(item.id))
      .reduce((total, item) => total + (item.weight || 0), 0);
  };

  const selectedWeight = calculateSelectedWeight();

  // Smart defaults based on character class and build
  const getSmartDefaults = () => {
    const characterClass = data.selectedClass?.toLowerCase() || '';
    const suggestions: Equipment[] = [];

    // Class-specific weapon recommendations
    const weaponSuggestions: {[key: string]: string[]} = {
      'fighter': ['longsword', 'shield', 'chain mail', 'javelin'],
      'wizard': ['dagger', 'quarterstaff', 'light crossbow'],
      'rogue': ['shortsword', 'dagger', 'leather armor', 'thieves\' tools'],
      'cleric': ['mace', 'shield', 'chain mail', 'holy symbol'],
      'ranger': ['longbow', 'shortsword', 'leather armor'],
      'barbarian': ['greataxe', 'javelin', 'leather armor'],
      'bard': ['rapier', 'dagger', 'leather armor', 'musical instrument'],
      'druid': ['scimitar', 'shield', 'leather armor', 'druidcraft focus'],
      'paladin': ['longsword', 'shield', 'chain mail', 'holy symbol'],
      'sorcerer': ['dagger', 'light crossbow', 'component pouch'],
      'warlock': ['dagger', 'light crossbow', 'leather armor'],
      'monk': ['shortsword', 'dart'],
    };

    const classWeapons = weaponSuggestions[characterClass] || [];

    // Find matching equipment
    classWeapons.forEach(weaponName => {
      const foundItems = equipment.filter(item =>
        item.name.toLowerCase().includes(weaponName.toLowerCase()) &&
        !item.name.includes('+') // Exclude magic items for defaults
      );

      if (foundItems.length > 0) {
        // Prefer common/mundane items for defaults
        const basicItem = foundItems.find(item => !item.rarity || item.rarity === 'none' || item.rarity === 'common') || foundItems[0];
        if (!suggestions.find(s => s.id === basicItem.id)) {
          suggestions.push(basicItem);
        }
      }
    });

    return suggestions.slice(0, 6); // Limit to 6 suggestions
  };

  const smartDefaults = getSmartDefaults();

  const applySmartDefaults = () => {
    const newCheckedItems = new Set(checkedItems);
    const newSelectedItems = [...selectedItems];

    smartDefaults.forEach(item => {
      if (!newCheckedItems.has(item.id) && !newSelectedItems.includes(item.name)) {
        newCheckedItems.add(item.id);
        newSelectedItems.push(item.name);
      }
    });

    setCheckedItems(newCheckedItems);
    setSelectedItems(newSelectedItems);
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

      <AbilityScoresHeader data={data} />

      {smartDefaults.length > 0 && (
        <SmartDefaultsSection>
          <SmartDefaultsHeader>
            <h3>Suggested Equipment</h3>
            <div className="class-info">
              Recommended for {data.selectedClass || 'your class'}
            </div>
          </SmartDefaultsHeader>
          <SmartDefaultsGrid>
            {smartDefaults.map(item => (
              <DefaultItem key={item.id}>
                <div className="item-info">
                  <div className="name">{item.name}</div>
                  <div className="type">{TYPE_LABELS[item.type] || item.type}</div>
                </div>
                <div className="item-weight">
                  {item.weight ? `${item.weight} lb` : '—'}
                </div>
              </DefaultItem>
            ))}
          </SmartDefaultsGrid>
          <ApplyDefaultsButton
            onClick={applySmartDefaults}
            disabled={smartDefaults.every(item => checkedItems.has(item.id))}
          >
            {smartDefaults.every(item => checkedItems.has(item.id))
              ? 'All Suggested Items Selected'
              : 'Apply Suggested Equipment'
            }
          </ApplyDefaultsButton>
        </SmartDefaultsSection>
      )}

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

      <SummarySection>
        <div className="summary-item">
          <span className="label">Showing:</span>
          <span className="value">{filteredEquipment.length} of {equipment.length} items</span>
        </div>
        {selectedItems.length > 0 && (
          <>
            <div className="summary-item">
              <span className="label">Selected:</span>
              <span className="value">{selectedItems.length} items</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Weight:</span>
              <span className={`weight-value ${selectedWeight > 100 ? 'weight-heavy' : 'weight-normal'}`}>
                {selectedWeight.toFixed(1)} lb
                {selectedWeight > 100 && ' ⚠'}
              </span>
            </div>
          </>
        )}
      </SummarySection>

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
                  <ItemNameCell className="item-name">
                    <div className="name-content">
                      {item.name}
                      {checkedItems.has(item.id) && <EquippedBadge>Selected</EquippedBadge>}
                    </div>
                  </ItemNameCell>
                  <td className="item-type">{TYPE_LABELS[item.type] || item.type}</td>
                  <td className="item-stats">
                    {formatDamage(item) || formatAC(item) || '-'}
                  </td>
                  <td className="item-weight">
                    {item.weight ? (
                      <WeightDisplay $isHeavy={item.weight > 20}>
                        {item.weight} lb
                      </WeightDisplay>
                    ) : '-'}
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