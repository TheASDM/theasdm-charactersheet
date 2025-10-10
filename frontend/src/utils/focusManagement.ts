/**
 * Focus management utilities for accessibility
 */

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not(:disabled)',
    '[href]',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Create a focus trap within a container
 * Returns a cleanup function
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    console.warn('No focusable elements found in container for focus trap');
    return () => {};
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift+Tab: if on first element, wrap to last
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab: if on last element, wrap to first
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  // Focus the first element
  firstElement?.focus();

  // Add event listener
  document.addEventListener('keydown', handleTab);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleTab);
  };
}

/**
 * Store and restore focus for modal interactions
 */
export class FocusManager {
  private previousActiveElement: HTMLElement | null = null;

  /**
   * Save the currently focused element
   */
  save(): void {
    this.previousActiveElement = document.activeElement as HTMLElement;
  }

  /**
   * Restore focus to the previously focused element
   */
  restore(delay = 100): void {
    if (this.previousActiveElement) {
      setTimeout(() => {
        this.previousActiveElement?.focus();
        this.previousActiveElement = null;
      }, delay);
    }
  }

  /**
   * Clear the saved focus
   */
  clear(): void {
    this.previousActiveElement = null;
  }
}
