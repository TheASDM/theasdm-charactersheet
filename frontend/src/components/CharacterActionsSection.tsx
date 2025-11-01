import { useState } from 'react';
import styled from 'styled-components';
import { CharacterSheetData, CharacterAction } from '../types/characterSheet';
import { deriveActionDisplay } from '../utils/combatActions';
import {
  ActionsSection,
  ActionsTitle,
  ActionsTable,
  ActionsTableHeader,
  ActionsTableCell,
  AddActionButton,
  RemoveActionButton,
} from '../styles/components';

const ClickableSpellName = styled.span`
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #ce9016;
    text-decoration: underline;
  }
`;

type ActionVariant = 'spell' | 'weapon' | 'default' | 'custom' | 'feature';

const TYPE_CONFIG: Record<CharacterAction['type'], { label: string; icon: string; variant: ActionVariant }> = {
  spell: { label: 'Spell', icon: '✨', variant: 'spell' },
  weapon: { label: 'Weapon', icon: '⚔️', variant: 'weapon' },
  default: { label: 'Combat', icon: '🎯', variant: 'default' },
  custom: { label: 'Custom', icon: '🛠️', variant: 'custom' },
  feature: { label: 'Feature', icon: '🌟', variant: 'feature' },
};

const BADGE_PALETTE: Record<ActionVariant, { background: string; border: string; color: string }> = {
  spell: {
    background: 'rgba(108, 198, 255, 0.18)',
    border: 'rgba(108, 198, 255, 0.5)',
    color: '#7bdcff',
  },
  weapon: {
    background: 'rgba(206, 144, 22, 0.18)',
    border: 'rgba(206, 144, 22, 0.5)',
    color: '#f4d27a',
  },
  default: {
    background: 'rgba(139, 105, 20, 0.15)',
    border: 'rgba(139, 105, 20, 0.45)',
    color: '#e6c27a',
  },
  custom: {
    background: 'rgba(168, 108, 255, 0.18)',
    border: 'rgba(168, 108, 255, 0.45)',
    color: '#cbb5ff',
  },
  feature: {
    background: 'rgba(123, 237, 159, 0.18)',
    border: 'rgba(123, 237, 159, 0.45)',
    color: '#9ef2b7',
  },
};

const TypeBadge = styled.span<{ $variant: ActionVariant }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: ${({ $variant }) => BADGE_PALETTE[$variant].background};
  border: 1px solid ${({ $variant }) => BADGE_PALETTE[$variant].border};
  color: ${({ $variant }) => BADGE_PALETTE[$variant].color};
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
`;

const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const DragHandle = styled.div`
  position: absolute;
  left: 0.25rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
  padding: 0.25rem;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
  user-select: none;
  transition: color 0.2s ease, opacity 0.2s ease;
  opacity: 0;
  z-index: 10;
  pointer-events: auto;

  &:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  &:active {
    cursor: grabbing;
  }
