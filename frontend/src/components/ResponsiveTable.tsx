import React from 'react';
import styled from 'styled-components';

interface TableColumn {
  key: string;
  header: string;
  mobile?: boolean; // Show on mobile in card view
  desktop?: boolean; // Show on desktop in table view
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: TableColumn[];
  data: any[];
  keyField: string;
}

const TableContainer = styled.div`
  background: rgba(255, 248, 240, 0.95);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.3);
  border: 2px solid rgba(139, 115, 85, 0.4);

  @media (max-width: 768px) {
    box-shadow: 0 2px 8px rgba(139, 115, 85, 0.2);
    border-radius: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    /* Add scrollbar styling */
    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(139, 115, 85, 0.1);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(139, 115, 85, 0.4);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: rgba(139, 115, 85, 0.6);
    }
  }
`;

const DesktopTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px; /* Ensure minimum width for content */

  @media (max-width: 480px) {
    display: none; /* Hide table on mobile for card view */
  }
`;

const TableHeader = styled.thead`
  background: linear-gradient(135deg, #d4af7a 0%, #b8956a 50%, #8b7355 100%);
  color: #6d4423;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #6d4423, transparent);
  }
`;

const TableHeaderCell = styled.th`
  padding: 1.2rem 1rem;
  text-align: left;
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6d4423;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  font-family: 'Georgia', serif;
  background: rgba(255, 248, 240, 0.1);
  border-right: 1px solid rgba(109, 68, 35, 0.2);

  &:last-child {
    border-right: none;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(139, 115, 85, 0.2);
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(212, 175, 122, 0.1);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  vertical-align: top;
  color: #6d4423;
  font-family: 'Georgia', serif;
  background: rgba(255, 248, 240, 0.3);
  border-right: 1px solid rgba(139, 115, 85, 0.1);

  &:last-child {
    border-right: none;
  }
`;

// Mobile Card Layout
const MobileCardContainer = styled.div`
  display: none;

  @media (max-width: 480px) {
    display: block;
    padding: 0.5rem;
  }
`;

const MobileCard = styled.div`
  background: rgba(255, 248, 240, 0.95);
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(139, 115, 85, 0.2);
  overflow: hidden;
  border: 2px solid rgba(139, 115, 85, 0.3);

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 480px) {
    margin-bottom: 0.75rem;
  }
`;

const MobileCardHeader = styled.div`
  background: linear-gradient(135deg, #d4af7a 0%, #b8956a 50%, #8b7355 100%);
  color: #6d4423;
  padding: 0.9rem;
  font-weight: 700;
  font-size: 1.1rem;
  font-family: 'Georgia', serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(109, 68, 35, 0.3);
`;

const MobileCardContent = styled.div`
  padding: 1rem;
  background: rgba(255, 248, 240, 0.5);
`;

const MobileCardField = styled.div`
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const MobileFieldLabel = styled.span`
  font-weight: 700;
  color: #8b7355;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  display: block;
  margin-bottom: 0.4rem;
  font-family: 'Georgia', serif;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
`;

const MobileFieldValue = styled.div`
  color: #6d4423;
  line-height: 1.5;
  font-family: 'Georgia', serif;
  background: rgba(212, 175, 122, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(139, 115, 85, 0.2);
`;

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  keyField,
}) => {
  const desktopColumns = columns.filter((col) => col.desktop !== false);
  const mobileColumns = columns.filter((col) => col.mobile !== false);

  const renderCellContent = (column: TableColumn, row: any) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    return row[column.key];
  };

  return (
    <TableContainer>
      {/* Desktop Table View */}
      <DesktopTable>
        <TableHeader>
          <TableRow>
            {desktopColumns.map((column) => (
              <TableHeaderCell key={column.key}>
                {column.header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row[keyField]}>
              {desktopColumns.map((column) => (
                <TableCell key={column.key}>
                  {renderCellContent(column, row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </DesktopTable>

      {/* Mobile Card View */}
      <MobileCardContainer>
        {data.map((row) => {
          const primaryColumn = mobileColumns[0];
          const otherColumns = mobileColumns.slice(1);

          return (
            <MobileCard key={row[keyField]}>
              <MobileCardHeader>
                {renderCellContent(primaryColumn, row)}
              </MobileCardHeader>
              <MobileCardContent>
                {otherColumns.map((column) => (
                  <MobileCardField key={column.key}>
                    <MobileFieldLabel>{column.header}</MobileFieldLabel>
                    <MobileFieldValue>
                      {renderCellContent(column, row)}
                    </MobileFieldValue>
                  </MobileCardField>
                ))}
              </MobileCardContent>
            </MobileCard>
          );
        })}
      </MobileCardContainer>
    </TableContainer>
  );
};

export default ResponsiveTable;
