/**
 * Auto-scroll utility for smooth scrolling to bottom nav
 * Preserves focus unless explicitly requested to steal it
 */

type ScrollBehaviorType = 'auto' | 'smooth' | 'instant';

export interface AutoScrollOptions {
  behavior?: ScrollBehaviorType; // 'smooth' | 'auto'
  offset?: number; // pixels above target
  onComplete?: () => void;
  shouldStealFocus?: boolean; // default: false
}

/**
 * Smoothly scroll to the persistent bottom navigation
 * Does NOT steal focus by default (accessibility-friendly)
 */
export function scrollToBottomNav(options: AutoScrollOptions = {}): void {
  const {
    behavior = 'smooth',
    offset = 20,
    onComplete,
    shouldStealFocus = false,
  } = options;

  const bottomNav = document.getElementById('persistent-bottom-nav');
  if (!bottomNav) {
    console.warn('Could not find #persistent-bottom-nav element for auto-scroll');
    return;
  }

  // Store current focus
  const activeElement = document.activeElement as HTMLElement;

  // Calculate target position
  const rect = bottomNav.getBoundingClientRect();
  const targetY = rect.top + window.scrollY - offset;

  // Scroll to target
  window.scrollTo({
    top: targetY,
    behavior,
  });

  // Handle completion callback
  if (onComplete || !shouldStealFocus) {
    const duration = behavior === 'smooth' ? 500 : 0;
    setTimeout(() => {
      // Restore focus if we're not stealing it
      if (!shouldStealFocus && activeElement) {
        activeElement.focus();
      }

      // Call completion callback
      onComplete?.();
    }, duration);
  }
}

/**
 * Scroll to top of page (for step transitions)
 */
export function scrollToTop(options: Omit<AutoScrollOptions, 'offset'> = {}): void {
  const { behavior = 'smooth', onComplete, shouldStealFocus = false } = options;

  const activeElement = document.activeElement as HTMLElement;

  window.scrollTo({
    top: 0,
    behavior,
  });

  if (onComplete || !shouldStealFocus) {
    const duration = behavior === 'smooth' ? 500 : 0;
    setTimeout(() => {
      if (!shouldStealFocus && activeElement) {
        activeElement.focus();
      }
      onComplete?.();
    }, duration);
  }
}
