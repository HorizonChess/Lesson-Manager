# Rewrite Phase Notes

## Phase A – Step 1: Inventory & Baseline (today)
- Component size snapshot:
  - src/components/ScheduleWizard.tsx ≈ 1,274 lines
  - src/pages/Lessons.tsx ≈ 2,210 lines
  - src/pages/Materials.tsx ≈ 684 lines
- Core scheduling logic lives entirely inside ScheduleWizard.tsx; no shared module yet.
- Supabase schema (001_initial_schema.sql) covers users, schools, subjects, groups, roster_items, lessons, lesson_records, attendance, materials, lesson_materials, tags, material_tags, tasks. No template/undo tables yet.
- Baseline checks:
  - 
pm run lint → fails with legacy violations (unused vars, ny usage) across GroupOverview, Dashboard, Lessons, Tasks, etc.
  - 
pm run build → fails due to the same issues plus type errors in Lessons & Dashboard.
- Manual checklist pending: please run through the **Baseline Flows** in docs/manual-test-plan.md when you have a chance so we have confirmation of current behaviour.

Notes: these failures predate the rewrite; we will chip away at them during Phase A. No functionality was altered in this step.

Baseline manual testing (courtesy of Claude) confirms core flows pass; remaining unchecked: attendance workflow, reports filters, offline cache.
## Phase A – Step 2: Scheduling Utilities Extracted
- Created src/lib/scheduling/index.ts housing nalyzeTimeWindow, calculateGroupDistribution, and uildScheduleDetails (plus shared types/period table).
- ScheduleWizard.tsx now imports these helpers and no longer defines ~400 lines of inline scheduling logic.
- Added 	sconfig.scheduling.json and Node-based unit tests at 	ests/scheduling.test.ts; run with 
px tsc -p tsconfig.scheduling.json && node .tmp/scheduling-tests/tests/scheduling.test.js.
- Tests cover perfect-match detection, partial alignment, extra-period distribution, and slot generation.
- Confirmed tests pass (see output in shell history).
- Next: refactor the wizard into hook + presentational layers (Phase A – Step 3).

Scheduling unit tests (tsconfig.scheduling.json) passing as of 2025-09-18 17:10.
