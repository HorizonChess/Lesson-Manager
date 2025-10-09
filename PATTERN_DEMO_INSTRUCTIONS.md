# How to Preview Background Patterns

## Quick Preview Setup

To see all the background patterns in action, add the showcase to your Dashboard temporarily:

1. **Open** `src/pages/Dashboard.tsx`

2. **Add import** at the top (after other imports):
   ```tsx
   import { BackgroundPatternShowcase } from '../components/BackgroundPatternShowcase'
   ```

3. **Add the showcase** inside the main div, before or after existing content:
   ```tsx
   {/* Temporary - Background Pattern Preview */}
   <BackgroundPatternShowcase />
   ```

4. **Save and view** your Dashboard page to see all patterns!

5. **When done testing**, remove the showcase component from Dashboard

## Example Location in Dashboard.tsx

Add it right after the opening `<div className="space-y-6">` tag:

```tsx
export function Dashboard() {
  // ... existing code ...

  return (
    <div className="space-y-6">
      {/* TEMPORARY: Background Pattern Showcase */}
      <BackgroundPatternShowcase />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        // ... rest of Dashboard
```

## Current Background

The app is currently using: **`bg-gradient-enhanced`**

This is a subtle gradient with radial accents - perfect for a professional look!

## Try These Popular Combos

### For Education/Teaching Apps (Current Use Case)
- ✅ `bg-gradient-enhanced` - Clean, professional (current)
- ✅ `bg-pattern-dots` - Organized, structured
- ✅ `bg-pattern-grid` - Academic, precise

### For Modern/Tech Feel
- `bg-pattern-circuit` - Digital, connected
- `bg-pattern-hexagon` - Geometric, modern

### For Calm/Minimal
- `bg-pattern-noise` - Refined, subtle
- `bg-pattern-waves` - Peaceful, flowing

## Switching Backgrounds

Once you've chosen your favorite:

1. Open `src/components/Layout.tsx`
2. Go to line 63
3. Find: `className="min-h-screen bg-gradient-enhanced ...`
4. Replace `bg-gradient-enhanced` with your chosen pattern
5. Save!

That's it! The change applies app-wide immediately.
