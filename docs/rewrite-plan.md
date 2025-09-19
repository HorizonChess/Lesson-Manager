# Rewrite & Feature Rollout Plan

Each phase ends with a checkpoint that references the evolving [Manual Test Plan](manual-test-plan.md). Stick to the order unless blockers arise.

## Phase A - Stabilize & Modularize (Cleanup First)
1. **Inventory & Baseline Tests** *(status: in progress)*
   - Baseline manual checklist lives in `docs/manual-test-plan.md`; attendance, reports, and offline rows still open.
   - Continue capturing playbook updates as pages shift to service-driven data.
2. **Extract Scheduling Utilities** *(status: complete - 2025-09-18)*
   - Scheduling math moved into `src/lib/scheduling/index.ts` (time analysis, distribution helpers).
   - Wizard business logic now resides in `src/hooks/useScheduleWizard.tsx`, reducing component state sprawl.
3. **Component Decomposition** *(status: complete - 2025-09-19)*
   - Schedule wizard UI split into `ScheduleWizardStepContent` plus step/preview panels under `src/components/schedule-wizard` (complete - 2025-09-20).
   - School Overview (`src/pages/Groups.tsx`), Lessons (`src/pages/Lessons.tsx`), and Materials (`src/pages/Materials.tsx`) pages are next for view-layer splits now that services and TypeScript cleanup are in place.
   - Retire the legacy schedule wizard once the new structure is fully verified across the app.
4. **Data Access Consolidation** *(status: complete - 2025-09-18/19)*
   - Service layer created for dashboard, groups, lessons, lesson records, roster, materials, tasks, setup (`src/services/*.ts`).
   - Page components now call `lessonsPage.ts`, `materials.ts`, `groupsPage.ts`, `setupPage.ts`, and `tasksPage.ts` orchestrators plus `lessonsMutations.ts` for writes.

## Phase B - Scheduling Productivity Enhancements
1. **Partner-School Templates**
   - Schema: add `school_templates` table (name, default day/time, group count, metadata).
   - Wizard: template picker + editor; default values hydrate school config.
   - Tests: new template flow, existing baseline wizard paths.
2. **Bulk Roster Import + Period Preferences**
   - CSV/Excel ingestion (reuse xlsx library); allow mapping to groups and extra period flags.
   - Tests: import scenario, verify lessons generated with preferred periods.
3. **Exact-Time Scheduling Mode**
   - Wizard toggle; schedule generation respects explicit times when enabled.
   - Tests: manual scenario covering both snapped and exact modes.
4. **Schedule Audit Log / Undo**
   - Introduce `schedule_batches` table referencing created entity IDs; add UI to roll back the latest batch.
   - Tests: generate schedule, perform undo, confirm data removal only for batch.

## Phase C - Curriculum & Lesson Alignment
1. **Unified Lesson/Material Templates**
   - Redesign material records to support structured lesson-plan fields; allow multiple linked resources.
   - Lesson creation attaches template, auto-fills fields, tracks deviations in lesson record.
   - Tests: create template, attach to lesson, edit post-class.
2. **School-Level Management Overhaul**
   - Rework "School Overview" for per-school controls (shared settings, bulk time updates) and date-based cancellation (calendar day click -> cancel modal).
   - Tests: cancel by date, per-school edit, ensure group-level flows still function.

## Phase D - Visual & UX Refresh
1. **Design System Adoption**
   - Introduce a design tokens layer (colors, spacing, typography) and shared components (buttons, inputs, cards).
   - Apply across core pages incrementally.
   - Tests: UI regression sweep including RTL, dark mode.
2. **Micro-Interactions & Accessibility**
   - Focus states, reduced motion, screen-reader labels, keyboard traps elimination.
   - Tests: axe audits, keyboard-only walkthrough using manual checklist.

## Ongoing
- Update `docs/manual-test-plan.md` at the end of each milestone.
- Log new findings and adjustments in `PROJECT.md` under Progress or Backlog as needed.
- Keep commits scoped per step; run automated checks before handoff.

