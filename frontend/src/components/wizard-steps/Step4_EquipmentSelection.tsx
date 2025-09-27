import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import equipmentService, { Equipment } from '../../services/equipmentService';
import { processDbMarkup } from '../../utils/textProcessor';

interface Step4EquipmentSelectionProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

const EquipmentContainer = styled.div`
  .equipment-category {
    margin-bottom: 2rem;
    background: rgba(26, 26, 26, 0.6);
    border-radius: 12px;
    padding: 1.5rem;

    .category-title {
      color: #d4af37;
      font-family: 'Cinzel', serif;
      font-size: 1.2rem;
      margin-bottom: 1rem;
      text-align: center;
    }

    .category-description {
      color: #ccc;
      font-size: 0.9rem;
      text-align: center;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
  }
`;

const EquipmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const EquipmentCard = styled.div<{ selected: boolean }>`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid ${props => props.selected ? '#d4af37' : '#444'};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  ${props => props.selected && `
    background: rgba(212, 175, 55, 0.1);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
  `}

  .equipment-name {
    color: #d4af37;
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .equipment-stats {
    color: #aaa;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    .stat {
      background: rgba(40, 40, 40, 0.6);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.7rem;

      .label {
        color: #d4af37;
        font-weight: 600;
      }
    }
  }

  .equipment-description {
    color: #ccc;
    font-size: 0.8rem;
    line-height: 1.3;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
`;

