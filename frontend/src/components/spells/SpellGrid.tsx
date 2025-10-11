/**
 * Unified spell grid component
 * Displays a grid of spell cards with selection state
 */

import styled from 'styled-components';
import type { Spell } from '@/types/api';
import { SpellCard } from './SpellCard';
import { normaliseSpellId } from '@/utils/spellUtils';
import LoadingSpinner from '@/components/LoadingSpinner';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #c0aa70;
  font-size: 1rem;
`;

export interface SpellGridProps {
  /** Array of spells to display */
  spells: Spell[];

  /** IDs of currently selected spells */
  selectedSpells: string[];

  /** IDs of granted spells (e.g., from species/feats) */
  grantedSpells?: string[];

  /** Maximum number of spells that can be selected */
  maxSelections?: number;

  /** Callback when a spell is toggled */
  onToggle: (spell: Spell) => void;

  /** Callback when "View Details" is clicked */
  onViewDetails: (spell: Spell) => void;

  /** Show ritual badge on ritual spells */
  showRitualBadge?: boolean;

  /** Message to show when no spells are found */
  emptyMessage?: string;

  /** Show loading spinner */
  loading?: boolean;
}

/**
 * Renders a grid of spell cards with selection controls
 *
 * @example
 * ```typescript
 * <SpellGrid
 *   spells={filteredSpells}
 *   selectedSpells={cantrips}
 *   maxSelections={3}
 *   onToggle={handleToggleCantrip}
 *   onViewDetails={setSelectedSpell}
 * />
 * ```
 */
export const SpellGrid = ({
  spells,
  selectedSpells,
  grantedSpells = [],
  maxSelections,
  onToggle,
  onViewDetails,
  showRitualBadge = false,
  emptyMessage = 'No spells found.',
  loading = false,
}: SpellGridProps) => {
  if (loading) {
    return <LoadingSpinner message="Loading spells..." />;
  }

  if (spells.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <Grid>
      {spells.map((spell) => {
        const spellId = normaliseSpellId(spell.id);
        const isSelected = selectedSpells.includes(spellId);
        const isGranted = grantedSpells.includes(spellId);

        // Can select if:
        // 1. No max limit, OR
        // 2. Already selected (can deselect), OR
        // 3. Haven't reached max selections yet
        const canSelect =
          maxSelections === undefined ||
          isSelected ||
          selectedSpells.length < maxSelections;

        return (
          <SpellCard
            key={spell.id}
            spell={spell}
            isSelected={isSelected}
            isGranted={isGranted}
            canSelect={canSelect}
            onToggle={onToggle}
            onViewDetails={onViewDetails}
            showRitualBadge={showRitualBadge}
          />
        );
      })}
    </Grid>
  );
};
