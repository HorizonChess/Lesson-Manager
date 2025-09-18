# Manual Test Plan

This checklist evolves with the rewrite. Mark each test after every relevant milestone.

## Baseline Flows
- [x] Auth: login, logout, session persistence
- [x] Dashboard: daily/weekly view renders without errors
- [x] Schedule Wizard: full new-user path (no existing data) completes successfully
- [x] Schedule Wizard: existing data path respects keep/remove choice
- [x] Schedule Wizard: smart analysis renders and navigation footer stays visible on long configurations
- [x] Lessons page: create single lesson, edit, cancel, restore
- [x] Lessons page: recurring generation and cancellation
- [x] Materials library: create/edit/delete material, attach to lesson record
- [ ] Attendance workflow: bulk mark, individual override, notes persist
- [ ] Reports page: attendance / hours / coverage filters operate
- [ ] Offline cache smoke test (airplane mode for cached flows)

## Upcoming Enhancements
- [ ] Partner-school template creation and reuse
- [ ] Bulk roster import with period preferences
- [ ] Exact-time scheduling toggle (no snapping)
- [ ] Lesson template auto-fill into lesson records
- [ ] School-level management updates (date-based cancellations)
- [ ] UI/UX regression sweep (navigation, theming, RTL)

## Regression Guardrails
- [ ] Lint + type checks (npm run lint)
- [ ] Build output (npm run build)
- [ ] Supabase migrations verified (if modified)




