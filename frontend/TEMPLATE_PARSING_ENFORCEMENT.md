# D&D Template Tag Parsing - Enforcement System

## 🚨 Critical Rule

**ALWAYS parse D&D content from the database before displaying it!**

```tsx
// ❌ WRONG - Shows raw tags like {@condition Poisoned|XPHB}
<div>{feature.description}</div>

// ✅ CORRECT - Shows clean text
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';
<div>{parseComplexDnDEntry(feature.description)}</div>
```

## Quick Reference

### Import the Parser
```tsx
import { parseComplexDnDEntry, parseDnDTemplateTag } from '@/utils/dndTemplateParser';
```

### Parse Everything from the Database
```tsx
// For complex structures (arrays, objects, nested data)
parseComplexDnDEntry(feature.entries)

// For simple strings (when you know it's just a string)
parseDnDTemplateTag(feature.name)
```

### Critical: Never Join Arrays Before Parsing
```tsx
// ❌ WRONG - Loses structure, causes [object Object]
const text = feature.entries.join(' ');

// ✅ CORRECT - Parser handles arrays
const text = parseComplexDnDEntry(feature.entries);
```

## Three-Layer Enforcement

### 1. ESLint (Static Analysis) 🔧
**File:** `eslint-local-rules.cjs`

Catches issues before runtime:
```bash
npm run lint           # Check for violations
npm run lint:fix       # Auto-fix some issues
```

**Example warning:**
```
src/components/ui/ClassDetailsModal.tsx
  351:39  warning  D&D content must be parsed through parseComplexDnDEntry()
```

### 2. Runtime Guards (Development) ⚠️
**File:** `src/utils/dndTemplateGuard.ts`

Detects unparsed content while running:
- Console warnings with source location
- Detailed fix instructions
- Optional strict mode (throws errors)

**Enable strict mode:**
```bash
echo "VITE_STRICT_TEMPLATE_PARSING=true" >> .env.development
```

### 3. Visual Warnings (Development) 🔴
**File:** `src/main.tsx`

Automatically highlights problematic elements:
- Red borders on unparsed content
- Tooltip with warning message
- Works via DOM mutation observer

## High-Risk Areas

These locations commonly have unparsed content:

1. **`src/utils/simpleFeatureGenerator.ts`**
   - Lines 716, 795, 1271, 1563, 1621
   - When extracting feat/class/species features

2. **Modal Components**
   - ClassModal, SpellModal, FeatModal
   - When displaying database content

3. **Wizard Steps**
   - Step3D_OriginFeats, Step5_ReviewCreate
   - When showing user selections

4. **Character Sheet Display**
   - Any component rendering `character.classFeatures`, `character.featFeatures`, etc.

## Common Patterns

### Display Feature Content
```tsx
// ✅ Correct patterns
const description = parseComplexDnDEntry(feature.entries);
const text = parseComplexDnDEntry(feature.description);
const name = parseDnDTemplateTag(feature.name);
```

### Map Over Features
```tsx
// ✅ Correct
const features = rawFeatures.map(f => ({
  name: f.name,
  description: parseComplexDnDEntry(f.entries)
}));
```

### Conditional Display
```tsx
// ✅ Correct
const text = feature.description
  ? parseComplexDnDEntry(feature.description)
  : 'No description';
```

## Before Committing

**Checklist:**
- [ ] Run `npm run lint` - no template parsing warnings
- [ ] Test in dev mode - no console warnings
- [ ] Visual check - no red borders on elements
- [ ] UI check - no `{@`, `|XPHB`, or `[object Object]` visible

## Documentation

### Quick Start
📖 **[docs/TEMPLATE_PARSING_SETUP.md](../docs/TEMPLATE_PARSING_SETUP.md)**
- Installation verification
- Testing instructions
- Troubleshooting

### Complete Guide
📚 **[docs/DND_TEMPLATE_TAG_ENFORCEMENT.md](../docs/DND_TEMPLATE_TAG_ENFORCEMENT.md)**
- Full documentation (400+ lines)
- All patterns and anti-patterns
- Advanced usage

### Implementation Summary
📋 **[docs/TEMPLATE_PARSING_ENFORCEMENT_SUMMARY.md](../docs/TEMPLATE_PARSING_ENFORCEMENT_SUMMARY.md)**
- What was built
- How it works
- Testing results

### Project Guidelines
📝 **[CLAUDE.md](../CLAUDE.md#important-development-notes)**
- Critical rules
- Development workflow

## Usage Examples

### Basic Component
```tsx
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';

function FeatureDisplay({ feature }) {
  const description = parseComplexDnDEntry(feature.entries);
  return <div>{description}</div>;
}
```

### With Runtime Guard
```tsx
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';
import { guardDnDContent } from '@/utils/dndTemplateGuard';

function FeatureDisplay({ feature }) {
  // Validate in dev mode
  guardDnDContent(feature, 'FeatureDisplay.feature');

  // Parse and display
  const description = parseComplexDnDEntry(feature.entries);
  return <div>{description}</div>;
}
```

### With React Hook
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

## Warning Signs

### In the UI
Look for these indicators of unparsed content:
- `{@condition Something|XPHB}` - Raw template tag
- `|XPHB`, `|XDMG` - Source references
- `[object Object]` - Object wasn't parsed

### In the Console
```
⚠️ UNPARSED D&D TEMPLATE TAGS DETECTED
{
  source: 'feature.description',
  sample: 'You gain {@condition Invisible|XPHB}...',
  fix: 'Use parseComplexDnDEntry() before displaying'
}
```

### In Your Editor
```
⚠ warning: D&D content must be parsed through parseComplexDnDEntry()
   or parseDnDTemplateTag() to handle template tags
```

## Troubleshooting

### ESLint Not Warning
1. Check `eslint-plugin-local-rules` is installed: `npm list eslint-plugin-local-rules`
2. Verify `.eslintrc.cjs` has the plugin and rule
3. Restart your editor

### Runtime Warnings Not Showing
1. Verify dev mode: `console.log(import.meta.env.MODE)`
2. Check console for "Visual D&D template warnings enabled" message
3. Clear cache and hard reload

### Visual Borders Not Appearing
1. Check console for warnings (they may log even if visual doesn't show)
2. Inspect element for `unparsed-dnd-content` class
3. Verify DOM observer is running

## Need Help?

- 📖 [Full Documentation](../docs/DND_TEMPLATE_TAG_ENFORCEMENT.md)
- 🚀 [Setup Guide](../docs/TEMPLATE_PARSING_SETUP.md)
- 📋 [Implementation Summary](../docs/TEMPLATE_PARSING_ENFORCEMENT_SUMMARY.md)
- 📝 [Project Guidelines](../CLAUDE.md)

---

**Remember:** The goal is users should NEVER see raw template tags. This enforcement system helps catch violations automatically at three different stages of development!
