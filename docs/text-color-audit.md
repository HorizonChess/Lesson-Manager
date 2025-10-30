# Text Color Audit Report

**Date**: October 26, 2025
**Issue**: Hardcoded text colors without dark mode support causing poor visibility

## Summary

**Total instances found**: ~202 hardcoded text colors
- `text-gray-*`: 150 instances
- `text-slate-*`: 52 instances

**Files affected**: 31 files across the codebase

## Breakdown by Component Type

### Lessons Components (6 files)
- `LessonMaterialSelector.tsx` - ✅ **COMPLETE** (Oct 26, 2025)
  - Material title: `text-slate-900 dark:text-slate-100`
  - Description: `text-slate-800 dark:text-slate-200`
  - Accent: `text-blue-800 dark:text-blue-200 font-semibold`
  - Empty state: `text-slate-800/700 dark:text-slate-200/300`
  - **Key learning**: Cards need slate-800/900 (nearly black) for layered glass
- `LessonsRecordModal.tsx` - ✅ **COMPLETE** (Oct 26, 2025)
  - All text colors already had `dark:` variants ✅
  - **Global fix**: Updated placeholder colors in `themeSurfaces.css`
    - Light: `rgba(71, 85, 105, 0.85)` (darker, 85% opacity slate-600)
    - Dark: `rgba(148, 163, 184, 0.6)` (unchanged)
  - Affects ALL `.surface-input` placeholders app-wide
- `RecurringLessonsModal.tsx` - ✅ **COMPLETE** (Oct 26, 2025)
  - **X button (header)**: `text-slate-600 dark:text-slate-300` with scale effect (`hover:scale-110`)
  - **Close button (footer)**: Added scale effect (`hover:scale-105 transition-all`)
  - Week count helper text: `text-slate-700 dark:text-slate-300`
  - **Select dropdown**: Explicit `text-gray-900 dark:text-gray-100` + option colors
  - Preset buttons already had hover transitions ✅
  - 5 instances fixed with enhanced hover feedback
- `LessonsAddLessonModal.tsx` - ✅ **COMPLETE** (Oct 26, 2025)
  - **Select dropdown**: Explicit text/bg colors for all options (`text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800`)
  - **Cancel button**: `bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100` with hover transitions
  - 2 instances fixed
- `LessonsCalendarView.tsx` - ✅ **COMPLETE** (Oct 26, 2025)
  - All text colors already had `dark:` variants ✅
  - **Today highlight fix**: Added `.rbc-today` styling
    - Light: `rgba(59, 130, 246, 0.08)` (subtle blue tint, not white)
    - Dark: `rgba(59, 130, 246, 0.15)` (blue tint, not overly bright)
  - 1 color instance + today highlight CSS added
- `LessonsListView.tsx` - ✅ **COMPLETE** (Oct 26, 2025)
  - All text colors already had `dark:` variants ✅
  - 3 instances verified

**🎉 All Lessons Components Complete! (6/6 files - 100%)**
- Total fixes: 20+ instances
- Global placeholder fix (themeSurfaces.css) affects entire app
- All modals have proper hover effects with scale animations
- Calendar today highlight fixed for dark mode
- Dropdown options properly styled in both modes

### Pages (8 files)
- `Schools.tsx` - ~30 instances (highest)
- `Setup.tsx` - ~15 instances
- `Tasks.tsx` - Needs count
- `Lessons.tsx` - Needs count
- `Groups.tsx` - Needs count
- `Materials.tsx` - Needs count
- `Dashboard.tsx` - Needs count
- `Reports.tsx` - Needs count

### Other Components (17 files)
- Material components (4 files)
- Schedule wizard components (3 files)
- Group components (3 files)
- Auth components (2 files)
- UI components (1 file)
- Modal components (2 files)
- Other (2 files)

## Common Problematic Patterns

### 1. Gray Text Without Dark Mode
```tsx
// ❌ BAD - invisible in light mode on glass backgrounds
className="text-gray-500"

// ✅ GOOD - semantic class with dark mode support
className="text-soft-muted"
```

### 2. Empty State Messages
```tsx
// ❌ BAD
<div className="text-center py-8 text-gray-500">

// ✅ GOOD
<div className="text-center py-8 text-soft-muted">
```

### 3. Helper/Hint Text
```tsx
// ❌ BAD
<p className="text-xs text-gray-500 mt-1">

// ✅ GOOD
<p className="text-xs text-soft-muted mt-1">
```

### 4. Interactive Elements
```tsx
// ❌ BAD
className="text-gray-600 hover:text-gray-800"

// ✅ GOOD
className="text-soft hover:text-gray-900 dark:hover:text-white transition-colors"
```

## Semantic Classes Reference

From `src/styles/themeSurfaces.css`:

| Class | Light Mode | Dark Mode | Use Case |
|-------|-----------|-----------|----------|
| `text-soft` | `rgba(15, 23, 42, 0.7)` | `rgba(226, 232, 240, 0.72)` | Secondary text, labels |
| `text-soft-muted` | `rgba(71, 85, 105, 0.6)` | `rgba(203, 213, 225, 0.55)` | Tertiary text, hints |
| Default surface text | `rgba(15, 23, 42, 0.82)` | `rgba(226, 232, 240, 0.92)` | Primary text (inherited) |

## Fix Strategy

### Phase 1: Critical Fixes (User-Facing Modals)
1. ✅ LessonMaterialSelector - COMPLETE
2. LessonsRecordModal
3. RecurringLessonsModal
4. LessonsAddLessonModal
5. MaterialCreateForm

### Phase 2: High-Traffic Pages
6. Schools.tsx (~30 instances)
7. Lessons.tsx
8. Materials.tsx

### Phase 3: Secondary Pages
9. Setup.tsx
10. Tasks.tsx
11. Groups.tsx
12. Dashboard.tsx

### Phase 4: Supporting Components
13-31. Remaining component files

## Testing Checklist Per File

After fixing each file, verify:
- [ ] Light mode: All text visible on glass backgrounds
- [ ] Dark mode: All text visible with proper contrast
- [ ] Hover states work in both modes
- [ ] Empty states legible in both modes
- [ ] Form labels and hints readable in both modes
