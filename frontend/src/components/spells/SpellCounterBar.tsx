import styled from 'styled-components';

interface SpellCounterBarProps {
  counters: Array<{
    label: string;
    current: number;
    max: number | null;
    invalid?: boolean;
  }>;
}

const CounterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin: 0 0 1.5rem;
`;

const CounterPill = styled.div<{ $invalid?: boolean }>`
  background: ${({ $invalid }) =>
    $invalid ? 'rgba(182, 55, 55, 0.2)' : 'rgba(26, 26, 26, 0.75)'};
  border: 1px solid
    ${({ $invalid }) => ($invalid ? 'rgba(255, 92, 92, 0.6)' : 'rgba(212, 175, 55, 0.4)')};
  border-radius: 999px;
  padding: 0.5rem 1rem;
  color: ${({ $invalid }) => ($invalid ? '#ff8a8a' : '#d4af37')};
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.4px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

export const SpellCounterBar: React.FC<SpellCounterBarProps> = ({ counters }) => {
  return (
    <CounterBar>
      {counters.map((counter, index) => (
        <CounterPill key={index} $invalid={counter.invalid ?? false}>
          {counter.label}: {counter.current}
          {counter.max !== null && ` / ${counter.max}`}
        </CounterPill>
      ))}
    </CounterBar>
  );
};
