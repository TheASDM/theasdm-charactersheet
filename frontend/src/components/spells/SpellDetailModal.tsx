import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import type { Spell } from '@/types/api';
import { formatLevel, getSchoolLabel } from '@/utils/spellUtils';
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { FocusManager } from '@/utils/focusManagement';

interface SpellDetailModalProps {
  spell: Spell | null;
  onClose: () => void;
}

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 3rem 1rem 2rem;
  overflow-y: auto;

  /* Custom scrollbar for backdrop */
  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(206, 144, 22, 0.6);
    border-radius: 6px;

    &:hover {
      background: rgba(206, 144, 22, 0.8);
    }
  }
`;

const ModalCard = styled.div`
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(40, 40, 40, 0.95));
  border: 1px solid rgba(206, 144, 22, 0.5);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  display: flex;
  flex-direction: column;

`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  flex-shrink: 0;

  h2 {
    margin: 0 0 0.75rem 0;
    color: #e0a523;
    font-size: 1.5rem;
    letter-spacing: 0.5px;
  }

  p {
    line-height: 1.6;
    color: #c0aa70;
    margin: 0;
  }
`;

const ModalBody = styled.div`
  padding: 0 2rem 2rem;
  overflow-y: auto;
  flex: 1;

  p {
    line-height: 1.6;
    color: #e0d9c6;
  }

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(206, 144, 22, 0.5);
    border-radius: 4px;

    &:hover {
      background: rgba(206, 144, 22, 0.7);
    }
  }
`;

const ModalClose = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  border: none;
  background: transparent;
  color: #ce9016;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  z-index: 1;

  &:hover {
    background-color: rgba(206, 144, 22, 0.2);
    transform: scale(1.1);
  }
`;

export const SpellDetailModal = ({ spell, onClose }: SpellDetailModalProps) => {
  // Lock body scroll when modal is open
  useBodyScrollLock(!!spell);

  const dialogRef = useFocusTrap<HTMLDivElement>(!!spell);
  const focusManagerRef = useRef(new FocusManager());

  useEffect(() => {
    const focusManager = focusManagerRef.current;
    if (spell) {
      focusManager.save();
    } else {
      focusManager.restore();
    }

    return () => {
      if (!spell) {
        focusManager.clear();
      }
    };
  }, [spell]);

  useEffect(() => {
    if (!spell) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [spell, onClose]);

  if (!spell) return null;

  return (
    <ModalBackdrop role="dialog" aria-modal="true" onClick={onClose}>
      <ModalCard ref={dialogRef} onClick={(e) => e.stopPropagation()}>
        <ModalClose aria-label="Close" onClick={onClose}>
          ×
        </ModalClose>
        <ModalHeader>
          <h2>{spell.name}</h2>
          <p>
            {formatLevel(spell.level)} &bull; {getSchoolLabel(spell.school)}
            {spell.isRitual ? ' • Ritual' : ''}
            {spell.miscTags?.includes('Concentration') ? ' • Concentration' : ''}
          </p>
        </ModalHeader>
        <ModalBody>
          {Array.isArray(spell.entries) && spell.entries.length > 0 ? (
            <div dangerouslySetInnerHTML={{ __html: parseComplexDnDEntry(spell.entries) }} />
          ) : (
            <p>No additional description available.</p>
          )}
        </ModalBody>
      </ModalCard>
    </ModalBackdrop>
  );
};
