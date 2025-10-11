# Deprecated Scripts

This document lists deprecated scripts in this directory and their replacements.

## ❌ Deprecated: transform-class-data.js

**Status:** DEPRECATED (2025-10-10)

**Reason:** This script has been superseded by `transform-class-data-revised.js`, which includes:
- Better handling of complex D&D 2024 class structures
- Improved choice detection for features like Divine Order
- Support for external references (Eldritch Invocations, Fighting Styles)
- More robust table parsing
- Better scaling progression handling

**Replacement:** Use `transform-class-data-revised.js` instead

**Migration:** If you need to transform class data:

```bash
# Old (deprecated)
node scripts/transform-class-data.js

# New (recommended)
node scripts/transform-class-data-revised.js
```

### What Changed

The revised script adds:
1. **Choice Detection**: Automatically identifies features that present choices (e.g., "Divine Order")
2. **External References**: Handles Eldritch Invocations, Fighting Styles, and other external choice systems
3. **Scaling Progression**: Better tracking of how features scale by level
4. **Table Parsing**: Improved handling of embedded tables in feature descriptions
5. **Grant Detection**: Identifies features that grant options (e.g., "Martial Weapon Training")

### File Preservation

The old `transform-class-data.js` file is kept for reference but should not be used for new transformations. It may be removed in a future cleanup.

---

**Last Updated:** 2025-10-10
