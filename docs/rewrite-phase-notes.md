# Rewrite Phase Notes

## Phase A - Step 1: Inventory & Baseline (today)
- Component size snapshot:
  - src/components/ScheduleWizard.tsx - 1,274 lines
  - src/pages/Lessons.tsx - 2,210 lines
  - src/pages/Materials.tsx - 684 lines
- Core scheduling logic lives entirely inside ScheduleWizard.tsx; no shared module yet.
- Supabase schema (001_initial_schema.sql) covers users, schools, subjects, groups, roster_items, lessons, lesson_records, attendance, materials, lesson_materials, tags, material_tags, tasks. No template/undo tables yet.
- Baseline checks:
  - npm run lint - fails with legacy violations (unused vars, any usage) across GroupOverview, Dashboard, Lessons, Tasks, etc.
  - npm run build - fails due to the same issues plus type errors in Lessons & Dashboard.
- Manual checklist pending: please run through the Baseline Flows in docs/manual-test-plan.md when you have a chance so we have confirmation of current behaviour.

Notes: these failures predate the rewrite; we will chip away at them during Phase A. No functionality was altered in this step.

Baseline manual testing (courtesy of Claude) confirms core flows pass; remaining unchecked: attendance workflow, reports filters, offline cache.

## Phase A - Step 2: Scheduling Utilities Extracted
- Created src/lib/scheduling/index.ts housing analyzeTimeWindow, calculateGroupDistribution, and buildScheduleDetails (plus shared types/period table).
- ScheduleWizard.tsx now imports these helpers and no longer defines ~400 lines of inline scheduling logic.
- Added tsconfig.scheduling.json and Node-based unit tests at tests/scheduling.test.ts; run with npx tsc -p tsconfig.scheduling.json && node .tmp/scheduling-tests/tests/scheduling.test.js.
- Tests cover perfect-match detection, partial alignment, extra-period distribution, and slot generation.
- Confirmed tests pass (see output in shell history).
- Next: refactor the wizard into hook + presentational layers (Phase A - Step 3).

Scheduling unit tests (tsconfig.scheduling.json) passing as of 2025-09-18 17:10.

## Phase A - Step 3: Wizard Hook/View Split
- Completed the hook refactor: src/hooks/useScheduleWizard.tsx now owns all wizard state, navigation, Supabase mutations, and derived helpers such as progressPercent and nextLabel.
- ScheduleWizard.tsx remains responsible for the dialog shell and step layout, consuming the hook for state/actions while keeping the existing renderStepContent JSX intact.
- Hook exposes setter callbacks used by the view (keepExistingData, schoolCount, naming strategy, preview toggles) and memoizes frequently computed values to reduce re-renders.
- Verified type safety with npx tsc -p tsconfig.scheduling.json and reran node .tmp/scheduling-tests/tests/scheduling.test.js; both pass after the refactor.
- Follow-up: consider extracting individual step bodies into presentational components once we are ready to slim down renderStepContent without touching behaviour.
## Phase A - Step 4: Data Access Consolidation
- Added service helpers in src/services/ (schools, subjects, groups, lessons) to centralize Supabase queries.
- useScheduleWizard now depends on the service layer for schedule generation (deletes, inserts, existence checks).
- Introduced src/services/dashboard.ts and refactored src/pages/Dashboard.tsx plus src/components/GroupOverview.tsx to consume the shared helpers for counts, lesson lookups, tasks, materials, attendance, and roster CRUD.
- Lessons data load now uses src/services/lessonsPage.ts (groups/lessons/materials fetch clean-up); remaining mutations still inline pending migration.
- `npx tsc --noEmit` and scheduling CLI checks remain green (npx tsc -p tsconfig.scheduling.json + node .tmp/scheduling-tests/tests/scheduling.test.js).
- Follow-up: migrate remaining high-volume views (Lessons, Materials, Setup) to the service layer and introduce TanStack Query wrappers.

