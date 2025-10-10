import React from 'react';
import styled from 'styled-components';

export interface CompactGridProps<T> {
  items: T[];
  isSelected?: (item: T) => boolean;
  onDetails: (item: T) => void;
  onSelect: (item: T) => void;
  renderName: (item: T) => React.ReactNode;
  renderSummary?: (item: T) => React.ReactNode;
  detailsLabel?: string;
  selectLabel?: string;
  columns?: number;
  className?: string;
}

const GridContainer = styled.div<{ columns: number }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;

  @media (min-width: 1024px) {
    grid-template-columns: ${({ columns }) => `repeat(${columns}, 1fr)`};
  }
`;

const GridItem = styled.div<{ isSelected: boolean }>`
  background: rgba(26, 26, 26, 0.6);
  border: 2px solid ${({ isSelected }) => (isSelected ? '#ce9016' : 'rgba(68, 68, 68, 0.6)')};
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;

  ${({ isSelected }) =>
    isSelected &&
    `
    background: rgba(206, 144, 22, 0.1);
    box-shadow: 0 2px 8px rgba(206, 144, 22, 0.3);
  `}

  &:hover {
    border-color: #ce9016;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.3);
  }
`;

const ItemName = styled.div`
  color: #ce9016;
  font-weight: 600;
  font-size: 1.15rem;
  margin-bottom: 0.5rem;
  font-family: 'Cinzel', serif;
  text-align: center;
`;

const ItemSummary = styled.div`
  color: #c0aa70;
  font-size: 0.9rem;
  line-height: 1.4;
  text-align: center;
  flex: 1;
`;

const SelectedIndicator = styled.div`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  color: #6aa84f;
  font-weight: 700;
  font-size: 1.5rem;
  line-height: 1;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
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

export function CompactGrid<T>({
  items,
  isSelected,
  onDetails,
  onSelect,
  renderName,
  renderSummary,
  detailsLabel = 'Details',
  selectLabel = 'Select',
  columns = 3,
  className,
}: CompactGridProps<T>) {
  return (
    <GridContainer columns={columns} className={className}>
      {items.map((item, index) => {
        const selected = isSelected?.(item) ?? false;

        return (
          <GridItem key={index} isSelected={selected}>
            {selected && <SelectedIndicator>✓</SelectedIndicator>}

            <ItemName>{renderName(item)}</ItemName>

            {renderSummary && (
              <ItemSummary>{renderSummary(item)}</ItemSummary>
            )}

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
                onClick={() => onSelect(item)}
                aria-label={`Select ${renderName(item)}`}
              >
                {selectLabel}
              </ActionButton>
            </Actions>
          </GridItem>
        );
      })}
    </GridContainer>
  );
}
