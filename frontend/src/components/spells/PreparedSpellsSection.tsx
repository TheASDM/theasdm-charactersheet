import styled from 'styled-components';
import type { Spell } from '@/types/api';

interface PreparedSpellsSectionProps {
  slotCount: number;
  preparedIds: string[];
  knownSpells: Spell[];
  onPreparedChange: (index: number, spellId: string) => void;
  maxPrepared: number | null;
}

const Section = styled.div`
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid rgba(206, 144, 22, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h2 {
    margin: 0;
    font-size: 1.1rem;
    color: #ce9016;
    letter-spacing: 0.5px;
  }

  span {
    color: #c0aa70;
    font-size: 0.9rem;
  }
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  label {
    min-width: 80px;
    font-size: 0.9rem;
    color: #ce9016;
    font-weight: 600;
  }
`;

const Select = styled.select`
  flex: 1;
  background: rgba(16, 16, 16, 0.9);
  border: 1px solid rgba(206, 144, 22, 0.35);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: #f8f4e1;
  font-size: 0.9rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #e0a523;
    box-shadow: 0 0 0 2px rgba(241, 198, 97, 0.15);
  }

  option {
    background: #1a1a1a;
    color: #f8f4e1;
  }
`;

export const PreparedSpellsSection = ({
  slotCount,
  preparedIds,
  knownSpells,
  onPreparedChange,
  maxPrepared,
}: PreparedSpellsSectionProps) => {
  const slots = Array.from({ length: slotCount }, (_, i) => i);

  return (
    <Section>
      <Header>
        <h2>Prepared Spells</h2>
        {maxPrepared !== null && (
          <span>
            {preparedIds.length} / {maxPrepared} prepared
          </span>
        )}
      </Header>
      <Rows>
        {slots.map((index) => {
          const currentId = preparedIds[index] ?? '';
          return (
            <Row key={index}>
              <label>Slot {index + 1}</label>
              <Select
                value={currentId}
                onChange={(e) => onPreparedChange(index, e.target.value)}
              >
                <option value="">— Empty —</option>
                {knownSpells.map((spell) => (
                  <option key={spell.id} value={spell.id}>
                    {spell.name} ({spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`})
                  </option>
                ))}
              </Select>
            </Row>
          );
        })}
      </Rows>
    </Section>
  );
};
