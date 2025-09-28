import { CharacterSheetData } from '../types/characterSheet';
import {
  ActionsSection,
  ActionsTitle,
  ActionsTable,
  ActionsTableHeader,
  ActionsTableCell,
  AddActionButton,
  RemoveActionButton,
  SectionEditControls,
  SectionEditButton,
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
  toggleSectionEdit,
  cancelSectionEdit,
  actions,
}: CharacterActionsSectionProps) {
  console.log('🎭 CharacterActionsSection received actions:', character.actions);
  console.log('🎭 Actions content:', character.actions.map((action, i) => `${i}: ${action.name} | ${action.atkBonus} | ${action.damage}`));

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

        {/* Table Rows */}
        {character.actions.map((action, index) => (
          <ActionsTableCell key={index} $column={1}>
            <div className="action-name">
              {editingSections.actions ? (
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
                action.name || '—'
              )}
              {editingSections.actions && (
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
              {editingSections.actions ? (
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
              )}
            </div>
            <div className="action-damage">
              {editingSections.actions ? (
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
              )}
            </div>
          </ActionsTableCell>
        ))}
      </ActionsTable>

      {editingSections.actions && (
        <AddActionButton onClick={actions.handleManageActions}>
          ⚔️ Manage Actions
        </AddActionButton>
      )}

      <SectionEditControls>
        {editingSections.actions ? (
          <>
            <SectionEditButton
              variant="save"
              onClick={() => toggleSectionEdit('actions')}
            >
              ✓
            </SectionEditButton>
            <SectionEditButton
              onClick={() => cancelSectionEdit('actions')}
              style={{
                background:
                  'linear-gradient(145deg, #dc3545, #c82333)',
              }}
            >
              ✕
            </SectionEditButton>
          </>
        ) : (
          <>
            <SectionEditButton
              onClick={() => toggleSectionEdit('actions')}
            >
              ✎
            </SectionEditButton>
            <SectionEditButton
              onClick={actions.handleManageActions}
              style={{
                background:
                  'linear-gradient(145deg, #28a745, #20892c)',
              }}
            >
              ⚔️
            </SectionEditButton>
          </>
        )}
      </SectionEditControls>
    </ActionsSection>
  );
}