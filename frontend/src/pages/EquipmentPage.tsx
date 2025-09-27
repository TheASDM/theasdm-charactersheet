import { useState } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import equipmentService, { Equipment, EQUIPMENT_TYPE_MAP } from '../services/equipmentService';
import { processDbMarkup } from '../utils/textProcessor';

const PageContainer = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: 100vh;
  padding: 2rem;
  color: #ffffff;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-family: 'Cinzel', serif;
    font-size: 2.5rem;
    color: #d4af37;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #ccc;
    font-size: 1.1rem;
  }
`;

const FiltersContainer = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      color: #d4af37;
      font-weight: 600;
      font-size: 0.9rem;
    }

    select, input {
      background: rgba(40, 40, 40, 0.8);
      border: 1px solid #444;
      border-radius: 6px;
      padding: 0.5rem;
      color: #fff;
      font-size: 0.9rem;
      min-width: 150px;

      &:focus {
        outline: none;
        border-color: #d4af37;
        box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.3);
      }
    }
  }

  .search-section {
    flex: 1;
    min-width: 250px;

    input {
      width: 100%;
      min-width: unset;
    }
  }
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  .stat-card {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    flex: 1;
    min-width: 120px;

    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #d4af37;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #ccc;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
`;

const EquipmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const EquipmentCard = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid #444;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 200px;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);
  }

  .equipment-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;

    .equipment-name {
      font-family: 'Cinzel', serif;
      font-size: 1.1rem;
      color: #d4af37;
      font-weight: 600;
      flex: 1;
      margin-right: 0.5rem;
    }

    .equipment-rarity {
      background: rgba(212, 175, 55, 0.2);
      color: #d4af37;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
  }

  .equipment-type {
    color: #888;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    text-transform: capitalize;
  }

  .equipment-description {
    color: #ccc;
    font-size: 0.9rem;
    line-height: 1.4;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
  }

  .equipment-stats {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #444;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    .stat {
      background: rgba(40, 40, 40, 0.6);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #aaa;

      .label {
        color: #d4af37;
        font-weight: 600;
      }
    }
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 1.1rem;
  color: #d4af37;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #888;

  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .message {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  .suggestion {
    font-size: 0.9rem;
    color: #666;
  }
`;

export default function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [selectedWeaponCategory, setSelectedWeaponCategory] = useState('all');

  // Fetch equipment data
  const { data: equipmentResponse, isLoading, error } = useQuery(
    'equipment',
    equipmentService.getAll,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const equipment = equipmentResponse?.data || [];

  // Filter equipment based on selected filters
  const filteredEquipment = equipment.filter((item: Equipment) => {
    // Search term filter
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.type.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all') {
      switch (selectedCategory) {
        case 'weapons':
          if (!item.weaponCategory) return false;
          break;
        case 'armor':
          if (!item.ac && item.type !== 'S|XPHB') return false;
          break;
        case 'magic-items':
          if (item.rarity === 'none' || !item.rarity) return false;
          break;
        case 'adventuring-gear':
          if (item.weaponCategory || item.ac || (item.rarity !== 'none' && item.rarity)) return false;
          break;
      }
    }

    // Rarity filter
    if (selectedRarity !== 'all' && item.rarity !== selectedRarity) {
      return false;
    }

    // Weapon category filter
    if (selectedWeaponCategory !== 'all' && item.weaponCategory !== selectedWeaponCategory) {
      return false;
    }

    return true;
  });

  // Get unique rarities and weapon categories for filters
  const rarities = Array.from(new Set(equipment.map((item: Equipment) => item.rarity))).filter(Boolean);
  const weaponCategories = Array.from(new Set(equipment.filter((item: Equipment) => item.weaponCategory).map((item: Equipment) => item.weaponCategory))).filter(Boolean);

  const formatEquipmentDescription = (entries: any): string => {
    if (!entries) return '';

    if (Array.isArray(entries)) {
      return processDbMarkup(entries.join(' '));
    }

    if (typeof entries === 'string') {
      return processDbMarkup(entries);
    }

    return '';
  };

  const getEquipmentStats = (item: Equipment) => {
    const stats = [];

    if (item.ac) stats.push({ label: 'AC', value: item.ac });
    if (item.dmg1) stats.push({ label: 'Damage', value: `${item.dmg1} ${item.dmgType || ''}` });
    if (item.range) stats.push({ label: 'Range', value: item.range });
    if (item.weight) stats.push({ label: 'Weight', value: `${item.weight} lb` });
    if (item.value) stats.push({ label: 'Cost', value: `${item.value} ${item.valueCurrency || 'gp'}` });
    if (item.reqAttune) stats.push({ label: 'Attunement', value: typeof item.reqAttune === 'string' ? item.reqAttune : 'Required' });

    return stats;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner>Loading equipment...</LoadingSpinner>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '2rem' }}>
          Failed to load equipment data. Please try again later.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <h1>⚔️ Equipment Compendium</h1>
        <div className="subtitle">Discover weapons, armor, and magical items from the D&D 2024 Player's Handbook</div>
      </Header>

      <FiltersContainer>
        <div className="filter-section">
          <label>Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="weapons">Weapons</option>
            <option value="armor">Armor</option>
            <option value="adventuring-gear">Adventuring Gear</option>
            <option value="magic-items">Magic Items</option>
          </select>
        </div>

        <div className="filter-section">
          <label>Rarity</label>
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
          >
            <option value="all">All Rarities</option>
            {rarities.map(rarity => (
              <option key={rarity} value={rarity}>
                {rarity?.charAt(0).toUpperCase() + rarity?.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory === 'weapons' && (
          <div className="filter-section">
            <label>Weapon Type</label>
            <select
              value={selectedWeaponCategory}
              onChange={(e) => setSelectedWeaponCategory(e.target.value)}
            >
              <option value="all">All Types</option>
              {weaponCategories.map(category => (
                <option key={category} value={category}>
                  {category ? category.charAt(0).toUpperCase() + category.slice(1) : category}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-section search-section">
          <label>Search Equipment</label>
          <input
            type="text"
            placeholder="Search by name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </FiltersContainer>

      <StatsContainer>
        <div className="stat-card">
          <div className="stat-number">{equipment.length}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{filteredEquipment.length}</div>
          <div className="stat-label">Filtered</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{equipment.filter((item: Equipment) => item.weaponCategory).length}</div>
          <div className="stat-label">Weapons</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{equipment.filter((item: Equipment) => item.ac || item.type === 'S|XPHB').length}</div>
          <div className="stat-label">Armor</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{equipment.filter((item: Equipment) => item.rarity !== 'none' && item.rarity).length}</div>
          <div className="stat-label">Magic Items</div>
        </div>
      </StatsContainer>

      {filteredEquipment.length === 0 ? (
        <EmptyState>
          <div className="icon">🔍</div>
          <div className="message">No equipment found</div>
          <div className="suggestion">Try adjusting your search filters</div>
        </EmptyState>
      ) : (
        <EquipmentGrid>
          {filteredEquipment.map((item: Equipment) => (
            <EquipmentCard key={item.id}>
              <div className="equipment-header">
                <div className="equipment-name">{item.name}</div>
                <div className="equipment-rarity">{item.rarity}</div>
              </div>

              <div className="equipment-type">
                {EQUIPMENT_TYPE_MAP[item.type as keyof typeof EQUIPMENT_TYPE_MAP] || item.type}
              </div>

              <div className="equipment-description">
                {formatEquipmentDescription(item.entries)}
              </div>

              {getEquipmentStats(item).length > 0 && (
                <div className="equipment-stats">
                  {getEquipmentStats(item).map((stat, index) => (
                    <div key={index} className="stat">
                      <span className="label">{stat.label}:</span> {stat.value}
                    </div>
                  ))}
                </div>
              )}
            </EquipmentCard>
          ))}
        </EquipmentGrid>
      )}
    </PageContainer>
  );
}