`;

interface CharacterActionsSectionProps {
  character: CharacterSheetData;
  editingSections: { actions: boolean };
  toggleSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  cancelSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  actions: {
    handleActionUpdate: (index: number, field: 'name' | 'atkBonus' | 'damage', value: string) => void;
    handleRemoveAction: (index: number) => void;
    handleReorderActions?: (fromIndex: number, toIndex: number) => void;
    handleManageActions: () => void;
  };
  onSpellClick?: (spellName: string) => void;
  onWeaponClick?: (weaponName: string) => void;
}

export default function CharacterActionsSection({
  character,
  editingSections,
  actions,
  onSpellClick,
  onWeaponClick,
}: CharacterActionsSectionProps) {
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Filter out empty actions in view mode
  const allActions = character.actions || [];
  const filledActions = editingSections.actions
    ? allActions
    : allActions.filter(action => action?.name && action.name.trim().length > 0);

  // In edit mode, show all actions + 1 empty row for adding new actions
  // In view mode, only show filled actions
  const actionsToRender = editingSections.actions
    ? [...filledActions, { name: '', type: 'default' as const }] // Add one empty row in edit mode
    : filledActions;

  const isSpellAction = (action?: CharacterAction) => action?.type === 'spell';
  const isWeaponAction = (action?: CharacterAction) => action?.type === 'weapon';

  const handleActionNameClick = (action: CharacterAction) => {
    if (editingSections.actions) return;

    if (isSpellAction(action) && onSpellClick) {
      onSpellClick(action.name);
    } else if (isWeaponAction(action) && onWeaponClick) {
      onWeaponClick(action.name);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== toIndex && actions.handleReorderActions) {
      actions.handleReorderActions(draggedIndex, toIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <ActionsSection style={{ flex: '2', marginTop: '0' }}>
      <ActionsTitle>Actions & Combat Options</ActionsTitle>
      <ActionsTable>
        {/* Table Headers */}
        <ActionsTableHeader $column={1}>
          <div className="header-cell">Name</div>
          <div className="header-cell">Atk Bonus / DC</div>
          <div className="header-cell">Damage & Type</div>
        </ActionsTableHeader>

        {/* Dynamic Action Rows */}
        {actionsToRender.map((action, index) => {
          const hasAction = Boolean(action?.name && action.name.trim().length > 0);
          const display = action ? deriveActionDisplay(action, character) : null;
          const attackOverride = action?.displayOverrides?.attack ?? action?.legacy?.atkBonus ?? '';
          const damageOverride = action?.displayOverrides?.damage ?? action?.legacy?.damage ?? '';
          const attackLabel = display?.attack ?? (hasAction ? attackOverride || '—' : '');
          const secondaryLabel = display?.secondary;
          const damageLabel = display?.damage ?? (hasAction ? damageOverride || '—' : '');
          const notesLabel = display?.notes;

          const typeConfig = action ? TYPE_CONFIG[action.type] : undefined;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          const canDrag = hasAction && !editingSections.actions; // Only allow dragging in view mode for filled actions

          return (
            <ActionsTableCell
              key={index}
              $column={1}
              $editable={editingSections.actions}
              draggable={canDrag}
              onDragStart={canDrag ? handleDragStart(index) : undefined}
              onDragOver={canDrag ? handleDragOver(index) : undefined}
              onDragLeave={canDrag ? handleDragLeave : undefined}
              onDrop={canDrag ? handleDrop(index) : undefined}
              onDragEnd={canDrag ? handleDragEnd : undefined}
              style={{
                opacity: isDragging ? 0.5 : 1,
                borderTop: isDragOver && draggedIndex !== index ? '2px solid #ce9016' : undefined,
                position: 'relative',
              }}
              className={canDrag ? 'draggable-row' : ''}
            >
              {canDrag && (
                <DragHandle>⋮⋮</DragHandle>
              )}
              <div className="cell-name">
                <div className="name-line">
                  {hasAction && typeConfig && !editingSections.actions && (
                    <TypeBadge $variant={typeConfig.variant}>
                      <span>{typeConfig.icon}</span>
                      {typeConfig.label}
                    </TypeBadge>
                  )}

                  {editingSections.actions ? (
                    <input
                      type="text"
                      value={action?.name ?? ''}
                      onChange={(e) => actions.handleActionUpdate(index, 'name', e.target.value)}
                      placeholder="Action name"
                    />
                  ) : hasAction ? (
                    isSpellAction(action) || isWeaponAction(action) ? (
                      <ClickableSpellName onClick={() => handleActionNameClick(action)}>
                        {action.name}
                      </ClickableSpellName>
                    ) : (
                      <span>{action?.name ?? ''}</span>
                    )
                  ) : (
                    ''
                  )}

                  {editingSections.actions && hasAction && (
                    <RemoveActionButton
                      onClick={() => actions.handleRemoveAction(index)}
                      title="Remove action"
                      style={{ marginLeft: 'auto' }}
                    >
                      ×
                    </RemoveActionButton>
                  )}
                </div>

                {!editingSections.actions && notesLabel && (
                  <div className="notes">{notesLabel}</div>
                )}

                {!editingSections.actions && action?.tags && action.tags.length > 0 && (
                  <div className="tag-row">
                    {action.tags.map((tag) => (
                      <TagChip key={`${action.name}-${tag}`}>{tag}</TagChip>
                    ))}
                  </div>
                )}
              </div>

              <div className="cell-metric">
                {editingSections.actions ? (
                  <input
                    type="text"
                    value={hasAction ? attackOverride : action?.displayOverrides?.attack ?? ''}
                    onChange={(e) => actions.handleActionUpdate(index, 'atkBonus', e.target.value)}
                    placeholder="—"
                  />
                ) : (
                  <>
                    <span className="metric-primary">{attackLabel || '—'}</span>
                    {secondaryLabel && <span className="metric-secondary">{secondaryLabel}</span>}
                  </>
                )}
              </div>

              <div className="cell-metric">
                {editingSections.actions ? (
                  <input
                    type="text"
                    value={hasAction ? damageOverride : action?.displayOverrides?.damage ?? ''}
                    onChange={(e) => actions.handleActionUpdate(index, 'damage', e.target.value)}
                    placeholder="—"
                  />
                ) : (
                  <span className="metric-primary">{damageLabel || '—'}</span>
                )}
              </div>
            </ActionsTableCell>
          );
        })}
      </ActionsTable>

      {editingSections.actions && (
        <AddActionButton onClick={actions.handleManageActions}>
          ⚔️ Manage Actions
        </AddActionButton>
      )}
    </ActionsSection>
  );
}
