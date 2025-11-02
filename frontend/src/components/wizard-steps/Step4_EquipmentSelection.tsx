import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import type { FC } from 'react';
import styled from 'styled-components';
import { FixedSizeList as VirtualList, type ListChildComponentProps } from 'react-window';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import type { Equipment } from '@/types/api';
import { EquipmentItemModal } from '../EquipmentItemModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { logger } from '../../utils/logger';
import {
  useEquipmentCatalogStore,
  makeFilteredEquipmentSelector,
  selectAllEquipment,
} from '@/store/equipmentCatalogStore';
import { shallow } from 'zustand/shallow';

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

const GRID_TEMPLATE = '40px minmax(220px, 2fr) minmax(140px, 1fr) minmax(160px, 1fr) minmax(90px, 0.8fr) minmax(110px, 0.8fr) minmax(120px, 0.8fr)';

const EquipmentHeader = styled.div`
  display: grid;
  grid-template-columns: ${GRID_TEMPLATE};
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  border-bottom: 3px solid #ce9016;
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 1rem;
  color: #ce9016;
`;

const HeaderCell = styled.span`
  text-align: left;
  &:first-child {
    text-align: center;
  }
`;

const EquipmentListBody = styled.div`
  flex: 1;
`;

const EquipmentRow = styled.div<{ $zebra?: boolean }>`
  display: grid;
  grid-template-columns: ${GRID_TEMPLATE};
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #333;
  transition: all 0.2s ease;
  cursor: pointer;
  background: ${({ $zebra }) => ($zebra ? 'rgba(255, 255, 255, 0.02)' : 'transparent')};

  &:hover {
    background: rgba(206, 144, 22, 0.08);
    transform: translateX(2px);
  }
`;

const CheckboxCell = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.75rem 0.5rem;
`;

const ItemCheckbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #ce9016;
  cursor: pointer;
  margin: 0;

  &:hover {
    transform: scale(1.1);
  }
`;

const NameCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  font-weight: 600;
  font-size: 1rem;

  .name-content {
    display: flex;
    align-items: center;
    flex: 1;
  }
`;

const TypeCell = styled.div`
  color: #888;
  font-size: 0.9rem;
  font-style: italic;
`;

const StatsCell = styled.div`
  color: #ce9016;
  font-weight: 500;
`;

const WeightCell = styled.div`
  text-align: right;
  font-family: 'Monaco', monospace;
`;

const rarityStyles = (rarity?: string) => {
  const normalized = (rarity ?? '').toLowerCase();
  switch (normalized) {
    case 'none':
      return `
        background: rgba(128, 128, 128, 0.2);
        color: #ccc;
      `;
    case 'common':
      return `
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      `;
    case 'uncommon':
      return `
        background: rgba(30, 255, 0, 0.2);
        color: #1eff00;
      `;
    case 'rare':
      return `
        background: rgba(0, 153, 255, 0.2);
        color: #0099ff;
      `;
    case 'very rare':
      return `
        background: rgba(163, 53, 238, 0.2);
        color: #a335ee;
      `;
    case 'legendary':
      return `
        background: rgba(255, 128, 0, 0.2);
        color: #ff8000;
      `;
    case 'artifact':
      return `
        background: rgba(230, 204, 128, 0.2);
        color: #e6cc80;
      `;
    default:
      return `
        background: rgba(128, 128, 128, 0.2);
        color: #ccc;
      `;
  }
};

const RarityCell = styled.div<{ $rarity?: string }>`
  text-transform: capitalize;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-align: center;
  ${({ $rarity }) => rarityStyles($rarity)}
`;

const SourceCell = styled.div`
  font-family: 'Monaco', monospace;
  font-size: 0.85rem;
  text-align: center;
  padding: 0.25rem 0.5rem;
  background: rgba(40, 40, 40, 0.6);
  border-radius: 4px;
