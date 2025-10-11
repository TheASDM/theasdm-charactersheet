import styled from 'styled-components';
import { SCHOOL_OPTIONS, LEVEL_OPTIONS, LevelFilter, RitualFilter, ConcentrationFilter } from '@/utils/spellConstants';

interface SpellFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  level: LevelFilter;
  onLevelChange: (value: LevelFilter) => void;
  school: string;
  onSchoolChange: (value: string) => void;
  ritual: RitualFilter;
  onRitualChange: (value: RitualFilter) => void;
  concentration: ConcentrationFilter;
  onConcentrationChange: (value: ConcentrationFilter) => void;
  hideLevelFilter?: boolean;
}

const FiltersBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(26, 26, 26, 0.75);
  border: 1px solid rgba(206, 144, 22, 0.3);
  border-radius: 12px;
`;

const FilterGroup = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  color: #ce9016;

  span {
    margin-bottom: 0.35rem;
    font-weight: 600;
    letter-spacing: 0.4px;
  }

  input,
  select {
    background: rgba(16, 16, 16, 0.9);
    border: 1px solid rgba(206, 144, 22, 0.35);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: #f8f4e1;
    font-size: 0.9rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: #e0a523;
      box-shadow: 0 0 0 2px rgba(241, 198, 97, 0.15);
    }
  }
`;

export const SpellFiltersBar = ({
  searchTerm,
  onSearchChange,
  level,
  onLevelChange,
  school,
  onSchoolChange,
  ritual,
  onRitualChange,
  concentration,
  onConcentrationChange,
  hideLevelFilter = false,
}: SpellFiltersBarProps) => {
  return (
    <FiltersBar>
      <FilterGroup>
        <span>Search</span>
        <input
          type="search"
          placeholder="Search by name or text…"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </FilterGroup>
      {!hideLevelFilter && (
        <FilterGroup>
          <span>Level</span>
          <select
            value={String(level)}
            onChange={(event) => {
              const value = event.target.value;
              onLevelChange(value === 'all' ? 'all' : (Number(value) as LevelFilter));
            }}
          >
            {LEVEL_OPTIONS.map(({ label, value }) => (
              <option key={value} value={String(value)}>
                {label}
              </option>
            ))}
          </select>
        </FilterGroup>
      )}
      <FilterGroup>
        <span>School</span>
        <select value={school} onChange={(event) => onSchoolChange(event.target.value)}>
          {SCHOOL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterGroup>
      <FilterGroup>
        <span>Ritual</span>
        <select value={ritual} onChange={(event) => onRitualChange(event.target.value as RitualFilter)}>
          <option value="any">Any</option>
          <option value="ritual">Ritual Only</option>
          <option value="non">Non-Ritual</option>
        </select>
      </FilterGroup>
      <FilterGroup>
        <span>Concentration</span>
        <select
          value={concentration}
          onChange={(event) => onConcentrationChange(event.target.value as ConcentrationFilter)}
        >
          <option value="any">Any</option>
          <option value="conc">Requires Concentration</option>
          <option value="non">No Concentration</option>
        </select>
      </FilterGroup>
    </FiltersBar>
  );
};
