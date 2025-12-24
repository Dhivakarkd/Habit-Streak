# Habit Streak UI Design System

This document outlines the comprehensive design system for the Habit Streak application, including color tokens, typography, component patterns, responsiveness, animations, and dark mode support.

---

## 1. Color System

### Color Tokens (Light Mode)
All colors use HSL format for consistency and dark mode adaptation.

| Token | Value | Usage |
|-------|-------|-------|
| **Primary** | `hsl(266 83% 65%)` | Brand purple - buttons, active states, primary actions |
| **Primary Foreground** | `hsl(0 0% 98%)` | Text on primary backgrounds |
| **Secondary** | `hsl(266 30% 90%)` | Light purple tint - subtle highlights |
| **Secondary Foreground** | `hsl(266 10% 20%)` | Text on secondary backgrounds |
| **Accent** | `hsl(214 83% 65%)` | Interactive blue - hover states, focus rings |
| **Accent Foreground** | `hsl(0 0% 98%)` | Text on accent backgrounds |
| **Destructive** | `hsl(0 84.2% 60.2%)` | Error/danger states |
| **Destructive Foreground** | `hsl(0 0% 98%)` | Text on destructive backgrounds |
| **Muted** | `hsl(266 30% 94%)` | Subtle backgrounds, disabled states |
| **Muted Foreground** | `hsl(266 10% 40%)` | Secondary text |
| **Border** | `hsl(266 20% 88%)` | Component borders |
| **Ring** | `hsl(214 83% 65%)` | Focus rings (accent blue) |

### Color Tokens (Dark Mode)
Dark mode variants automatically provide sufficient contrast:

| Token | Value | Notes |
|-------|-------|-------|
| **Primary** | `hsl(266 83% 75%)` | Lighter purple for visibility |
| **Accent** | `hsl(214 83% 75%)` | Lighter blue for visibility |
| **Background** | `hsl(266 15% 10%)` | Very dark purple |
| **Card** | `hsl(266 15% 12%)` | Slightly lighter than background |

### Semantic Color Mappings

**Status Colors:**
- **Success**: `text-emerald-500 dark:text-emerald-400`
- **Error**: `text-red-500 dark:text-red-400`
- **Warning**: `text-amber-500 dark:text-amber-400`
- **Info**: `text-blue-500 dark:text-blue-400`

**Icon Colors:**
- **Streak**: `text-orange-500 dark:text-orange-400` (Flame icon)
- **Achievement**: `text-purple-500 dark:text-purple-400` (Trophy/badge)
- **Primary**: Uses primary brand color
- **Secondary**: Uses secondary light color

**Challenge Categories:**
- **Fitness**: Orange/Streak color
- **Learning**: Primary purple
- **Wellness**: Blue/Info color
- **Productivity**: Primary purple
- **Creative**: Purple/Achievement color

---

## 2. Typography

### Font Family
- **Primary**: Inter (sans-serif) - Modern, neutral grotesque
- **Fallback**: System sans-serif stack
- **Code**: Monospace

### Font Sizes

| Size | Mobile | Desktop | Usage |
|------|--------|---------|-------|
| **H1** | 24px | 32px | Page titles |
| **H2** | 20px | 28px | Section titles |
| **H3** | 18px | 24px | Subsection titles |
| **Body** | 14px | 16px | Regular text |
| **Small** | 12px | 14px | Secondary text, metadata |
| **Caption** | 11px | 12px | Minimal text, timestamps |

### Font Weights
- **Regular**: 400 - Body text, regular content
- **Medium**: 500 - Emphasized text, labels
- **Semibold**: 600 - Headings, card titles
- **Bold**: 700 - Major headings, CTAs

---

## 3. Spacing System

Uses Tailwind's default spacing (4px units):
- `gap-1`: 4px - Minimal spacing
- `gap-2`: 8px - Compact spacing
- `gap-3`: 12px - Standard spacing
- `gap-4`: 16px - Comfortable spacing
- `gap-6`: 24px - Large spacing
- `gap-8`: 32px - Extra large spacing

### Responsive Spacing
- Mobile: `p-3 md:p-4 lg:p-6` (tighter on small screens)
- Desktop: `p-6 md:p-8` (more breathing room)

---

## 4. Responsive Breakpoints

Mobile-first approach - define mobile styles, layer breakpoints:

| Breakpoint | Size | Device | Usage |
|-----------|------|--------|-------|
| **Default** | 0px+ | Mobile (375px-640px) | Base styles |
| **sm** | 640px | Large mobile | Minor adjustments |
| **md** | 768px | Tablet | Layout shift (2-col grid) |
| **lg** | 1024px | Desktop | Full layout (3-col grid) |
| **xl** | 1280px | Large desktop | Max-width constraints |

### Grid Patterns
```
Mobile:   1 column
Tablet:   2 columns (md:grid-cols-2)
Desktop:  3 columns (lg:grid-cols-3)
Large:    4 columns (xl:grid-cols-4)
```

---

## 5. Touch Targets

All interactive elements must meet minimum touch target size:

