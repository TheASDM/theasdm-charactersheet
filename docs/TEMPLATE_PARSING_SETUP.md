# D&D Template Parsing Enforcement - Setup Guide

## Quick Start

The D&D template tag parsing enforcement system is now installed and ready to use.

## What Was Installed

### 1. ESLint Custom Rule
- **File**: `frontend/eslint-local-rules.cjs`
- **Plugin**: `eslint-plugin-local-rules` (installed)
- **Config**: Updated `.eslintrc.cjs`

### 2. Runtime Guards
- **File**: `frontend/src/utils/dndTemplateGuard.ts`
- **Features**:
  - Console warnings for unparsed content
  - Visual red borders on problematic elements
  - Character validation utilities
  - React hooks for component-level guards

### 3. Development Mode Integration
- **File**: `frontend/src/main.tsx` (updated)
- **Auto-enabled**: Visual warnings load automatically in dev mode

## How to Use

### During Development

1. **Run the dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Watch for warnings in:**
   - ✅ Browser console (runtime guards)
   - ✅ Red borders on UI elements (visual warnings)
   - ✅ ESLint output in your editor

3. **Run lint checks:**
   ```bash
   npm run lint           # Check for issues
   npm run lint:fix       # Auto-fix some issues
   ```

### Enable Strict Mode (Optional)

To throw errors instead of warnings:

1. **Create/edit** `frontend/.env.development`:
   ```bash
   VITE_STRICT_TEMPLATE_PARSING=true
   ```

2. **Restart the dev server**

3. **Now unparsed content will throw errors** instead of just warnings

### In Your Code

#### Basic Usage

```tsx
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';

function FeatureDisplay({ feature }) {
  // ✅ Parse before displaying
  const description = parseComplexDnDEntry(feature.entries);

  return <div>{description}</div>;
}
```

#### With Runtime Guards

```tsx
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';
import { guardDnDContent } from '@/utils/dndTemplateGuard';

function FeatureDisplay({ feature }) {
  // Guard in development (logs warnings)
  guardDnDContent(feature, 'FeatureDisplay.feature');

  // Parse and display
  const description = parseComplexDnDEntry(feature.entries);

  return <div>{description}</div>;
}
```

#### With React Hook

```tsx
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';
import { useDnDContentGuard } from '@/utils/dndTemplateGuard';

function FeatureDisplay({ feature }) {
  // Auto-guard on every render (dev only)
  useDnDContentGuard(feature, 'feature');

  return (
    <div>
      <h3>{feature.name}</h3>
      <p>{parseComplexDnDEntry(feature.description)}</p>
    </div>
  );
}
```

## Testing the System

### Test 1: Create Bad Content

```tsx
// Create a test component with unparsed content
const TestComponent = () => {
  const feature = {
    entries: ["You gain the {@condition Invisible|XPHB} condition"]
  };

  // ❌ This will trigger warnings
  return <div>{feature.entries.join(' ')}</div>;
};
```

**Expected Results:**
- 🔴 Red border around the element
- ⚠️ Console warning with details
- 🔧 ESLint warning in editor

### Test 2: Fix the Issue

```tsx
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';

const TestComponent = () => {
  const feature = {
    entries: ["You gain the {@condition Invisible|XPHB} condition"]
  };

  // ✅ This is correct
  return <div>{parseComplexDnDEntry(feature.entries)}</div>;
};
```

**Expected Results:**
- ✅ No warnings
- ✅ Clean display: "You gain the Invisible condition"

### Test 3: Validate a Character

```tsx
import { validateCharacterContent } from '@/utils/dndTemplateGuard';

// In a test or component
const character = getCharacter();
const validation = validateCharacterContent(character);

if (validation.hasUnparsedContent) {
  console.error('Unparsed content found!');
  console.table(validation.violations);
}
```

## Troubleshooting

### ESLint Rule Not Working

**Symptoms:**
- No warnings in editor for unparsed content

**Solutions:**

1. **Verify the package is installed:**
   ```bash
   cd frontend
   npm list eslint-plugin-local-rules
   ```
   Should show: `eslint-plugin-local-rules@1.x.x`

