import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import equipmentService, { Equipment } from '../services/equipmentService';
import { EquipmentItemModal } from '../components/EquipmentItemModal';

const EquipmentPageContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: 100vh;
  color: #fff;

  h1 {
    color: #d4af37;
    font-family: 'Cinzel', serif;
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 1rem;
  }

  .subtitle {
    text-align: center;
    color: #ccc;
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  flex-wrap: wrap;
  background: rgba(26, 26, 26, 0.8);
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid #444;

  input {
    flex: 1;
    min-width: 250px;
    padding: 0.75rem;
    background: rgba(40, 40, 40, 0.8);
    border: 1px solid #555;
    border-radius: 6px;
    color: #fff;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: #d4af37;
      background: rgba(50, 50, 50, 0.9);
    }

    &::placeholder {
      color: #888;
    }
  }

  select {
    padding: 0.75rem;
    background: rgba(40, 40, 40, 0.8);
    border: 1px solid #555;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    min-width: 150px;

    &:focus {
      outline: none;
      border-color: #d4af37;
    }

    option {
      background: #2d2d2d;
      color: #fff;
    }
  }
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
  color: #aaa;
  font-size: 0.95rem;

  .count {
    color: #d4af37;
    font-weight: 600;
  }
`;

const TableContainer = styled.div`
  background: rgba(26, 26, 26, 0.9);
  border: 2px solid #444;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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

const PaginationBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(26, 26, 26, 0.8);
  border-radius: 8px;
  border: 1px solid #444;

  .pagination-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;

    button {
      padding: 0.5rem 1rem;
      background: rgba(40, 40, 40, 0.8);
      border: 1px solid #555;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #d4af37;
        border-color: #d4af37;
        color: #1a1a1a;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.active {
        background: #d4af37;
        border-color: #d4af37;
        color: #1a1a1a;
      }
    }

    .page-info {
      color: #ccc;
      margin: 0 1rem;
      font-size: 0.9rem;
    }
  }

  .load-all-btn {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #d4af37, #e6b52a);
    border: none;
    border-radius: 6px;
    color: #1a1a1a;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
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
  '$G|XDMG': 'Gemstone',
  'AF|XDMG': 'Futuristic',
  'adventuring gear': 'Adventuring Gear'
};

const EquipmentPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadAll, setLoadAll] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  // Load checked items from localStorage on component mount
  useEffect(() => {
    const savedCheckedItems = localStorage.getItem('equipmentCheckedItems');
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
    localStorage.setItem('equipmentCheckedItems', JSON.stringify(itemIds));
  }, [checkedItems]);

  // Fetch equipment data with pagination
  const { data: equipmentResponse, isLoading, error } = useQuery(
    ['equipment', currentPage, loadAll],
    async () => {
      if (loadAll) {
        // Fetch all pages
        const allItems = [];
        const firstPage = await equipmentService.getAll();
        const totalPages = firstPage.data?.pagination?.pages || 1;

        for (let page = 1; page <= totalPages; page++) {
          const response = await fetch(`http://localhost:3001/api/items?page=${page}&limit=50`);
          const data = await response.json();
          allItems.push(...data.items);
        }

        return { data: { items: allItems, pagination: firstPage.data?.pagination } };
      } else {
        return equipmentService.getAll();
      }
    },
    {
      staleTime: 5 * 60 * 1000,
      keepPreviousData: true,
    }
  );

  const equipment = equipmentResponse?.data?.items || [];
  const pagination = equipmentResponse?.data?.pagination;

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
    // TODO: Implement actual inventory addition to character sheet
    console.log('Added to inventory:', item.name);
  };

  const handleCheckboxChange = (itemId: number, checked: boolean) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <EquipmentPageContainer>
        <h1>🏹 Equipment Database</h1>
        <div style={{ textAlign: 'center', color: '#d4af37', padding: '4rem', fontSize: '1.2rem' }}>
          Loading equipment database...
        </div>
      </EquipmentPageContainer>
    );
  }

  if (error) {
    return (
      <EquipmentPageContainer>
        <h1>🏹 Equipment Database</h1>
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '4rem', fontSize: '1.2rem' }}>
          Error loading equipment: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </EquipmentPageContainer>
    );
  }

  return (
    <EquipmentPageContainer>
      <h1>🏹 Equipment Database</h1>
      <div className="subtitle">
        Complete D&D 2024 equipment collection from XPHB and XDMG
      </div>

      <FilterBar>
        <input
          type="text"
          placeholder="🔍 Search equipment by name..."
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

      <StatsBar>
        <div>
          Showing <span className="count">{filteredEquipment.length}</span> of{' '}
          <span className="count">{equipment.length}</span> items
        </div>
        <div>
          Sources: XPHB (Player's Handbook), XDMG (Dungeon Master's Guide)
        </div>
      </StatsBar>

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
                      checked={checkedItems.has(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCheckboxChange(item.id, e.target.checked);
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

      {!loadAll && pagination && pagination.pages > 1 && (
        <PaginationBar>
          <div className="pagination-controls">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              First
            </button>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button>
            <div className="page-info">
              Page {currentPage} of {pagination.pages}
            </div>
            <button
              disabled={currentPage === pagination.pages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
            <button
              disabled={currentPage === pagination.pages}
              onClick={() => setCurrentPage(pagination.pages)}
            >
              Last
            </button>
          </div>
          <button
            className="load-all-btn"
            onClick={() => setLoadAll(true)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load All Items'}
          </button>
        </PaginationBar>
      )}

      {loadAll && (
        <PaginationBar>
          <div style={{ color: '#d4af37', fontWeight: 600 }}>
            All {equipment.length} items loaded
          </div>
          <button
            className="load-all-btn"
            onClick={() => {
              setLoadAll(false);
              setCurrentPage(1);
            }}
          >
            Enable Pagination
          </button>
        </PaginationBar>
      )}

      <EquipmentItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToInventory={handleAddToInventory}
      />
    </EquipmentPageContainer>
  );
};

export default EquipmentPage;