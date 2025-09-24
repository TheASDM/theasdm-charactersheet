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
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    box-shadow: none;
    border-radius: 0;
  }
`;

const DesktopTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  @media (max-width: 768px) {
    display: none;
  }
`;

const TableHeader = styled.thead`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #e1e5e9;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  vertical-align: top;
`;

// Mobile Card Layout
const MobileCardContainer = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    padding: 0;
  }
`;

const MobileCard = styled.div`
  background: white;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e1e5e9;

  &:last-child {
    margin-bottom: 0;
  }
`;

const MobileCardHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
`;

const MobileCardContent = styled.div`
  padding: 0.75rem;
`;

const MobileCardField = styled.div`
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const MobileFieldLabel = styled.span`
  font-weight: 600;
  color: #666;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 0.25rem;
`;

const MobileFieldValue = styled.div`
  color: #2c3e50;
  line-height: 1.4;
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
