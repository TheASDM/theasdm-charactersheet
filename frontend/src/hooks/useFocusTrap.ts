import { useEffect, useRef } from 'react';
import { createFocusTrap } from '../utils/focusManagement';

/**
 * React hook to create a focus trap within a ref'd element
 * Automatically sets up and cleans up when the component mounts/unmounts
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(isActive: boolean) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !elementRef.current) return;

    const cleanup = createFocusTrap(elementRef.current);

    return cleanup;
  }, [isActive]);

  return elementRef;
}
