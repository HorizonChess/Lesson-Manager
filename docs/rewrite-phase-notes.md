# Phase Notes

## 2025-09-18 - Service Layer Sweep
- Centralized Supabase access for dashboard (`src/services/dashboard.ts`), groups (`src/services/groups.ts`, `src/services/groups.view.ts`), roster (`src/services/roster.ts`), lessons (`src/services/lessons.ts`, `src/services/lessonRecords.ts`), and subjects/schools (`src/services/subjects.ts`, `src/services/schools.ts`).
- Added dedicated page orchestrators: `src/services/lessonsPage.ts`, `src/services/materials.ts`, `src/services/groupsPage.ts`, `src/services/setupPage.ts`, and `src/services/tasksPage.ts` to decouple data retrieval and mutation from React components.
- Split wizard orchestration into `src/hooks/useScheduleWizard.tsx` with scheduling math in `src/lib/scheduling/index.ts`; UI now consumes the hook instead of inline business logic.
- Prepared mutation boundaries for calendar workflows by staging `src/services/lessonsMutations.ts` and extracting shared helpers for lesson records and attendance.

## 2025-09-19 - Lessons + Tasks Mutations
- Lessons calendar routes all CRUD, attendance, and material attachment flows through `src/services/lessonsMutations.ts`, keeping `src/pages/Lessons.tsx` focused on presentation and state.
- Tasks page now loads and persists data solely via `src/services/tasksPage.ts`, simplifying Supabase wiring and aligning with the new service pattern.

## 2025-09-19 (afternoon) - Wizard View Split & TypeScript Cleanup
- Extracted the schedule wizard UI into `ScheduleWizardStepContent` plus view-specific panels under `src/components/schedule-wizard/`, keeping the hook + services pattern intact.
- Normalized lesson data handling and resolved all outstanding TypeScript errors (Lessons, Schools, Setup, Tasks, dashboard services), restoring a clean `npm run build`.
- Added normalization helpers so calendar views receive consistent lesson/group metadata after service refactors.

## Follow-ups
- Continue decomposing `src/pages/Lessons.tsx`, `src/pages/Groups.tsx` (School Overview), and `src/pages/Materials.tsx` into view components now that services own the data layer.
- Remove the legacy schedule wizard implementation once the new flow is fully exercised across the app.
- Add unit coverage for `src/lib/scheduling/index.ts` edge cases and begin smoke tests for the new service modules (mocks for Supabase operations).
