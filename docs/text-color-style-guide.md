# Text Color Style Guide

**Purpose**: Ensure consistent, accessible text visibility in both light and dark modes across all glass morphism surfaces.

## 🎨 Semantic Color System

Our app uses **semantic color classes** defined in `src/styles/themeSurfaces.css` that automatically adapt to light/dark mode.

### Primary Text Classes

#### 1. **Default Surface Text** (Inherited)
```tsx
// On any .surface-* element, text inherits proper color automatically
<div className="surface-modal">
  <p>This text is automatically theme-aware!</p>
</div>
```
- **Light**: `rgba(15, 23, 42, 0.82)` - Dark slate
- **Dark**: `rgba(226, 232, 240, 0.92)` - Light gray
- **Use for**: Primary content, headings, main body text

#### 2. **Secondary Text** - `.text-soft`
```tsx
<p className="text-soft">Secondary information</p>
```
- **Light**: `rgba(15, 23, 42, 0.7)` - Medium dark slate
- **Dark**: `rgba(226, 232, 240, 0.72)` - Medium light gray
- **Use for**: Labels, descriptions, secondary information
- **Contrast ratio**: Meets WCAG AA on glass backgrounds

#### 3. **Tertiary Text** - `.text-soft-muted`
```tsx
<p className="text-soft-muted">Helper text or hints</p>
```
- **Light**: `rgba(71, 85, 105, 0.6)` - Lighter slate
- **Dark**: `rgba(203, 213, 225, 0.55)` - Lighter gray
- **Use for**: Placeholder-like text, timestamps, tertiary information
- **Contrast ratio**: Meets WCAG AA for large text

---

## 🚫 What NOT to Use

### ❌ Hardcoded Gray/Slate Colors
```tsx
// NEVER USE THESE WITHOUT dark: VARIANTS:
className="text-gray-500"
className="text-slate-600"
className="text-gray-400"
```

**Why?** These colors are too light on light backgrounds and too dark on dark backgrounds when used on glass morphism surfaces.

---

## ✅ Replacement Guide

### ⚠️ **CRITICAL RULE: Background Context Matters!**

**Text on layered glass surfaces needs stronger contrast:**

| Background | Text Strategy | Example |
|-----------|--------------|---------|
| **Direct on modal** | Semantic classes work | `text-soft`, `text-soft-muted` |
| **Inside cards on modal** | Use dark explicit colors | `text-slate-800 dark:text-slate-200` |

**Visual test**: If you see gray-on-gray → use slate-800/900 (nearly black) in light mode.

### Common Patterns

#### Text Inside Card Components
```tsx
// ❌ BAD - gray on gray (layered glass = low contrast)
<div className="surface-section-muted">
  <p className="text-gray-500">Description</p>
</div>

// ✅ GOOD - nearly black for clear contrast
<div className="surface-section-muted">
  <h3 className="text-slate-900 dark:text-slate-100">Title</h3>
  <p className="text-slate-800 dark:text-slate-200">Description</p>
  <span className="text-xs text-blue-800 dark:text-blue-200 font-semibold">Accent</span>
</div>
```

#### Empty States
```tsx
// ❌ BAD
<div className="text-center py-8 text-gray-500">
  <p>No items found</p>
</div>

// ✅ GOOD
<div className="text-center py-8 text-soft-muted">
  <p>No items found</p>
</div>
```

#### Form Labels
```tsx
// ❌ BAD
<label className="text-sm text-gray-600">Email</label>

// ✅ GOOD
<label className="text-sm text-soft">Email</label>
```

#### Helper Text / Hints
```tsx
// ❌ BAD
<p className="text-xs text-gray-500 mt-1">Optional field</p>

// ✅ GOOD
<p className="text-xs text-soft-muted mt-1">Optional field</p>
```

#### Interactive Elements (Buttons, Links)
```tsx
// ❌ BAD
<button className="text-gray-600 hover:text-gray-800">
  Cancel
</button>

// ✅ GOOD
<button className="text-soft hover:text-gray-900 dark:hover:text-white transition-colors">
  Cancel
</button>
```

