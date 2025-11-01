import { useEffect, useRef, useState } from 'react';
import { Portal } from './Portal';
import {
  OverviewInventoryMenuPortal,
  OverviewInventoryMenuItem,
} from '../styles/components/OverviewInventory.styles';

interface InventoryItemMenuProps {
  isOpen: boolean;
  buttonId: string;
  onClose: () => void;
  onDetails: () => void;
  onUnequip: () => void;
  onSeeInventory: () => void;
}

export const InventoryItemMenu = ({
  isOpen,
  buttonId,
  onClose,
  onDetails,
  onUnequip,
  onSeeInventory,
}: InventoryItemMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position based on button
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const buttonElement = document.getElementById(buttonId);
      if (!buttonElement) return;

      const buttonRect = buttonElement.getBoundingClientRect();
      const menuWidth = 140; // min-width from styles

      // Use fixed positioning, so we use viewport coordinates directly
      setPosition({
        top: buttonRect.bottom + 4,
        left: buttonRect.right - menuWidth,
      });
    };

    updatePosition();

    // Update position on scroll or resize
    window.addEventListener('scroll', updatePosition, true); // useCapture for all scroll events
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, buttonId]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const buttonElement = document.getElementById(buttonId);

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonElement &&
        !buttonElement.contains(target)
      ) {
        onClose();
      }
    };

    // Use timeout to avoid immediate close from the same click that opened menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonId]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <OverviewInventoryMenuPortal
        ref={menuRef}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <OverviewInventoryMenuItem type="button" onClick={onDetails}>
          Details
        </OverviewInventoryMenuItem>
        <OverviewInventoryMenuItem
          type="button"
          $variant="danger"
          onClick={onUnequip}
        >
          Unequip
        </OverviewInventoryMenuItem>
        <OverviewInventoryMenuItem type="button" onClick={onSeeInventory}>
          See Inventory
        </OverviewInventoryMenuItem>
      </OverviewInventoryMenuPortal>
    </Portal>
  );
};
