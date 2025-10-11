# ESLint Local Rules

Custom ESLint rules for the D&D 2024 Character Sheet project.

## Rules

### `require-dnd-template-parsing`

**Type:** `problem` (warns about potential bugs)

**Severity:** `warn` (configurable in `.eslintrc.cjs`)

**Purpose:** Enforces proper parsing of D&D template tags when displaying database content.

#### What it catches

1. **Direct display of D&D content without parsing:**
   ```tsx
   // ❌ Will trigger warning
   <div>{feature.description}</div>

   // ✅ Correct
   <div>{parseComplexDnDEntry(feature.description)}</div>
   ```

2. **Arrays being joined before parsing:**
   ```tsx
   // ❌ Will trigger warning
   const description = feature.entries.join(' ');

   // ✅ Correct
   const description = parseComplexDnDEntry(feature.entries);
   ```

3. **Suspicious variable display:**
   ```tsx
   // ❌ Will trigger warning if 'featDescription' contains unparsed content
   const featDescription = feature.description;
   return <div>{featDescription}</div>;

   // ✅ Correct
   const featDescription = parseComplexDnDEntry(feature.description);
   return <div>{featDescription}</div>;
   ```

4. **Map/forEach without parsing:**
   ```tsx
   // ❌ Will trigger warning
   features.map(f => f.description)

   // ✅ Correct
   features.map(f => parseComplexDnDEntry(f.description))
   ```

#### How it works

The rule tracks:
- Import statements for `parseComplexDnDEntry` and `parseDnDTemplateTag`
- Variable names that suggest D&D content (feature, feat, spell, entries, etc.)
- JSX expressions that might display unparsed content
- Array methods that might skip parsing

#### Auto-fix

Some violations can be automatically fixed:

```bash
npm run lint:fix
```

The rule will attempt to wrap unparsed content with the appropriate parser function.

## Configuration

In `.eslintrc.cjs`:

```js
module.exports = {
  plugins: ['eslint-plugin-local-rules'],
  rules: {
    // Warn about unparsed D&D content
    'local-rules/require-dnd-template-parsing': 'warn',

    // Or use 'error' to enforce strictly
    // 'local-rules/require-dnd-template-parsing': 'error',
  }
}
```

## Error Messages

### `missingParser`
```
D&D content must be parsed through parseComplexDnDEntry() or parseDnDTemplateTag()
to handle template tags like {@condition}, {@spell}, etc.
```

**Fix:** Import and use the parser:
```tsx
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';
const text = parseComplexDnDEntry(content);
```

### `arrayNotParsed`
```
Array containing D&D content (feature.entries, etc.) must be passed to
parseComplexDnDEntry() as an array, NOT joined first
```

**Fix:** Pass the array directly to the parser:
```tsx
// Instead of: content.entries.join(' ')
const text = parseComplexDnDEntry(content.entries);
```

### `suspiciousDirectDisplay`
```
Suspicious direct display of {variable} that may contain D&D template tags.
Consider parsing with parseComplexDnDEntry()
```

**Fix:** Parse the variable before display:
```tsx
const parsed = parseComplexDnDEntry(variable);
return <div>{parsed}</div>;
```

## Development

### File Structure

```
frontend/
├── eslint-local-rules.cjs     # Rule definitions (CommonJS module)
└── eslint-local-rules/
    └── README.md              # This file
```

### Adding New Rules

To add a new rule to this file:

```js
module.exports = {
  'require-dnd-template-parsing': { /* ... */ },

  // Add new rule here
  'your-new-rule': {
    meta: {
      type: 'problem',
      docs: { /* ... */ },
      messages: { /* ... */ },
    },
    create(context) {
      // Rule implementation
      return {
        // AST visitors
      };
    },
  },
};
```

### Testing Rules

1. **Create test cases** with violations:
   ```tsx
   // test.tsx
   const BadComponent = ({ feature }) => {
     return <div>{feature.description}</div>;  // Should warn
   };
   ```

2. **Run ESLint:**
   ```bash
   npm run lint
   ```

3. **Verify warnings appear**

4. **Test auto-fix:**
   ```bash
   npm run lint:fix
   ```

5. **Verify the fix is correct**

## Related Files

- **Parser Implementation**: `frontend/src/utils/dndTemplateParser.ts`
- **Runtime Guards**: `frontend/src/utils/dndTemplateGuard.ts`
- **ESLint Config**: `frontend/.eslintrc.cjs`
- **Documentation**: `docs/DND_TEMPLATE_TAG_ENFORCEMENT.md`

## Common Issues

### Rule not running

1. Ensure `eslint-plugin-local-rules` is installed:
   ```bash
   npm list eslint-plugin-local-rules
   ```

2. Check `.eslintrc.cjs` has the plugin and rule configured

3. Restart your editor

### False positives

If the rule incorrectly flags valid code:

1. Add inline disable comment:
   ```tsx
   // eslint-disable-next-line local-rules/require-dnd-template-parsing
   const text = someOtherFunction(feature.description);
   ```

2. Or disable for the file:
   ```tsx
   /* eslint-disable local-rules/require-dnd-template-parsing */
   ```

3. Consider updating the rule to handle the case better

### False negatives

If the rule misses actual violations:

1. Report the case in the rule's tracking patterns
2. Update the `DND_CONTENT_SOURCES` array in `index.js`
3. Add new AST visitors for the pattern

## Performance

The rule is designed to be lightweight:
- Only checks files importing D&D-related code
- Tracks parser imports to reduce false positives
- Uses simple pattern matching for variable names

## Support

- 📖 **Documentation**: [docs/DND_TEMPLATE_TAG_ENFORCEMENT.md](../../docs/DND_TEMPLATE_TAG_ENFORCEMENT.md)
- 🔧 **Setup Guide**: [docs/TEMPLATE_PARSING_SETUP.md](../../docs/TEMPLATE_PARSING_SETUP.md)
- 📝 **Project Rules**: [CLAUDE.md](../../CLAUDE.md)