#### Close Buttons
```tsx
// ❌ BAD
<button className="text-gray-500 hover:text-gray-700 text-xl">×</button>

// ✅ GOOD
<button className="text-soft hover:text-gray-900 dark:hover:text-white text-xl transition-colors">
  ×
</button>
```

#### Timestamps / Metadata
```tsx
// ❌ BAD
<span className="text-xs text-gray-500">5 minutes ago</span>

// ✅ GOOD
<span className="text-xs text-soft-muted">5 minutes ago</span>
```

---

## 🎯 When to Use Explicit dark: Variants

For **non-gray neutral colors** and **specific design needs**, use explicit dark: variants:

### Headings
```tsx
<h1 className="text-gray-900 dark:text-gray-100">Page Title</h1>
<h2 className="text-gray-800 dark:text-gray-200">Section Title</h2>
```

### Body Text (outside surfaces)
```tsx
<p className="text-gray-700 dark:text-gray-300">Content text</p>
```

### Accent Colors
```tsx
<a className="text-blue-600 dark:text-blue-400">Link</a>
<span className="text-green-600 dark:text-green-400">Success</span>
<span className="text-red-600 dark:text-red-400">Error</span>
<span className="text-yellow-600 dark:text-yellow-400">Warning</span>
```

### Icon Colors
```tsx
<Icon className="text-blue-500 dark:text-blue-400" />
```

---

## 🧪 Testing Checklist

After changing text colors in any component, verify:

### Light Mode
- [ ] All text visible against white/light glass backgrounds
- [ ] No "washed out" appearance (too light gray)
- [ ] Hover states clearly visible
- [ ] Empty states legible

### Dark Mode
- [ ] All text visible against dark glass backgrounds
- [ ] No "too bright" text causing eye strain
- [ ] Hover states clearly visible
- [ ] Empty states legible

### Contrast
- [ ] Run axe DevTools to check WCAG AA compliance
- [ ] Test on actual devices (not just browser DevTools)
- [ ] Check with browser zoom at 150% and 200%

---

## 📊 Quick Reference Table

| Element Type | Class to Use | Fallback Pattern |
|--------------|--------------|------------------|
| Primary text | (inherit from surface) | `text-gray-900 dark:text-gray-100` |
| Secondary text | `text-soft` | `text-gray-700 dark:text-gray-300` |
| Tertiary text | `text-soft-muted` | `text-gray-600 dark:text-gray-400` |
| Placeholder text | `text-soft-muted` | `text-gray-500 dark:text-gray-400` |
| Helper text | `text-soft-muted` | `text-gray-500 dark:text-gray-400` |
| Empty state | `text-soft-muted` | `text-gray-500 dark:text-gray-400` |
| Interactive (hover) | `text-soft hover:text-gray-900 dark:hover:text-white` | Manual dark: variants |
| Close button | `text-soft hover:text-gray-900 dark:hover:text-white` | Manual dark: variants |
| Link (accent) | `text-blue-600 dark:text-blue-400` | Always use dark: variant |
| Success | `text-green-600 dark:text-green-400` | Always use dark: variant |
| Error | `text-red-600 dark:text-red-400` | Always use dark: variant |
| Warning | `text-yellow-600 dark:text-yellow-400` | Always use dark: variant |

---

## 🔧 Migration Script (Future)

For bulk migration, consider this pattern:

```bash
# Find and replace in a file
sed -i 's/text-gray-500/text-soft-muted/g' file.tsx

# But ALWAYS manually review results!
```

**⚠️ Warning**: Automated replacement may not be appropriate for all cases. Always review changes for context.

---

## 📚 Additional Resources

- Semantic color definitions: `src/styles/themeSurfaces.css` (lines 127-261)
- Glass morphism surfaces: `src/styles/themeSurfaces.css` (lines 1-122)
- Tailwind dark mode docs: https://tailwindcss.com/docs/dark-mode
- WCAG contrast guidelines: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
