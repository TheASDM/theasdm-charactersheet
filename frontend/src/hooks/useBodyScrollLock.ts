import { useEffect } from 'react';

/**
 * Custom hook to lock/unlock body scroll when a modal is open
 * Preserves scroll position and prevents content jump
 * @param isLocked - Whether the scroll should be locked
 */
export const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    // Get current scroll position
    const scrollY = window.scrollY;

    // Store original values
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll by fixing body position at current scroll offset
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Add padding to compensate for scrollbar removal (prevents content shift)
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup: restore original values and scroll position
    return () => {
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = '';

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
};
