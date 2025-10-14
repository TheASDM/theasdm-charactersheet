import { CharacterSheetData } from '../types/characterSheet';
import {
  ActionsSection,
  ActionsTitle,
  ActionsTable,
  ActionsTableHeader,
  ActionsTableCell,
  AddActionButton,
  RemoveActionButton,
} from '../styles/components';

interface CharacterActionsSectionProps {
  character: CharacterSheetData;
  editingSections: { actions: boolean };
  toggleSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  cancelSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  actions: {
    handleActionUpdate: (index: number, field: 'name' | 'atkBonus' | 'damage', value: string) => void;
    handleRemoveAction: (index: number) => void;
    handleManageActions: () => void;
  };
}

export default function CharacterActionsSection({
  character,
  editingSections,
  actions,
}: CharacterActionsSectionProps) {
  // Calculate how many rows to show
  const actionCount = character.actions?.length || 0;
  // In edit mode, show all actions + 1 empty row for adding new actions
  // In view mode, only show rows that have content
  const rowsToShow = editingSections.actions
    ? Math.max(actionCount + 1, 1) // At least 1 row in edit mode
    : actionCount; // Only show filled rows in view mode

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
        {Array.from({ length: rowsToShow }, (_, index) => {
          const action = character.actions[index];
          const hasAction = action && action.name && action.name.trim();

          return (
            <ActionsTableCell key={index} $column={1}>
              <div className="action-name">
                {hasAction ? (
                  editingSections.actions ? (
                    <input
                      type="text"
                      value={action.name}
                      onChange={(e) =>
                        actions.handleActionUpdate(
                          index,
                          'name',
                          e.target.value
                        )
                      }
                      placeholder="Action name"
                    />
                  ) : (
                    action.name
                  )
                ) : (
                  editingSections.actions ? (
                    <input
                      type="text"
                      value={action?.name || ''}
                      onChange={(e) =>
                        actions.handleActionUpdate(
                          index,
                          'name',
                          e.target.value
                        )
                      }
                      placeholder="Action name"
                    />
                  ) : (
                    ''
                  )
                )}
                {editingSections.actions && hasAction && (
                  <RemoveActionButton
                    onClick={() => actions.handleRemoveAction(index)}
                    title="Remove action"
                    style={{ marginLeft: '0.3rem', fontSize: '0.6rem', padding: '0.1rem 0.2rem' }}
                  >
                    ×
                  </RemoveActionButton>
                )}
              </div>
              <div className="action-bonus">
                {hasAction ? (
                  editingSections.actions ? (
                    <input
                      type="text"
                      value={action.atkBonus}
                      onChange={(e) =>
                        actions.handleActionUpdate(
                          index,
                          'atkBonus',
                          e.target.value
                        )
                      }
                      placeholder="—"
                    />
                  ) : (
                    action.atkBonus || '—'
                  )
                ) : (
                  editingSections.actions ? (
                    <input
                      type="text"
                      value={action?.atkBonus || ''}
                      onChange={(e) =>
                        actions.handleActionUpdate(
                          index,
                          'atkBonus',
                          e.target.value
                        )
                      }
                      placeholder="—"
                    />
                  ) : (
                    ''
                  )
                )}
              </div>
              <div className="action-damage">
                {hasAction ? (
                  editingSections.actions ? (
                    <input
                      type="text"
                      value={action.damage}
                      onChange={(e) =>
                        actions.handleActionUpdate(
                          index,
                          'damage',
                          e.target.value
                        )
                      }
                      placeholder="—"
                    />
                  ) : (
                    action.damage || '—'
                  )
                ) : (
                  editingSections.actions ? (
                    <input
                      type="text"
                      value={action?.damage || ''}
                      onChange={(e) =>
                        actions.handleActionUpdate(
                          index,
                          'damage',
                          e.target.value
                        )
                      }
                      placeholder="—"
                    />
                  ) : (
                    ''
                  )
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