| Element | Min Size | Implementation |
|---------|----------|-----------------|
| **Buttons** | 44×44px | `min-h-[44px] min-w-[44px]` |
| **Form Inputs** | 44px height | `h-11 md:h-10` (44px on mobile) |
| **Checkboxes** | 24×24px | Sufficient padding around hit target |
| **Links** | 44×44px | Padding + text combination |

---

## 6. Animation System

### Animation Utilities (in globals.css)

**Fade Animations:**
- `.animate-fade-in` - 300ms fade in
- `.animate-fade-out` - 300ms fade out

**Slide Animations:**
- `.animate-slide-up` - Slide from 10px below
- `.animate-slide-down` - Slide from 10px above
- `.animate-slide-in-left` - Slide from left
- `.animate-slide-in-right` - Slide from right

**Scale Animations:**
- `.animate-scale-in` - Scale from 0.95
- `.animate-scale-out` - Scale to 0.95

**Emphasis Animations:**
- `.animate-pulse-soft` - Gentle 2s pulse
- `.animate-bounce-soft` - Soft bounce motion

**Effects:**
- `.animate-shimmer` - Skeleton loading shimmer
- `.transition-smooth` - All properties, 300ms
- `.transition-smooth-fast` - All properties, 150ms
- `.hover-lift` - Lift on hover with shadow
- `.hover-scale` - Scale on hover (105%)

### Framer Motion Components

**Standard Entry Animation:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

**Card Hover Animation:**
```tsx
<motion.div whileHover={{ y: -4 }}>
  <Card>...</Card>
</motion.div>
```

**Button Interaction:**
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Click Me
</motion.button>
```

### Reduced Motion Support
For accessibility, all animations disable when `prefers-reduced-motion: reduce`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Component Patterns

### Card Component
Standard structure with consistent styling:

```tsx
<Card className="shadow-sm hover:shadow-md transition-shadow">
  <CardHeader className="pb-4">
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>
```

**Responsive:**
- Mobile: `p-3 md:p-4` (padding)
- Shadows: `shadow-sm hover:shadow-md`
- Borders: `border border-border/50`

### Button Variants
All buttons use Tailwind + shadcn/ui Button component:

| Variant | Usage |
|---------|-------|
| **default** | Primary actions, form submit |
| **secondary** | Secondary actions, less important |
| **outline** | Bordered alternative style |
| **destructive** | Dangerous actions (delete, cancel) |
| **ghost** | Minimal background, icon buttons |

**Sizes:**
- `size="sm"` - Compact (32px)
- `size="md"` - Default (40px)
- `size="lg"` - Large (48px)

### Form Inputs
- **Min Height**: 44px on mobile, 40px+ on desktop
- **Padding**: `px-3 py-2`
- **Focus**: Blue ring via `ring-ring`
- **Placeholder**: `placeholder-muted-foreground`

### Icon Usage

**Icon Config System** (`src/lib/icon-config.ts`):
```tsx
import { getIconColor, getIconSize } from '@/lib/icon-config';

// Usage
<Icon className={`${getIconColor('success')} w-6 h-6`} />

// Or with responsive sizing
<Icon className={`${getIconColor('primary')} w-5 h-5 md:w-6 md:h-6`} />
```

**Standard Icon Sizes:**
- Mobile: 20px (w-5 h-5)
- Desktop: 24px (w-6 h-6)
- Large: 32px (w-8 h-8)

---

## 8. Dark Mode

### Implementation
Dark mode uses CSS class strategy (Tailwind default):
```html
<html class="dark"><!-- Dark mode enabled --></html>
```

### Dark Mode Variables
All colors automatically adjust when `.dark` class present. CSS variable prefixes handle this:

```css
:root {
  --primary: 266 83% 65%; /* Light mode */
}

