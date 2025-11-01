import React from 'react';
import styled from 'styled-components';

export interface CompactListProps<T> {
  items: T[];
  isSelected?: (item: T) => boolean;
  onDetails: (item: T) => void;
  onSelect: (item: T) => void;
  onUnselect?: (item: T) => void; // Optional unselect handler for toggle behavior
  renderName: (item: T) => React.ReactNode;
  renderSummary?: (item: T) => React.ReactNode;
  renderPreview?: (item: T) => React.ReactNode; // Enhanced preview with key stats/mechanics
  detailsLabel?: string;
  selectLabel?: string;
  unselectLabel?: string;
  className?: string;
}

const ListContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-top: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ListItem = styled.div<{ $isSelected: boolean }>`
  background: rgba(26, 26, 26, 0.6);
  border: 2px solid ${({ $isSelected }) => ($isSelected ? '#ce9016' : 'rgba(68, 68, 68, 0.6)')};
  border-radius: 6px;
  padding: 0.75rem;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  ${({ $isSelected }) =>
    $isSelected &&
    `
    background: rgba(206, 144, 22, 0.1);
    box-shadow: 0 2px 8px rgba(206, 144, 22, 0.3);
  `}

  &:hover {
    border-color: #ce9016;
    transform: translateY(-1px);
  }
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  color: #ce9016;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
  font-family: 'Cinzel', serif;
`;

const ItemSummary = styled.div`
  color: #c0aa70;
  font-size: 0.8rem;
  line-height: 1.3;
`;

const ItemPreview = styled.div`
  color: #a69468;
  font-size: 0.75rem;
  line-height: 1.4;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(206, 144, 22, 0.2);

  strong {
    color: #ce9016;
    font-weight: 600;
  }
`;

const SelectedIndicator = styled.div`
  color: #6aa84f;
  font-weight: 600;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.25rem;

  &::before {
    content: '✓';
    font-size: 1rem;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  white-space: nowrap;

  ${({ variant }) => {
    if (variant === 'primary') {
      return `
        background: linear-gradient(145deg, #ce9016, #b8860b);
        color: #1a1a1a;
        box-shadow: 0 2px 6px rgba(206, 144, 22, 0.3);

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(206, 144, 22, 0.4);
        }
      `;
    }

    // secondary
    return `
      background: rgba(60, 60, 60, 0.8);
      color: #f0f0f0;
      border: 1px solid rgba(206, 144, 22, 0.3);

      &:hover {
        background: rgba(80, 80, 80, 0.8);
        border-color: rgba(206, 144, 22, 0.5);
      }
    `;
  }}

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid #ce9016;
    outline-offset: 2px;
  }
`;

export function CompactList<T>({
  items,
  isSelected,
  onDetails,
  onSelect,
  onUnselect,
  renderName,
  renderSummary,
  renderPreview,
  detailsLabel = 'Details',
  selectLabel = 'Select',
  unselectLabel = 'Unselect',
  className,
}: CompactListProps<T>) {
  return (
    <ListContainer className={className}>
      {items.map((item, index) => {
        const selected = isSelected?.(item) ?? false;

        // Determine action handler - toggle if onUnselect is provided
        const handleSelectClick = () => {
          if (selected && onUnselect) {
            onUnselect(item);
          } else {
            onSelect(item);
          }
        };

        // Determine button label
        const actionLabel = selected && onUnselect ? unselectLabel : selectLabel;
        const actionAriaLabel = selected && onUnselect
          ? `Unselect ${renderName(item)}`
          : `Select ${renderName(item)}`;

        return (
          <ListItem key={index} $isSelected={selected}>
            <ItemInfo>
              <ItemName>{renderName(item)}</ItemName>
              {renderSummary && (
                <ItemSummary>{renderSummary(item)}</ItemSummary>
              )}
              {renderPreview && (
                <ItemPreview>{renderPreview(item)}</ItemPreview>
              )}
              {selected && <SelectedIndicator>Selected</SelectedIndicator>}
            </ItemInfo>

            <Actions>
              <ActionButton
                variant="secondary"
                onClick={() => onDetails(item)}
                aria-label={`View details for ${renderName(item)}`}
              >
                {detailsLabel}
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={handleSelectClick}
                aria-label={actionAriaLabel}
              >
                {actionLabel}
              </ActionButton>
            </Actions>
          </ListItem>
        );
      })}
    </ListContainer>
  );
}
