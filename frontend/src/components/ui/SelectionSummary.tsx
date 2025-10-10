import React from 'react';
import styled from 'styled-components';

interface SelectionItem {
  label: string;
  value: string | string[];
  description?: string;
}

interface SelectionSummaryProps {
  title: string;
  items: SelectionItem[];
  className?: string;
}

const SummaryContainer = styled.div`
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid rgba(206, 144, 22, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const SummaryTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #ce9016;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  text-align: center;
  border-bottom: 1px solid rgba(206, 144, 22, 0.2);
  padding-bottom: 0.5rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
`;

const SummaryLabel = styled.span`
  color: #aaa;
  font-weight: 500;
  min-width: 120px;
`;

const SummaryValue = styled.div`
  color: #f0f0f0;
  font-weight: 600;
  text-align: right;
  flex: 1;

  &.array-value {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const SummaryValueItem = styled.span`
  color: #ce9016;
  font-size: 0.95rem;
`;

const SummaryDescription = styled.div`
  color: #888;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  font-style: italic;
`;

export const SelectionSummary: React.FC<SelectionSummaryProps> = ({
  title,
  items,
  className
}) => {
  const formatValue = (value: string | string[]) => {
    if (Array.isArray(value)) {
      return value.map((item, index) => (
        <SummaryValueItem key={index}>{item}</SummaryValueItem>
      ));
    }
    return <SummaryValueItem>{value}</SummaryValueItem>;
  };

  return (
    <SummaryContainer className={className}>
      <SummaryTitle>{title}</SummaryTitle>
      <SummaryGrid>
        {items.map((item, index) => (
          <SummaryItem key={index}>
            <SummaryLabel>{item.label}:</SummaryLabel>
            <SummaryValue className={Array.isArray(item.value) ? 'array-value' : ''}>
              {formatValue(item.value)}
              {item.description && (
                <SummaryDescription>{item.description}</SummaryDescription>
              )}
            </SummaryValue>
          </SummaryItem>
        ))}
      </SummaryGrid>
    </SummaryContainer>
  );
};