const SelectedEquipmentSummary = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;

  .summary-title {
    color: #d4af37;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .summary-items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;

    .item {
      background: rgba(26, 26, 26, 0.8);
      color: #ccc;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }
  }
`;

export const Step4EquipmentSelection: React.FC<Step4EquipmentSelectionProps> = ({
  data,
  onUpdate
}) => {
  const [selectedEquipment, setSelectedEquipment] = useState(data.selectedEquipment || { weapons: [], equipment: [] });

  // Fetch equipment data
  const { data: equipmentResponse, isLoading, error } = useQuery(
    'equipment',
    equipmentService.getAll,
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const equipment = equipmentResponse?.data || [];

  console.log('Equipment step loaded:', { equipmentCount: equipment.length, selectedEquipment, isLoading, error });

  // Filter equipment by category - with safety checks
  const weapons = equipment.filter((item: Equipment) =>
    item && item.weaponCategory && item.rarity === 'none'
  );
  const armor = equipment.filter((item: Equipment) =>
    item && (item.ac || item.type === 'S|XPHB') && item.rarity === 'none'
  );
  const basicGear = equipment.filter((item: Equipment) =>
    item &&
    !item.weaponCategory &&
    !item.ac &&
    item.type !== 'S|XPHB' &&
    item.rarity === 'none' &&
    (item.type === 'G|XPHB' || item.type === 'AT|XPHB')
  ).slice(0, 20); // Limit to prevent overwhelming the user

  useEffect(() => {
    onUpdate({ selectedEquipment });
  }, [selectedEquipment, onUpdate]);

  const handleEquipmentToggle = (category: 'armor' | 'shield' | 'weapons' | 'equipment', itemName: string) => {
    setSelectedEquipment(prev => {
      const newSelection = { ...prev };

      if (category === 'armor' || category === 'shield') {
        // Single selection for armor and shield
        if (newSelection[category] === itemName) {
          delete newSelection[category];
        } else {
          newSelection[category] = itemName;
        }
      } else {
        // Multiple selection for weapons and equipment
        const currentArray = (newSelection[category] as string[]) || [];
        const index = currentArray.indexOf(itemName);

        if (index >= 0) {
          // Remove if already selected
          newSelection[category] = currentArray.filter(item => item !== itemName);
        } else {
          // Add if not selected
          newSelection[category] = [...currentArray, itemName];
        }
      }

      return newSelection;
    });
  };

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
    if (item.weaponCategory) stats.push({ label: 'Type', value: item.weaponCategory });

    return stats;
  };

  const getSelectedItemsList = () => {
    const items = [];

    if (selectedEquipment.armor) items.push(selectedEquipment.armor);
    if (selectedEquipment.shield) items.push(selectedEquipment.shield);
    if (selectedEquipment.weapons) items.push(...selectedEquipment.weapons);
    if (selectedEquipment.equipment) items.push(...selectedEquipment.equipment);

    return items;
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
        Choose starting equipment for your character. You can select armor, weapons, and basic adventuring gear.
      </div>

      <div style={{ padding: '1rem', textAlign: 'center', color: '#ccc' }}>
        <p>Equipment loaded: {equipment.length} items</p>
        <p>Weapons: {weapons.length}, Armor: {armor.length}, Basic Gear: {basicGear.length}</p>
        <p>Equipment step working! 🎉</p>
      </div>

      <div className="step-content">
        <EquipmentContainer>
          <div className="equipment-category">
            <div className="category-title">Weapons</div>
            <div className="category-description">
              Select weapons to wield in combat. You can choose multiple weapons.
            </div>
            <EquipmentGrid>
              {weapons.slice(0, 12).map((item: Equipment) => (
                <EquipmentCard
                  key={item.id}
                  selected={selectedEquipment.weapons?.includes(item.name) || false}
                  onClick={() => handleEquipmentToggle('weapons', item.name)}
                >
                  <div className="equipment-name">{item.name}</div>

                  {getEquipmentStats(item).length > 0 && (
                    <div className="equipment-stats">
                      {getEquipmentStats(item).map((stat, index) => (
                        <div key={index} className="stat">
                          <span className="label">{stat.label}:</span> {stat.value}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="equipment-description">
                    {formatEquipmentDescription(item.entries)}
                  </div>
                </EquipmentCard>
              ))}
            </EquipmentGrid>
          </div>

          {/* Armor */}
          <div className="equipment-category">
            <div className="category-title">Armor & Shields</div>
            <div className="category-description">
              Select one piece of armor and optionally a shield to protect yourself.
            </div>
            <EquipmentGrid>
              {armor.slice(0, 8).map((item: Equipment) => (
                <EquipmentCard
                  key={item.id}
                  selected={
                    (item.type === 'S|XPHB' && selectedEquipment.shield === item.name) ||
                    (item.type !== 'S|XPHB' && selectedEquipment.armor === item.name)
                  }
                  onClick={() => handleEquipmentToggle(item.type === 'S|XPHB' ? 'shield' : 'armor', item.name)}
                >
                  <div className="equipment-name">{item.name}</div>

                  {getEquipmentStats(item).length > 0 && (
                    <div className="equipment-stats">
                      {getEquipmentStats(item).map((stat, index) => (
                        <div key={index} className="stat">
                          <span className="label">{stat.label}:</span> {stat.value}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="equipment-description">
                    {formatEquipmentDescription(item.entries)}
                  </div>
                </EquipmentCard>
              ))}
            </EquipmentGrid>
          </div>

          {/* Basic Equipment */}
          <div className="equipment-category">
            <div className="category-title">Adventuring Gear</div>
            <div className="category-description">
              Select useful tools and equipment for your adventures.
            </div>
            <EquipmentGrid>
              {basicGear.map((item: Equipment) => (
                <EquipmentCard
                  key={item.id}
                  selected={selectedEquipment.equipment?.includes(item.name) || false}
                  onClick={() => handleEquipmentToggle('equipment', item.name)}
                >
                  <div className="equipment-name">{item.name}</div>

                  {getEquipmentStats(item).length > 0 && (
                    <div className="equipment-stats">
                      {getEquipmentStats(item).map((stat, index) => (
                        <div key={index} className="stat">
                          <span className="label">{stat.label}:</span> {stat.value}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="equipment-description">
                    {formatEquipmentDescription(item.entries)}
                  </div>
                </EquipmentCard>
              ))}
            </EquipmentGrid>
          </div>

          {getSelectedItemsList().length > 0 && (
            <SelectedEquipmentSummary>
              <div className="summary-title">Selected Equipment</div>
              <div className="summary-items">
                {getSelectedItemsList().map((itemName, index) => (
                  <div key={index} className="item">{itemName}</div>
                ))}
              </div>
            </SelectedEquipmentSummary>
          )}
        </EquipmentContainer>
      </div>
    </StepContainer>
  );
};