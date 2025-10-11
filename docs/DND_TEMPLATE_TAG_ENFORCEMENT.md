# D&D Template Tag Parsing Enforcement

This document explains the enforcement mechanisms for proper D&D template tag parsing in the character sheet application.

## Table of Contents

1. [Overview](#overview)
2. [Why This Matters](#why-this-matters)
3. [Enforcement Tools](#enforcement-tools)
4. [Usage Guide](#usage-guide)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

## Overview

D&D content from the database contains template tags like `{@condition Incapacitated|XPHB}`, `{@spell Fireball|XPHB}`, etc. These **MUST** be parsed before displaying to users, or they will see ugly raw markup.

**The Golden Rule:** Any content from the database (feats, spells, class features, etc.) must pass through `parseComplexDnDEntry()` or `parseDnDTemplateTag()` before being displayed.

## Why This Matters

### The Problem

Database content looks like this:
```
"You gain immunity to the {@condition Poisoned|XPHB} condition and resistance to Poison damage."
```

### Without Parsing (❌ BAD)
Users see:
```
"You gain immunity to the {@condition Poisoned|XPHB} condition and resistance to Poison damage."
```

### With Parsing (✅ GOOD)
Users see:
```
"You gain immunity to the Poisoned condition and resistance to Poison damage."
```

### Critical Case: Arrays

**NEVER** join an array before parsing. Arrays may contain objects that need recursive parsing:

```tsx
// ❌ WRONG - Joins first, loses object structure
const description = feature.entries.join(' ');

// ✅ CORRECT - Parse the array directly
const description = parseComplexDnDEntry(feature.entries);
```

## Enforcement Tools

### 1. ESLint Rule (Static Analysis)

**Location:** `frontend/eslint-local-rules.cjs`

**What it catches:**
- Direct display of D&D content without parsing
- Arrays being joined before parsing
- JSX expressions with unparsed content

**How to use:**
```bash
npm run lint
```

**Auto-fix:**
Some violations can be auto-fixed:
```bash
npm run lint:fix
```

**Example warnings:**
```
⚠ warning: D&D content must be parsed through parseComplexDnDEntry()
   src/components/FeatureDisplay.tsx:42:10

⚠ warning: Array containing D&D content (feature.entries) must be passed to parseComplexDnDEntry()
   src/utils/featureExtractor.ts:15:20
```

### 2. Runtime Guards (Development Mode)

**Location:** `frontend/src/utils/dndTemplateGuard.ts`

**What it does:**
- Detects unparsed template tags at runtime
- Logs warnings to console with source location
- Optionally adds visual red borders to affected elements
- Can throw errors in strict mode

**How to enable strict mode:**
Add to your `.env.development`:
```
VITE_STRICT_TEMPLATE_PARSING=true
```

**Console warnings look like:**
```
⚠️ UNPARSED D&D TEMPLATE TAGS DETECTED
{
  source: 'feature.description',
  sample: 'You gain immunity to the {@condition Poisoned|XPHB}...',
  issue: 'Content contains template tags like {@condition} or |XPHB that should be parsed',
  fix: 'Use parseComplexDnDEntry() or parseDnDTemplateTag() before displaying'
}
```

### 3. Visual Warnings (Development Mode)

**What it does:**
- Automatically highlights elements with unparsed content
- Adds red border and tooltip
- Helps identify issues during development

**How to enable:**
Already enabled automatically in development mode via [main.tsx:14-16](frontend/src/main.tsx#L14-L16)

## Usage Guide

### Basic Parsing

```tsx
import { parseComplexDnDEntry, parseDnDTemplateTag } from '@/utils/dndTemplateParser';

// For simple strings
const displayName = parseDnDTemplateTag(spell.name);

// For complex structures (arrays, objects, nested data)
const description = parseComplexDnDEntry(feature.entries);
```

### Using Runtime Guards

```tsx
import { guardDnDContent } from '@/utils/dndTemplateGuard';

function FeatureComponent({ feature }) {
  // Guard the content in development
  guardDnDContent(feature, 'FeatureComponent.feature');

  // Then parse and display
  const description = parseComplexDnDEntry(feature.entries);

  return <div>{description}</div>;
}
```

### Using the React Hook

```tsx
import { useDnDContentGuard } from '@/utils/dndTemplateGuard';
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';

function FeatureDisplay({ feature }) {
  // Automatically guards on every render in dev mode
  useDnDContentGuard(feature, 'feature');

  return (
    <div>
      <h3>{feature.name}</h3>
      <p>{parseComplexDnDEntry(feature.description)}</p>
    </div>
  );
}
```

### Validating Character Objects

```tsx
import { validateCharacterContent } from '@/utils/dndTemplateGuard';

// Useful for debugging
const validation = validateCharacterContent(character);
if (validation.hasUnparsedContent) {
  console.error('Unparsed content found:', validation.violations);
}
```

## Common Patterns

### ✅ Correct Patterns

```tsx
// 1. Simple string
const text = parseDnDTemplateTag(feature.text);

// 2. Complex object/array
const description = parseComplexDnDEntry(feature.entries);

// 3. Array of features
const descriptions = features.map(f => ({
  name: f.name,
  description: parseComplexDnDEntry(f.entries)
}));

// 4. Conditional content
const desc = feature.description
  ? parseComplexDnDEntry(feature.description)
  : 'No description available';

// 5. Nested properties
const text = parseComplexDnDEntry(feat.entries);  // Works even if entries is an array!
```

### ❌ Anti-Patterns to Avoid

```tsx
// 1. Joining before parsing
const description = feature.entries.join(' ');  // ❌ DON'T DO THIS
const description = parseComplexDnDEntry(feature.entries);  // ✅ DO THIS

// 2. Direct display
<div>{feature.description}</div>  // ❌ NO
<div>{parseComplexDnDEntry(feature.description)}</div>  // ✅ YES

// 3. Manual string manipulation before parsing
const text = feature.entries.map(e => String(e)).join(' ');  // ❌ NO
const text = parseComplexDnDEntry(feature.entries);  // ✅ YES

// 4. Conditional parsing
const text = isImportant ? parseComplexDnDEntry(feature.text) : feature.text;  // ❌ NO
const text = parseComplexDnDEntry(feature.text);  // ✅ YES - always parse!
```

### Common Locations Requiring Parsing

These are high-risk areas where unparsed content often appears:

1. **Feature Generators** ([simpleFeatureGenerator.ts](frontend/src/utils/simpleFeatureGenerator.ts))
   - Lines 716, 795, 1271, 1563, 1621
   - When extracting feat/class/species features

2. **Modal Components**
   - ClassModal, SpellModal, FeatModal
   - When displaying database content

3. **Wizard Steps**
   - Step3D_OriginFeats, Step5_ReviewCreate
   - When showing selections

4. **Character Sheet Display**
   - Any component rendering character.classFeatures, character.featFeatures, etc.

## Troubleshooting

### ESLint Rule Not Working

1. **Install the plugin:**
   ```bash
   cd frontend
   npm install --save-dev eslint-plugin-local-rules
   ```

2. **Verify configuration:**
   Check [.eslintrc.cjs:16,22](frontend/.eslintrc.cjs#L16,L22) has:
   ```js
   plugins: ['eslint-plugin-local-rules'],
   rules: {
     'local-rules/require-dnd-template-parsing': 'warn',
   }
   ```

3. **Restart your editor** to reload ESLint

### Runtime Guards Not Showing

1. **Check you're in development mode:**
   ```
   import.meta.env.MODE === 'development'
   ```

2. **Check console** for initialization message:
   ```
   🔍 Visual D&D template warnings enabled - unparsed content will have red borders
   ```

3. **Open browser DevTools** and check for warnings in console

### Visual Warnings Not Appearing

The visual warning system only activates when:
- You're in development mode
- Content with template tags is actually rendered to the DOM
- The DOM mutation observer is active

**Debug steps:**
1. Open DevTools Console
2. Look for red-bordered elements
3. Check console for "Visual template warning added to element" logs

### Strict Mode Errors

If you see errors like:
```
Error: Unparsed D&D template tags in feature.description
```

**This is GOOD!** It means the guard caught unparsed content. Fix it by:

1. **Find the source** (check the error stack trace)
2. **Add parsing:**
   ```tsx
   // Before
   const text = feature.description;

   // After
   const text = parseComplexDnDEntry(feature.description);
   ```

### "[object Object]" Appearing in UI

This usually means:
1. An array or object was passed to display without being parsed
2. The parser didn't handle a specific object type

**Fix:**
```tsx
// If you see [object Object], you likely have:
<div>{feature.entries}</div>  // ❌

// Should be:
<div>{parseComplexDnDEntry(feature.entries)}</div>  // ✅
```

## Testing the Enforcement

### Manual Testing

1. **Create a test component with unparsed content:**
   ```tsx
   const TestBadContent = () => {
     const feature = {
       entries: ["You gain {@condition Invisible|XPHB} condition"]
     };
     return <div>{feature.entries.join(' ')}</div>;  // ❌ Will trigger warnings
   };
   ```

2. **Run in development:**
   - Check ESLint warnings
   - Check console for runtime warnings
   - Look for red borders on elements

3. **Fix and verify:**
   ```tsx
   return <div>{parseComplexDnDEntry(feature.entries)}</div>;  // ✅ Clean
   ```

### Automated Testing

Run lint checks:
```bash
npm run lint
```

Check for unparsed content in a character:
```tsx
import { validateCharacterContent } from '@/utils/dndTemplateGuard';

test('character has no unparsed content', () => {
  const character = createTestCharacter();
  const validation = validateCharacterContent(character);
  expect(validation.hasUnparsedContent).toBe(false);
});
```

## Best Practices

1. **Always import the parser** at the top of files that display D&D content
2. **Parse early** - as soon as you extract content from the database
3. **Use parseComplexDnDEntry()** for anything that might be complex (arrays, objects)
4. **Use parseDnDTemplateTag()** only for simple strings you know are strings
5. **Test in development** with strict mode enabled
6. **Run lint** before committing

## Configuration Reference

### Environment Variables

```bash
# .env.development
VITE_STRICT_TEMPLATE_PARSING=true  # Throw errors for unparsed content
```

### ESLint Rule Severity

In [.eslintrc.cjs](frontend/.eslintrc.cjs):
```js
rules: {
  'local-rules/require-dnd-template-parsing': 'warn',  // or 'error'
}
```

## Related Files

- [dndTemplateParser.ts](frontend/src/utils/dndTemplateParser.ts) - Core parsing logic
- [dndTemplateGuard.ts](frontend/src/utils/dndTemplateGuard.ts) - Runtime guards
- [eslint-local-rules/index.js](frontend/eslint-local-rules/index.js) - ESLint rule
- [CLAUDE.md](CLAUDE.md#important-development-notes) - Project guidelines

## Support

If you encounter issues:

1. Check this documentation
2. Review [CLAUDE.md](CLAUDE.md) project instructions
3. Search for examples in the codebase using the parser
4. Check the console for runtime warnings with detailed context