2. **Check ESLint config** (`.eslintrc.cjs`):
   ```js
   plugins: ['eslint-plugin-local-rules'],
   rules: {
     'local-rules/require-dnd-template-parsing': 'warn',
   }
   ```

3. **Restart your editor** (VSCode, etc.)

4. **Run lint manually:**
   ```bash
   npm run lint
   ```

### Runtime Guards Not Working

**Symptoms:**
- No console warnings
- No red borders

**Solutions:**

1. **Verify you're in development mode:**
   ```tsx
   console.log(import.meta.env.MODE); // Should be "development"
   ```

2. **Check console for initialization:**
   Look for:
   ```
   🔍 Visual D&D template warnings enabled - unparsed content will have red borders
   ```

3. **Clear browser cache and hard reload:**
   - Chrome: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Firefox: Ctrl+F5 (Cmd+Shift+R on Mac)

4. **Check the guard was imported:**
   In `main.tsx`, verify:
   ```tsx
   if (import.meta.env.MODE === 'development') {
     import('./utils/dndTemplateGuard').then(({ enableVisualTemplateWarnings }) => {
       enableVisualTemplateWarnings();
     });
   }
   ```

### Visual Warnings Not Appearing

**Symptoms:**
- Console warnings work
- But no red borders

**Solutions:**

1. **Inspect the element** in DevTools
   - Look for class `unparsed-dnd-content`
   - Check if CSS is being applied

2. **Manually trigger visual check:**
   ```tsx
   import { enableVisualTemplateWarnings } from '@/utils/dndTemplateGuard';
   enableVisualTemplateWarnings();
   ```

3. **Check for CSS conflicts**
   - The visual warning CSS might be overridden
   - Try adding `!important` to the border style

## Common Patterns

### Pattern 1: Display Feature Entries

```tsx
// ❌ Wrong
<div>{feature.entries.join(' ')}</div>

// ✅ Right
<div>{parseComplexDnDEntry(feature.entries)}</div>
```

### Pattern 2: Map Over Features

```tsx
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';

// ✅ Correct
const features = rawFeatures.map(feature => ({
  name: feature.name,
  description: parseComplexDnDEntry(feature.entries)
}));
```

### Pattern 3: Conditional Display

```tsx
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';

// ✅ Always parse
const description = feature.description
  ? parseComplexDnDEntry(feature.description)
  : 'No description';
```

### Pattern 4: Nested Features

```tsx
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';

// ✅ Parser handles nesting
const text = parseComplexDnDEntry({
  entries: [
    "Main text",
    { type: "list", items: [...] },
    "More text"
  ]
});
```

## Files Reference

### Core Files
- **Parser**: `frontend/src/utils/dndTemplateParser.ts`
- **Guards**: `frontend/src/utils/dndTemplateGuard.ts`
- **ESLint Rule**: `frontend/eslint-local-rules.cjs`

### Configuration
- **ESLint**: `frontend/.eslintrc.cjs`
- **Main App**: `frontend/src/main.tsx`
- **Environment**: `frontend/.env.development` (create if needed)

### Documentation
- **Full Guide**: `docs/DND_TEMPLATE_TAG_ENFORCEMENT.md`
- **Project Rules**: `CLAUDE.md`

## Next Steps

1. ✅ **Test the system** with the examples above
2. ✅ **Run lint** on existing code: `npm run lint`
3. ✅ **Fix any issues** found by the linter
4. ✅ **Enable strict mode** (optional) for development
5. ✅ **Add to your workflow**: Always run lint before committing

## Need Help?

- 📖 **Full Documentation**: [DND_TEMPLATE_TAG_ENFORCEMENT.md](./DND_TEMPLATE_TAG_ENFORCEMENT.md)
- 🔧 **Project Rules**: [../CLAUDE.md](../CLAUDE.md)
- 🐛 **Found a bug?**: Check console for detailed error messages
- 💡 **Pro tip**: Use strict mode during development to catch issues early!

---

**Remember:** The goal is to ensure users NEVER see raw template tags like `{@condition Poisoned|XPHB}` in the UI. The enforcement system helps catch these issues automatically!
