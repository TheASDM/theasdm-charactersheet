import styled from 'styled-components';
import type { Spell } from '@/types/api';
import { formatLevel, getSchoolLabel } from '@/utils/spellUtils';
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';

interface SpellDetailModalProps {
  spell: Spell | null;
  onClose: () => void;
}

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalCard = styled.div`
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(40, 40, 40, 0.95));
  border: 1px solid rgba(212, 175, 55, 0.5);
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;

  h2 {
    margin: 0 0 0.75rem 0;
    color: #f1c661;
    font-size: 1.5rem;
    letter-spacing: 0.5px;
  }

  p {
    line-height: 1.6;
    color: #e0d9c6;
  }
`;

const ModalClose = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  border: none;
  background: transparent;
  color: #d4af37;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(212, 175, 55, 0.2);
    transform: scale(1.1);
  }
`;

export const SpellDetailModal: React.FC<SpellDetailModalProps> = ({ spell, onClose }) => {
  if (!spell) return null;

  return (
    <ModalBackdrop role="dialog" aria-modal="true" onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalClose aria-label="Close" onClick={onClose}>
          ×
        </ModalClose>
        <h2>{spell.name}</h2>
        <p style={{ color: '#c0aa70', marginBottom: '1rem' }}>
          {formatLevel(spell.level)} &bull; {getSchoolLabel(spell.school)}
          {spell.isRitual ? ' • Ritual' : ''}
          {spell.miscTags?.includes('Concentration') ? ' • Concentration' : ''}
        </p>
        {Array.isArray(spell.entries) && spell.entries.length > 0 ? (
          <div dangerouslySetInnerHTML={{ __html: parseComplexDnDEntry(spell.entries) }} />
        ) : (
          <p>No additional description available.</p>
        )}
      </ModalCard>
    </ModalBackdrop>
  );
};