.dark {
  --primary: 266 83% 75%; /* Dark mode - lighter */
}
```

### Testing Dark Mode
1. Toggle in browser DevTools (Emulate CSS media feature)
2. Set `prefers-color-scheme: dark`
3. Use browser dark mode setting
4. System preference detection

### Dark Mode Checklist
- [ ] All text meets WCAG AA contrast (4.5:1 minimum)
- [ ] Chart colors visible in dark mode
- [ ] Icons have appropriate dark mode colors
- [ ] Borders visible and subtle
- [ ] Backgrounds not too dark (eye strain)
- [ ] Images readable (no dark overlay needed)

---

## 9. Accessibility

### Color Contrast
- **Normal Text**: Minimum 4.5:1 ratio (WCAG AA)
- **Large Text**: Minimum 3:1 ratio
- **Graphics**: Minimum 3:1 ratio

### Touch Targets
- Minimum 44×44px for all interactive elements
- Sufficient spacing between touch targets (8px minimum)

### Typography
- Max line length: 80 characters (readability)
- Line height: 1.5 (reading comfort)
- No text smaller than 12px without justification

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Focus indicators must be visible (blue ring)
- Tab order must be logical (left-to-right, top-to-bottom)

### Screen Readers
- Use semantic HTML (buttons, links, form controls)
- Add `aria-label` for icon-only buttons
- Use `aria-disabled` for disabled states
- Provide `alt` text for all images

---

## 10. Component Library

### Built-in UI Components
Located in `src/components/ui/`:

**Navigation:**
- `sidebar.tsx`
- `menubar.tsx`
- `tabs.tsx`
- `collapsible.tsx`

**Forms:**
- `input.tsx`
- `label.tsx`
- `form.tsx`
- `checkbox.tsx`
- `radio-group.tsx`
- `select.tsx`
- `textarea.tsx`
- `switch.tsx`

**Layout:**
- `card.tsx`
- `separator.tsx`
- `scroll-area.tsx`

**Feedback:**
- `alert.tsx`
- `alert-dialog.tsx`
- `toast.tsx`
- `toaster.tsx`
- `tooltip.tsx`

**Modals:**
- `dialog.tsx`
- `popover.tsx`
- `dropdown-menu.tsx`
- `sheet.tsx`

**Data Display:**
- `table.tsx`
- `badge.tsx`
- `progress.tsx`
- `progress-bar.tsx`
- `skeleton.tsx`
- `carousel.tsx`
- `chart.tsx`

### Custom Components
Located in `src/components/`:

**Edge Cases:**
- `empty-state.tsx` - Reusable empty state with icon & action
- `loading-skeleton.tsx` - Animated skeleton loaders
- `error-state.tsx` - Error display with retry action
- `stat-card.tsx` - Metric display card with trends

**Feature Components:**
- `challenge-card.tsx` - Challenge display card
- `streak-display.tsx` - Streak metrics display
- `daily-checkin.tsx` - Daily check-in interface
- `leaderboard.tsx` - Leaderboard ranking display
- `header.tsx` - Mobile-responsive header
- `members-list.tsx` - Challenge members display

---

## 11. Mobile-First Development

### Approach
1. **Start with mobile** - Base styles for 375px width
2. **Layer up** - Add `md:`, `lg:`, `xl:` variants for larger screens
3. **Test responsive** - Verify at 375px, 768px, 1024px, 1280px

### Common Patterns

**Grid Responsiveness:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
```

**Font Scaling:**
```tsx
<h1 className="text-xl md:text-2xl lg:text-3xl font-bold" />
<p className="text-sm md:text-base lg:text-lg" />
```

**Padding Scaling:**
```tsx
<div className="p-3 md:p-4 lg:p-6" />
```

**Button Sizing:**
```tsx
<Button className="w-full md:w-auto min-h-[44px]" />
```

---

## 12. Dark Mode Chart Colors

For data visualization, chart colors are adjusted for dark mode visibility:

| Chart | Light | Dark |
|-------|-------|------|
| **1** | Orange (12°) | Blue (220°) |
| **2** | Teal (173°) | Green (160°) |
| **3** | Dark Blue (197°) | Orange (30°) |
| **4** | Yellow (43°) | Purple (280°) |
| **5** | Coral (27°) | Pink (340°) |

---

## 13. Best Practices

### DO:
✅ Use design tokens for colors (no hardcoded hex values)
✅ Start mobile-first, enhance for larger screens
✅ Test animations with `prefers-reduced-motion`
✅ Provide sufficient spacing around interactive elements
✅ Use semantic HTML and ARIA attributes
✅ Optimize images for mobile (srcset, lazy loading)
✅ Test in both light and dark modes
✅ Use Framer Motion for smooth, delightful interactions
✅ Maintain consistent typography hierarchy
✅ Ensure all colors meet WCAG AA contrast standards

### DON'T:
❌ Use hardcoded colors (use design tokens instead)
❌ Create touch targets smaller than 44×44px
❌ Assume keyboard users aren't present
❌ Skip testing dark mode
❌ Rely solely on color to convey information
❌ Use text smaller than 12px without justification
❌ Create animations longer than 300ms (feels sluggish)
❌ Forget `aria-label` for icon-only buttons
❌ Leave focus indicators invisible
❌ Forget to test at actual mobile resolutions

---

## 14. Development Workflow

### Adding a New Component
1. **Create** UI component in `src/components/ui/`
2. **Export** from index file if needed
3. **Add** responsive variants (mobile/desktop)
4. **Test** in light and dark modes
5. **Document** props and usage

### Updating Styling
1. Use Tailwind classes (no inline styles)
2. Add responsive prefixes (`md:`, `lg:`)
3. Check dark mode appearance
4. Verify contrast ratios
5. Test animations reduce on `prefers-reduced-motion`

### Testing Checklist
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1024px+ width)
- [ ] Light mode
- [ ] Dark mode
- [ ] Keyboard navigation
- [ ] Screen reader
- [ ] Touch targets (44px minimum)
- [ ] Animation performance
- [ ] Print view (if applicable)

---

## 15. Resources & References

- **Tailwind Docs**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Framer Motion**: https://www.framer.com/motion/
- **Radix UI**: https://www.radix-ui.com
- **Web Accessibility (WCAG)**: https://www.w3.org/WAI/WCAG21/quickref/
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Responsive Design Testing**: https://responsivedesignchecker.com

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2024 | Initial design system documentation |

---

**Last Updated**: December 24, 2024
**Maintained By**: Design & Engineering Team
**Status**: Active & Evolving
