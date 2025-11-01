import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
}

/**
 * Renders children into a DOM node outside the parent component hierarchy.
 * Used for tooltips, modals, and dropdowns that need to escape overflow clipping.
 */
export const Portal = ({ children }: PortalProps) => {
  return createPortal(children, document.body);
};