`;

const EQUIPMENT_ROW_HEIGHT = 72;
const EQUIPMENT_MAX_VISIBLE_ROWS = 12;

interface EquipmentRowData {
  items: Equipment[];
  checkedItems: Set<number>;
  selectedNames: Set<string>;
  onRowClick: (item: Equipment) => void;
  onCheckboxToggle: (item: Equipment, checked: boolean) => void;
  formatDamage: (item: Equipment) => string;
  formatAC: (item: Equipment) => string;
}

const EquipmentRowRenderer = memo(
  ({ index, style, data }: ListChildComponentProps<EquipmentRowData>) => {
    const item = data.items[index];
    if (!item) {
      return null;
    }

    const isChecked = data.checkedItems.has(item.id);
    const isSelected = data.selectedNames.has(item.name);
    const checked = isChecked || isSelected;
    const stats = data.formatDamage(item) || data.formatAC(item) || '-';
    const weight = item.weight ? (
      <WeightDisplay $isHeavy={item.weight > 20}>{item.weight} lb</WeightDisplay>
    ) : (
      '-'
    );

    return (
      <EquipmentRow
        style={{ ...style, width: '100%' }}
        $zebra={index % 2 === 1}
        onClick={() => data.onRowClick(item)}
      >
        <CheckboxCell>
          <ItemCheckbox
            type="checkbox"
            checked={checked}
            onChange={(event) => {
              event.stopPropagation();
              data.onCheckboxToggle(item, event.target.checked);
            }}
            onClick={(event) => event.stopPropagation()}
          />
        </CheckboxCell>
        <NameCell>
          <div className="name-content">
            {item.name}
            {checked && <EquippedBadge>Selected</EquippedBadge>}
          </div>
        </NameCell>
        <TypeCell>{TYPE_LABELS[item.type] || item.type}</TypeCell>
        <StatsCell>{stats}</StatsCell>
        <WeightCell>{weight}</WeightCell>
        <RarityCell {...(item.rarity ? { $rarity: item.rarity } : {})}>{item.rarity || '-'}</RarityCell>
        <SourceCell>{item.source}</SourceCell>
      </EquipmentRow>
    );
  }
);

EquipmentRowRenderer.displayName = 'EquipmentRowRenderer';

const EquippedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.4rem;
  background: linear-gradient(135deg, #ce9016, #b8860b);
  color: #1a1a1a;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px;
  margin-left: 0.5rem;
  font-family: 'Cinzel', serif;
  box-shadow: 0 2px 6px rgba(206, 144, 22, 0.3);

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
      color: #ce9016;
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
  background: rgba(206, 144, 22, 0.1);
  border: 2px solid rgba(206, 144, 22, 0.3);
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
    color: #ce9016;
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
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
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
  background: linear-gradient(135deg, #ce9016, #b8860b);
  border: 2px solid #ce9016;
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
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
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
      border-color: #ce9016;
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
      border-color: #ce9016;
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

export const Step4EquipmentSelection: FC<Step4EquipmentSelectionProps> = ({
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
        logger.error('Error loading checked items:', error);
      }
    }
  }, []);

  // Auto-save checked items to localStorage
  useEffect(() => {
    const itemIds = Array.from(checkedItems);
    localStorage.setItem('wizardEquipmentCheckedItems', JSON.stringify(itemIds));
  }, [checkedItems]);

  const loadEquipment = useEquipmentCatalogStore((state) => state.loadEquipment);
  const equipment = useEquipmentCatalogStore(selectAllEquipment);
  const { isLoading, error } = useEquipmentCatalogStore(
    (state) => ({
      isLoading: state.isLoading,
      error: state.error,
    }),
    shallow
  );

  useEffect(() => {
    void loadEquipment();
  }, [loadEquipment]);

  const filteredEquipmentSelector = useMemo(
    () =>
      makeFilteredEquipmentSelector({
        searchTerm,
        typeFilter,
        rarityFilter,
      }),
    [searchTerm, typeFilter, rarityFilter]
  );
  const filteredEquipment = useEquipmentCatalogStore(filteredEquipmentSelector);

  const selectedItemsSet = useMemo(() => new Set(selectedItems), [selectedItems]);
  const equipmentListHeight = useMemo(() => {
    if (filteredEquipment.length === 0) {
      return EQUIPMENT_ROW_HEIGHT;
    }
    const visibleRows = Math.min(filteredEquipment.length, EQUIPMENT_MAX_VISIBLE_ROWS);
    return visibleRows * EQUIPMENT_ROW_HEIGHT;
  }, [filteredEquipment.length]);
  const handleItemClick = useCallback((item: Equipment) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  const handleCheckboxChange = useCallback((itemId: number, itemName: string, checked: boolean) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });

    setSelectedItems(prev => {
      if (checked && !prev.includes(itemName)) {
        return [...prev, itemName];
      }
      if (!checked) {
        return prev.filter(name => name !== itemName);
      }
      return prev;
    });
  }, []);

  const formatDamage = useCallback((item: Equipment) => {
    if (item.dmg1) {
      const dmg = typeof item.dmg1 === 'object' ? JSON.stringify(item.dmg1) : item.dmg1;
      const dmgType = typeof item.dmgType === 'object' ? JSON.stringify(item.dmgType) : item.dmgType;
      return `${dmg}${dmgType ? ` ${dmgType}` : ''}`;
    }
    return '';
  }, []);

  const formatAC = useCallback((item: Equipment) => {
    if (item.ac) {
      const ac = typeof item.ac === 'object' ? JSON.stringify(item.ac) : item.ac;
      return `AC ${ac}`;
    }
    return '';
  }, []);

  const equipmentRowData = useMemo<EquipmentRowData>(
    () => ({
      items: filteredEquipment,
      checkedItems,
      selectedNames: selectedItemsSet,
      onRowClick: handleItemClick,
      onCheckboxToggle: (item, checked) => handleCheckboxChange(item.id, item.name, checked),
      formatDamage,
      formatAC,
    }),
    [filteredEquipment, checkedItems, selectedItemsSet, handleItemClick, handleCheckboxChange, formatDamage, formatAC]
  );
  const equipmentItemKey = useCallback(
    (index: number, data: EquipmentRowData) => {
      const item = data.items[index];
      return item ? item.id : index;
    },
    []
  );

  // Get unique types and rarities for filters
  const uniqueTypes = [...new Set(equipment.map((item: Equipment) => item.type))].filter(Boolean).sort();
  const uniqueRarities = [...new Set(equipment.map((item: Equipment) => item.rarity))].filter(Boolean).sort();

  // Categorize selected items
  const categorizedEquipment = useMemo(() => {
    const weapons: string[] = [];
    const armor: string[] = [];
    const shields: string[] = [];
    const otherEquipment: string[] = [];

    equipment.forEach((item) => {
      if (!checkedItems.has(item.id)) return;
      const itemType = item.type;

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
      armor: armor[0],
      shield: shields[0],
      equipment: otherEquipment,
    };
  }, [checkedItems, equipment]);

  useEffect(() => {
    const currentSelection = data.selectedEquipment ?? {};

    const selectionsEqual =
      Array.isArray(currentSelection.weapons)
        ? currentSelection.weapons.length === categorizedEquipment.weapons.length &&
          currentSelection.weapons.every((weapon) => categorizedEquipment.weapons.includes(weapon))
        : categorizedEquipment.weapons.length === 0;

    const armorEqual = (currentSelection.armor ?? null) === (categorizedEquipment.armor ?? null);
    const shieldEqual = (currentSelection.shield ?? null) === (categorizedEquipment.shield ?? null);
    const otherEqual = Array.isArray(currentSelection.equipment)
      ? currentSelection.equipment.length === categorizedEquipment.equipment.length &&
        currentSelection.equipment.every((item) => categorizedEquipment.equipment.includes(item))
      : categorizedEquipment.equipment.length === 0;

    if (selectionsEqual && armorEqual && shieldEqual && otherEqual) {
      return;
    }

    onUpdate({
      selectedEquipment: categorizedEquipment,
    });
  }, [categorizedEquipment, data.selectedEquipment, onUpdate]);

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
        <LoadingSpinner message="Loading equipment..." />
      </StepContainer>
    );
  }

  if (error) {
    return (
      <StepContainer>
        <div className="step-title">Equipment Selection</div>
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '2rem' }}>
          Error loading equipment: {error}
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
        <EquipmentHeader>
          <HeaderCell />
          <HeaderCell>Name</HeaderCell>
          <HeaderCell>Type</HeaderCell>
          <HeaderCell>Stats</HeaderCell>
          <HeaderCell>Weight</HeaderCell>
          <HeaderCell>Rarity</HeaderCell>
          <HeaderCell>Source</HeaderCell>
        </EquipmentHeader>
        <EquipmentListBody>
          <VirtualList
            height={equipmentListHeight}
            itemCount={filteredEquipment.length}
            itemSize={EQUIPMENT_ROW_HEIGHT}
            width="100%"
            itemData={equipmentRowData}
            overscanCount={6}
            itemKey={equipmentItemKey}
          >
            {EquipmentRowRenderer}
          </VirtualList>
        </EquipmentListBody>
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
