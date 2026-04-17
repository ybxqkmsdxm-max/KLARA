# Task 2-c: CSS/UX Fixes — Dashboard Layout & Sub-Pages

## Summary
Applied targeted CSS and UX improvements across the dashboard layout, global styles, and sub-pages to enhance visual polish and interaction feedback.

## Changes Made

### Part 1: Dashboard Layout (`src/app/dashboard/layout.tsx`)

1. **Header Enhancement**: Added subtle gradient overlay (`before:bg-gradient-to-r before:from-[#00D4AA]/[0.02]`) and bottom shadow (`shadow-[0_1px_3px_rgba(0,0,0,0.05)]`)

2. **Sidebar Nav Items**: 
   - Changed height from `h-10` to `h-11` for better touch targets
   - Added `duration-150` for snappier transitions
   - Added right border indicator for active state (symmetric left + right accent bars)

3. **Mobile Bottom Nav**:
   - Widened active indicator from `w-8` to `w-12`
   - Added `bg-[#00D4AA]/5` background pill + `rounded-xl mx-1` for active state
   - Kept `scale-110` on active icons

4. **Mobile Sidebar Sheet**: Wrapped NavContent in `<div className="px-2">` for padding

### Part 2: Global CSS (`src/app/globals.css`)

1. **Selection Color**: `::selection` with `#00D4AA30` background and `#1A1A2E` text
2. **Dark Mode Scrollbar**: `.dark ::-webkit-scrollbar-thumb` with `#374151` / `#4B5563` hover
3. **Mobile Tap Highlight**: Added `-webkit-tap-highlight-color: transparent` in `@layer base` `*` selector

### Part 3: Sub-Pages

- **depenses/page.tsx**: Added `data-[state=active]:bg-[#1A1A2E] data-[state=active]:text-white` to tab triggers; changed category chips from `rounded-lg` to `rounded-full`
- **devis/page.tsx**: Enhanced card hover with `hover:border-[#00D4AA]/20 active:scale-[0.98] transition-all duration-200`
- **rapports/page.tsx**: Reviewed — already has comprehensive content with KPIs, charts, tables, animations. No changes needed.
- **factures/page.tsx**: Reviewed — already has proper `bg-[#1A1A2E] text-white` active tabs and `hover:bg-[#00D4AA]/5 hover:border-l-[#00D4AA]` table rows. No changes needed.

## Verification
- ESLint: 0 errors, 0 warnings
- Dev server: All routes compiling successfully (200)
- No new dependencies added
