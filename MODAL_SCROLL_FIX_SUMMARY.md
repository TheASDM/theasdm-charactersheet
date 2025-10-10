# Modal Scroll Behavior Fix - Summary

## Overview
This document tracks the progress of fixing scroll behavior for all modals in the frontend/src/components directory.

## Completed Fixes (4/16)

### 1. SpeciesModal.tsx ✅
- **Status**: COMPLETE
- **Changes**:
  - Added `useBodyScrollLock` hook import
  - Added `useBodyScrollLock(true)` call in component
  - Removed `overflow-y: auto` from ModalOverlay
  - Added `display: flex; flex-direction: column` to ModalContent
  - Added `flex-shrink: 0` to SpeciesHeader
  - Created new `ModalBody` styled component with `overflow-y: auto; flex: 1` and custom scrollbar
  - Wrapped content sections in `ModalBody`

### 2. SpellModal.tsx ✅
- **Status**: COMPLETE
- **Changes**:
  - Added `useBodyScrollLock` hook import
  - Added `useBodyScrollLock(isOpen)` call in component
  - Removed `overflow-y: auto` from ModalOverlay
  - Removed padding and overflow from ModalContent, added flex layout
  - Created `ModalHeader` with `flex-shrink: 0` and padding
  - Created `ModalBody` with `overflow-y: auto; flex: 1` and custom scrollbar
  - Wrapped all content in appropriate ModalHeader and ModalBody sections

### 3. BackgroundSelectionModal.tsx ✅
- **Status**: COMPLETE
- **Changes**:
  - Added `useBodyScrollLock` hook import
  - Added `useBodyScrollLock(isOpen)` call in component
  - Removed `overflow-y: auto` from BackgroundPopupModal
  - Added `display: flex; flex-direction: column` to BackgroundPopupModal
  - Created `ModalHeader` with `flex-shrink: 0`
  - Created `ModalBody` with `overflow-y: auto; flex: 1` and custom scrollbar
  - Updated all three JSX render cases (loading, error, main) to use ModalHeader and ModalBody

### 4. SpeciesSelectionModal.tsx ✅
- **Status**: COMPLETE
- **Changes**:
  - Added `useBodyScrollLock` hook import
  - Added `useBodyScrollLock(isOpen)` call in component
  - Removed `overflow-y: auto` and `padding` from SpeciesPopupModal
  - Added `display: flex; flex-direction: column` to SpeciesPopupModal
  - Created `ModalHeader` with `flex-shrink: 0`
  - Created `ModalBody` with `overflow-y: auto; flex: 1` and custom scrollbar
  - Updated both JSX render cases (details view and list view) to use ModalHeader and ModalBody

## Remaining Modals to Fix (12/16)

### Priority 1 - Selection Modals
5. **ClassSelectionModal.tsx** - Two-step modal, needs careful handling
6. **ChoiceSelectionModal.tsx** - Already has good structure, minimal changes needed

### Priority 2 - Management Modals
7. **ActionsManagementModal.tsx** - Large modal with forms
8. **SkillsManagementModal.tsx** - Grid-based layout
9. **TraitsManagementModal.tsx** - Tabbed interface, largest file (726 lines)

### Priority 3 - Item/Equipment Modals
10. **ItemManagementModals.tsx** - Contains 3 modal components
11. **EquipmentItemModal.tsx** - Already has ModalHeader and ModalBody, may just need hook

### Priority 4 - Character Sheet Modal
12. **CharacterSheetModal.tsx** - Large character sheet display
13. **WeaponMasteryModal.tsx** - Already has good structure

### Priority 5 - Wizard/UI Modals
14. **wizard/SelectModal.tsx** - Already has flex layout, may just need hook
15. **ui/ClassDetailsModal.tsx** - Large details modal, already has ModalContent with overflow
16. **ui/AbilityScoreMethodModal.tsx** - Simple selection modal

## Standard Fix Pattern

For each modal, follow these steps:

### 1. Add Hook Import
```typescript
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'; // Adjust path as needed
```

### 2. Add Hook Call
```typescript
// For modals with isOpen prop:
useBodyScrollLock(isOpen);

// For modals always open when rendered:
useBodyScrollLock(true);
```

### 3. Fix Overlay Styles
```typescript
const ModalOverlay = styled.div`
  // ... existing styles ...
  /* No overflow - backdrop doesn't scroll */
  // Remove: overflow-y: auto;
`;
```

### 4. Fix Modal Container
```typescript
const ModalContainer = styled.div`
  // ... existing styles ...
  display: flex;
  flex-direction: column;
  // Remove: overflow-y: auto;
  // Remove: padding (move to header/body)
`;
```

### 5. Create/Update Header Section
```typescript
const ModalHeader = styled.div`
  padding: 1.5rem; // or appropriate padding
  flex-shrink: 0;
  // Include border-bottom if appropriate
`;
```

### 6. Create/Update Body Section
```typescript
const ModalBody = styled.div`
  padding: 0 1.5rem 1.5rem 1.5rem; // or appropriate padding
  overflow-y: auto;
  flex: 1;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(35, 35, 35, 0.5);
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ce9016;
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #b8860b;
  }
`;
```

### 7. Create Footer Section (if needed)
```typescript
const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  flex-shrink: 0;
  border-top: 1px solid rgba(206, 144, 22, 0.3);
`;
```

### 8. Update JSX Structure
```jsx
return (
  <ModalOverlay onClick={handleOverlayClick}>
    <ModalContainer>
      <ModalHeader>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalTitle>Title Here</ModalTitle>
      </ModalHeader>

      <ModalBody>
        {/* All scrollable content goes here */}
      </ModalBody>

      {/* Optional footer */}
      <ModalFooter>
        <Button onClick={onConfirm}>Confirm</Button>
      </ModalFooter>
    </ModalContainer>
  </ModalOverlay>
);
```

## Notes

- All modals should use `useBodyScrollLock` to prevent background scrolling
- Overlay/Backdrop should never have `overflow-y: auto`
- Modal container should use flexbox with `flex-direction: column`
- Only the ModalBody should have `overflow-y: auto` and `flex: 1`
- Header and Footer should have `flex-shrink: 0`
- Custom scrollbar styles should match the app's theme (#ce9016 gold color)

## Hook Location
`/Users/dustinamodeo/Documents/coding/projects/theasdm-charactersheet/frontend/src/hooks/useBodyScrollLock.ts`

## Already Fixed Modals (From Earlier Work)
- ClassModal.tsx
- SpellDetailModal.tsx (in spells/)
- WizardModal.tsx (in wizard/)
- FeatSelectionModal.tsx
- DetailsModal.tsx (in wizard/)
