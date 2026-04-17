# Task 2-a — Dashboard Data Visualization Fixes & Cashflow Forecast

## Summary
Fixed 4 QA-identified issues on the dashboard page (`/dashboard`):

### Changes Made
1. **StatCard truncation fix** — Removed `truncate`, added `text-wrap font-mono tabular-nums leading-snug`, responsive font sizes (`text-lg sm:text-xl lg:text-2xl`)
2. **StatCard visual depth** — Added decorative gradient blob (absolute positioned, blurred radial gradient), enlarged trend badge with better spacing
3. **Chart improvements** — Changed curve type from `monotone` to `natural`, increased stroke width to 2.5, added `ReferenceLine` at y=0 for negative values
4. **Cashflow Forecast section** — New card with 3 color-coded sub-cards (green/orange/blue) showing projected income, expenses, and balance with progress bars

### Files Modified
- `src/app/dashboard/page.tsx` — Targeted edits only

### Imports Added
- `ArrowUpRight`, `ArrowDownRight` from lucide-react
- `ReferenceLine` from recharts

### Status
- ESLint: 0 errors
- Dashboard route: 200 OK
- No new dependencies
