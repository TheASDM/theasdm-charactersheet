import { useEffect } from 'react';

/**
 * Custom hook to scroll to top and allow independent scrolling when modal opens
 * @param isOpen - Whether the modal is open
 * @param scrollToTop - Whether to auto-scroll to top when modal opens (default: true)
 */
export const useBodyScrollLock = (isOpen: boolean, scrollToTop = true) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Scroll to top when modal opens
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // No need to lock body scroll - we want both modal and body to be scrollable
  }, [isOpen, scrollToTop]);
};
