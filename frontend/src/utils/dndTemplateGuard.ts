/**
 * Runtime guards for D&D template tag parsing enforcement
 *
 * This module provides runtime validation to ensure D&D content is properly parsed
 * before being displayed to users. It helps catch cases where template tags like
 * {@condition Incapacitated|XPHB} would be shown as raw text.
 *
 * IMPORTANT: These guards only run in development mode to avoid performance impact
 * in production.
 */

import React from 'react';
import { logger } from './logger';

/**
 * Pattern to detect unparsed D&D template tags
 */
const TEMPLATE_TAG_PATTERN = /\{@\w+\s+[^}]+\}/;
const PIPE_XPHB_PATTERN = /\|\s*X[PDM][HBG]/;

/**
 * Check if a string contains unparsed D&D template tags
 */
export function containsUnparsedTags(text: string): boolean {
  if (typeof text !== 'string') return false;
  return TEMPLATE_TAG_PATTERN.test(text) || PIPE_XPHB_PATTERN.test(text);
}

/**
 * Runtime guard to validate that D&D content has been parsed
 *
 * Usage in components:
 * ```tsx
 * const displayText = guardDnDContent(feature.description, 'feature.description');
 * return <div>{displayText}</div>
 * ```
 *
 * @param content - The content to validate
 * @param contentSource - Description of where this content came from (for debugging)
 * @returns The same content (for pass-through)
 */
export function guardDnDContent(content: any, contentSource: string = 'unknown'): any {
  // Only run in development mode
  if (import.meta.env.MODE !== 'development') {
    return content;
  }

  // Check strings
  if (typeof content === 'string') {
    if (containsUnparsedTags(content)) {
      const sample = content.substring(0, 100);
      logger.warn(
        '⚠️ UNPARSED D&D TEMPLATE TAGS DETECTED',
        {
          source: contentSource,
          sample,
          issue: 'Content contains template tags like {@condition} or |XPHB that should be parsed',
          fix: 'Use parseComplexDnDEntry() or parseDnDTemplateTag() before displaying'
        }
      );

      // In strict mode, throw an error
      if (import.meta.env.VITE_STRICT_TEMPLATE_PARSING === 'true') {
        throw new Error(
          `Unparsed D&D template tags in ${contentSource}. ` +
          `Use parseComplexDnDEntry() to parse content before displaying.`
        );
      }
    }
  }

  // Check arrays
  if (Array.isArray(content)) {
    content.forEach((item, index) => {
      guardDnDContent(item, `${contentSource}[${index}]`);
    });
  }

  // Check objects
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    // Check common D&D content properties
    const propsToCheck = ['entries', 'description', 'text', 'benefits', 'name'];
    propsToCheck.forEach(prop => {
      if (prop in content) {
        guardDnDContent(content[prop], `${contentSource}.${prop}`);
      }
    });
  }

  return content;
}

/**
 * Higher-order component wrapper to automatically guard D&D content
 *
 * Usage:
 * ```tsx
 * const SafeFeatureDisplay = withDnDContentGuard(
 *   ({ feature }) => <div>{feature.description}</div>,
 *   'FeatureDisplay'
 * );
 * ```
 */
export function withDnDContentGuard<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string = 'Component'
) {
  return (props: P) => {
    if (import.meta.env.MODE === 'development') {
      // Check all props for unparsed content
      Object.entries(props).forEach(([key, value]) => {
        guardDnDContent(value, `${componentName}.props.${key}`);
      });
    }
    return React.createElement(Component, props);
  };
}

/**
 * React hook to guard content in components
 *
 * Usage:
 * ```tsx
 * const MyComponent = ({ feature }) => {
 *   useDnDContentGuard(feature, 'feature');
 *   return <div>{parseComplexDnDEntry(feature.description)}</div>
 * }
 * ```
 */
export function useDnDContentGuard(content: any, contentName: string = 'content') {
  if (import.meta.env.MODE === 'development') {
    // Check on every render in development
    React.useEffect(() => {
      guardDnDContent(content, contentName);
    }, [content, contentName]);
  }
}

/**
 * Utility to validate an entire character object for unparsed content
 * Useful for testing and debugging
 */
export function validateCharacterContent(character: any): {
  hasUnparsedContent: boolean;
  violations: Array<{ path: string; sample: string }>;
} {
  const violations: Array<{ path: string; sample: string }> = [];

  function checkPath(obj: any, path: string) {
    if (typeof obj === 'string' && containsUnparsedTags(obj)) {
      violations.push({
        path,
        sample: obj.substring(0, 100)
      });
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => checkPath(item, `${path}[${index}]`));
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        checkPath(value, `${path}.${key}`);
      });
    }
  }

  checkPath(character, 'character');

  return {
    hasUnparsedContent: violations.length > 0,
    violations
  };
}

/**
 * Development-only: Add visual indicators to DOM elements with unparsed content
 * This adds a red border and tooltip to elements containing template tags
 */
export function enableVisualTemplateWarnings() {
  if (import.meta.env.MODE !== 'development') return;

  // Add CSS for visual warnings
  const style = document.createElement('style');
  style.textContent = `
    .unparsed-dnd-content {
      border: 2px solid red !important;
      position: relative;
    }
    .unparsed-dnd-content::after {
      content: '⚠️ Unparsed D&D template tags detected!';
      position: absolute;
      top: -25px;
      left: 0;
      background: red;
      color: white;
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 3px;
      white-space: nowrap;
      z-index: 10000;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // Observer to check for unparsed content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const text = element.textContent || '';

          if (containsUnparsedTags(text)) {
            element.classList.add('unparsed-dnd-content');
            logger.warn('Visual template warning added to element:', element);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  logger.warn('🔍 Visual D&D template warnings enabled - unparsed content will have red borders');
}
