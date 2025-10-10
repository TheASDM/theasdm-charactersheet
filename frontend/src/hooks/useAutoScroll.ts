import { useState, useCallback, useRef } from 'react';
import { scrollToBottomNav, scrollToTop, AutoScrollOptions } from '../utils/autoScroll';

/**
 * React hook for auto-scrolling with state tracking
 */
export function useAutoScroll() {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  const scrollToBottom = useCallback((options: AutoScrollOptions = {}) => {
    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    setIsScrolling(true);

    // Wrap the onComplete callback
    const originalOnComplete = options.onComplete;
    const wrappedOptions: AutoScrollOptions = {
      ...options,
      onComplete: () => {
        setIsScrolling(false);
        originalOnComplete?.();
      },
    };

    scrollToBottomNav(wrappedOptions);

    // Fallback timeout in case scroll never completes
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  }, []);

  const scrollUp = useCallback((options: Omit<AutoScrollOptions, 'offset'> = {}) => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    setIsScrolling(true);

    const originalOnComplete = options.onComplete;
    const wrappedOptions = {
      ...options,
      onComplete: () => {
        setIsScrolling(false);
        originalOnComplete?.();
      },
    };

    scrollToTop(wrappedOptions);

    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  }, []);

  return {
    scrollToBottom,
    scrollToTop: scrollUp,
    isScrolling,
  };
}
