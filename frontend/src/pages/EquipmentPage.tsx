import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import equipmentService, { Equipment } from '../services/equipmentService';
import { EquipmentItemModal } from '../components/EquipmentItemModal';

// Main page container matching Generator theme
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
`;

// Header section
const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-family: 'Cinzel', serif;
    font-size: 3rem;
    color: #d4af37;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  p {
    font-size: 1.2rem;
    color: #ccc;
    max-width: 600px;
    margin: 0 auto;
  }
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

// Main container matching Generator's WizardContent
const MainContainer = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 3rem;
  min-height: 500px;
  backdrop-filter: blur(10px);
`;

// Filter section
const FilterSection = styled.div`
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SearchInput = styled.input`
  background: rgba(45, 45, 45, 0.8);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px 16px;
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  width: 100%;
  transition: all 0.3s ease;

  &::placeholder {
    color: #888;
  }

  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
  }

  &:hover {
    border-color: #666;
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
`;

const Select = styled.select`
  background: rgba(45, 45, 45, 0.8);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px 16px;
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  min-width: 180px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
  }

  &:hover {
    border-color: #666;
  }

  option {
    background: #2d2d2d;
    color: #f0f0f0;
  }
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(45, 45, 45, 0.5);
  border-radius: 8px;
  border: 1px solid #444;
  color: #ccc;

  .count {
    color: #d4af37;
    font-weight: 600;
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
`;

const TableContainer = styled.div`
  background: rgba(35, 35, 35, 0.8);
  border: 1px solid #444;
  border-radius: 8px;
  overflow: hidden;
`;

const ScrollableTable = styled.div`
  max-height: 65vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(26, 26, 26, 0.5);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.5);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 175, 55, 0.7);
  }
`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    background: rgba(26, 26, 26, 0.9);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  th {
    text-align: left;
    padding: 1rem;
    color: #d4af37;
    font-weight: 600;
    font-size: 0.9rem;
    border-bottom: 2px solid #444;
    font-family: 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tbody tr {
    border-bottom: 1px solid #333;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      background: rgba(212, 175, 55, 0.1);
    }

    &:nth-child(even) {
      background: rgba(255, 255, 255, 0.02);
    }
  }

  td {
    padding: 0.75rem 1rem;
    color: #ccc;
    font-size: 0.9rem;
    vertical-align: middle;
  }

  .item-name {
    color: #f0f0f0;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .item-type {
    color: #999;
    font-size: 0.85rem;
  }

  .item-stats {
    color: #d4af37;
    font-weight: 500;
  }

  .item-weight {
    text-align: right;
    color: #ccc;
  }

  .item-rarity {
    text-transform: capitalize;
    font-weight: 600;
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    text-align: center;
    font-size: 0.85rem;
    border: 1px solid currentColor;

    &.none {
      background: rgba(128, 128, 128, 0.2);
      color: #999;
    }
    &.common {
      background: rgba(255, 255, 255, 0.15);
      color: #ddd;
    }
    &.uncommon {
      background: rgba(30, 255, 0, 0.15);
      color: #5eff5e;
    }
    &.rare {
      background: rgba(0, 153, 255, 0.15);
      color: #4da6ff;
    }
    &.very.rare {
      background: rgba(163, 53, 238, 0.15);
      color: #b366ff;
    }
    &.legendary {
      background: rgba(255, 128, 0, 0.15);
      color: #ffa640;
    }
    &.artifact {
      background: rgba(230, 204, 128, 0.15);
      color: #f0d980;
    }
  }

  .item-source {
    font-size: 0.8rem;
    text-align: center;
    padding: 0.35rem 0.7rem;
    background: rgba(212, 175, 55, 0.1);
    border-radius: 4px;
    color: #d4af37;
    font-weight: 500;
    border: 1px solid rgba(212, 175, 55, 0.2);
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
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
`;

const PaginationBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(45, 45, 45, 0.5);
  border-radius: 8px;
  border: 1px solid #444;

  .pagination-controls {
    display: flex;
    gap: 8px;
    align-items: center;

    button {
      padding: 8px 16px;
      background: rgba(35, 35, 35, 0.8);
      border: 1px solid #555;
      border-radius: 6px;
      color: #f0f0f0;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: rgba(212, 175, 55, 0.2);
        border-color: #d4af37;
        color: #d4af37;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &.active {
        background: rgba(212, 175, 55, 0.2);
        border-color: #d4af37;
        color: #d4af37;
      }
    }

    .page-info {
      color: #d4af37;
      margin: 0 1rem;
      font-weight: 600;
    }
  }

  .load-all-btn {
    padding: 10px 20px;
    background: rgba(212, 175, 55, 0.2);
    border: 1px solid #d4af37;
    border-radius: 6px;
    color: #d4af37;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(212, 175, 55, 0.3);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #d4af37;
  padding: 4rem;
  font-size: 1.3rem;
  font-weight: 600;
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: #ff6b6b;
  padding: 4rem;
  font-size: 1.2rem;
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, rarityFilter]);

  // Load checked items from localStorage
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

  // Save checked items to localStorage
  useEffect(() => {
    const itemIds = Array.from(checkedItems);
    localStorage.setItem('equipmentCheckedItems', JSON.stringify(itemIds));
  }, [checkedItems]);

  // Fetch equipment data
  const { data: equipmentResponse, isLoading, error } = useQuery(
    ['equipment', currentPage, loadAll, searchTerm, typeFilter, rarityFilter],
    async () => {
      if (loadAll) {
        const allItems = [];
        const firstPage = await equipmentService.getAll({
          page: 1,
          limit: 50,
          ...(searchTerm && { search: searchTerm }),
          ...(typeFilter !== 'all' && { type: typeFilter }),
          ...(rarityFilter !== 'all' && { rarity: rarityFilter }),
        });
        const totalPages = firstPage.data?.pagination?.pages || 1;

        for (let page = 1; page <= totalPages; page++) {
          const response = await equipmentService.getAll({
            page,
            limit: 50,
            ...(searchTerm && { search: searchTerm }),
            ...(typeFilter !== 'all' && { type: typeFilter }),
            ...(rarityFilter !== 'all' && { rarity: rarityFilter }),
          });
          if (response.data?.items) {
            allItems.push(...response.data.items);
          }
        }

        return { data: { items: allItems, pagination: firstPage.data?.pagination } };
      } else {
        return equipmentService.getAll({
          page: currentPage,
          limit: 50,
          ...(searchTerm && { search: searchTerm }),
          ...(typeFilter !== 'all' && { type: typeFilter }),
          ...(rarityFilter !== 'all' && { rarity: rarityFilter }),
        });
      }
    },
    {
      staleTime: 5 * 60 * 1000,
      keepPreviousData: true,
    }
  );

  const equipment = equipmentResponse?.data?.items || [];
  const pagination = equipmentResponse?.data?.pagination;

  // Equipment is already filtered by the backend, no need for client-side filtering
  const filteredEquipment = equipment;

  // Get unique types and rarities from all loaded items
  const uniqueTypes = [...new Set(equipment.map((item: Equipment) => item.type))].filter(Boolean).sort();
  const uniqueRarities = [...new Set(equipment.map((item: Equipment) => item.rarity))].filter(t => t && t !== 'none').sort();
  // Add 'none' at the beginning for mundane items
  if (equipment.some((item: Equipment) => item.rarity === 'none')) {
    uniqueRarities.unshift('none');
  }

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
    setCheckedItems(prev => new Set([...prev, item.id]));
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
      <PageContainer>
        <ContentContainer>
          <Header>
            <h1>D&D Equipment</h1>
            <p>Complete D&D 2024 Equipment Collection</p>
          </Header>
          <MainContainer>
            <LoadingMessage>
              Loading equipment database...
            </LoadingMessage>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <Header>
            <h1>D&D Equipment</h1>
            <p>Complete D&D 2024 Equipment Collection</p>
          </Header>
          <MainContainer>
            <ErrorMessage>
              Error loading equipment: {error instanceof Error ? error.message : 'Unknown error'}
            </ErrorMessage>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <h1>D&D Equipment</h1>
          <p>{loadAll ? equipment.length : (pagination?.total || equipment.length)} items from XPHB and XDMG</p>
        </Header>

        <MainContainer>
          <FilterSection>
            <SearchInput
              type="text"
              placeholder="Search equipment by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FilterRow>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>
                    {TYPE_LABELS[type] || type}
                  </option>
                ))}
              </Select>
              <Select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}>
                <option value="all">All Rarities</option>
                {uniqueRarities.map(rarity => (
                  <option key={rarity} value={rarity}>
                    {rarity}
                  </option>
                ))}
              </Select>
            </FilterRow>
          </FilterSection>

          <StatsBar>
            <div>
              Showing <span className="count">{filteredEquipment.length}</span> of{' '}
              <span className="count">{loadAll ? equipment.length : (pagination?.total || equipment.length)}</span> items
              {!loadAll && pagination && <span style={{ marginLeft: '0.5rem', color: '#999' }}>(Page {currentPage} of {pagination.pages})</span>}
            </div>
            <div>
              Sources: XPHB · XDMG
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
        </MainContainer>
      </ContentContainer>

      <EquipmentItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToInventory={handleAddToInventory}
      />
    </PageContainer>
  );
};

export default EquipmentPage;
