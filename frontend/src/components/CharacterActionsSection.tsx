import { Fragment } from 'react';
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
  return (
    <ActionsSection style={{ flex: '2', marginTop: '0' }}>
      <ActionsTitle>Actions & Combat Options</ActionsTitle>
      <ActionsTable>
        {/* Table Headers */}
        <ActionsTableHeader column={1}>Name</ActionsTableHeader>
        <ActionsTableHeader column={2}>
          Atk Bonus / DC
        </ActionsTableHeader>
        <ActionsTableHeader column={3}>
          Damage & Type
        </ActionsTableHeader>

        {/* Table Rows */}
        {character.actions.map((action, index) => (
          <Fragment key={index}>
            <ActionsTableCell column={1}>
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
                action.name
              )}
              {editingSections.actions && (
                <RemoveActionButton
                  onClick={() => actions.handleRemoveAction(index)}
                  title="Remove action"
                >
                  ×
                </RemoveActionButton>
              )}
            </ActionsTableCell>
            <ActionsTableCell column={2}>
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
                action.atkBonus
              )}
            </ActionsTableCell>
            <ActionsTableCell column={3}>
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
                action.damage
              )}
            </ActionsTableCell>
          </Fragment>
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