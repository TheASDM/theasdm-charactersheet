import React from 'react';
import styled from 'styled-components';

export interface CompactTableColumn<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  width?: string;
}

export interface CompactTableProps<T> {
  columns: CompactTableColumn<T>[];
  data: T[];
  selectedRow?: (item: T) => boolean;
  className?: string;
}

const TableContainer = styled.div`
  margin-top: 1rem;
  overflow-x: auto;
  border: 1px solid rgba(206, 144, 22, 0.3);
  border-radius: 8px;
  background: rgba(26, 26, 26, 0.6);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background: rgba(206, 144, 22, 0.1);
  border-bottom: 2px solid rgba(206, 144, 22, 0.3);
`;

const TableRow = styled.tr<{ isSelected?: boolean }>`
  transition: all 0.2s ease;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(68, 68, 68, 0.3);
  }

  ${({ isSelected }) =>
    isSelected &&
    `
    background: rgba(206, 144, 22, 0.15);
    box-shadow: inset 0 0 0 2px rgba(206, 144, 22, 0.4);
  `}

  &:hover {
    background: rgba(206, 144, 22, 0.08);
  }
`;

const TableHeader = styled.th<{ width?: string }>`
  padding: 1rem;
  text-align: left;
  color: #ce9016;
  font-weight: 700;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Cinzel', serif;

  ${({ width }) => width && `width: ${width};`}
`;

const TableCell = styled.td`
  padding: 1rem;
  color: #e0d9c6;
  font-size: 0.95rem;
  vertical-align: middle;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
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

const SelectedIndicator = styled.span`
  color: #6aa84f;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '✓';
    font-size: 1.1rem;
  }
`;

export function CompactTable<T>({
  columns,
  data,
  selectedRow,
  className,
}: CompactTableProps<T>) {
  return (
    <TableContainer className={className}>
      <Table>
        <TableHead>
          <tr>
            {columns.map((col) => (
              <TableHeader key={col.key} {...(col.width && { width: col.width })}>
                {col.label}
              </TableHeader>
            ))}
          </tr>
        </TableHead>
        <tbody>
          {data.map((item, rowIndex) => {
            const isSelected = selectedRow?.(item) ?? false;

            return (
              <TableRow key={rowIndex} isSelected={isSelected}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </tbody>
      </Table>
    </TableContainer>
  );
}

// Export styled components for use in custom renders
export { Actions, ActionButton, SelectedIndicator };
