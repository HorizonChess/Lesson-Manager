# Teacher Scheduler Project

## Product Brief
- **Goal:** Single-teacher scheduler that manages schools, subjects, groups, lessons, lesson records, materials, attendance, tasks, and reports. Mobile-friendly, offline aware, RTL-ready. No calendar conflict detection in scope.
- **Out of scope (MVP):** Calendar conflict detection, external calendar sync, multi-user collaboration.
- **Tech stack:** React + TypeScript + Vite, TanStack Query, light client state (Zustand or RTK), Tailwind. Backend via Supabase (Auth, Postgres, Storage, RLS). Offline cache through IndexedDB. All dates stored in UTC and rendered local.
- **Core entities:** user, school, subject, group, lesson, lesson record, roster item, attendance, material, lesson material join, tag, material tag join, task.
- **Key invariants:**
  - Each group belongs to exactly one school and one subject.
  - Each lesson belongs to one group.
  - Lessons have at most one lesson record (created on first edit).
  - Attendance rows reference roster items from the lesson's group.
  - Materials are reusable references; attaching does not duplicate the asset.
- **Primary flows:**
  - Dashboard (today and week lessons, quick stats, tasks).
  - Start Class / Lesson Record (attendance, covered, planned, homework, attachments, notes, Copy Planned to Covered).
  - School Overview (groups timeline, roster, settings).
  - Materials library (tagged resources attachable to lesson records).
  - Tasks list (filterable, linkable to groups/lessons).
  - Reports (attendance percent, hours taught, coverage list).
- **Non-functional:** Offline-first for 14 days with resilient write-behind sync, RTL support, accessible touch targets, RLS per user, optional device lock.

## Terminology
- **School Overview:** UI tab that lets teachers manage groups, schedules, and roster data. Lives at `src/pages/Groups.tsx` and uses `src/components/GroupOverview.tsx` for the modal view.
- **Lesson Plans:** UI label for the Materials page (`src/pages/Materials.tsx`). Backed by `src/services/materials.ts`.
- **Schedule Wizard:** Entry point at `src/components/ScheduleWizard.tsx`, state handled by `src/hooks/useScheduleWizard.tsx`, scheduling math in `src/lib/scheduling/index.ts`.
- **Service layer:** Data access modules in `src/services/`. Shared CRUD (for example `groups.ts`, `lessons.ts`) power multiple flows. Page orchestrators (`groupsPage.ts`, `lessonsPage.ts`, `materials.ts`, `tasksPage.ts`, `setupPage.ts`) gather the joined data each screen needs. Mutation bundles (for example `lessonsMutations.ts`) centralize write logic for complex flows.

## Current Status (September 2025)
- MVP flows from schools through reports are complete and verified on sample data.
- Smart Schedule Builder wizard (Phase M11) ships with Israeli period mapping, advanced distribution controls, and progressive disclosure.
- Service layer refactor landed: dashboard, lessons, School Overview, materials, tasks, and setup screens now call Supabase through dedicated modules. Calendar mutations, attendance edits, and material attachments run through `lessonsMutations.ts`.
- Scheduling utilities extracted to `src/lib/scheduling/index.ts`; wizard hook now orchestrates generation without inline Supabase calls.
- Manual test plan (`docs/manual-test-plan.md`) covers baseline flows. Attendance, reports, and offline smoke items remain to be re-checked after page decomposition.

## Active Refactor Checklist (Phase A)
- ✅ Schedule wizard UI renders through `ScheduleWizardStepContent` and dedicated panels in `src/components/schedule-wizard/`, while `useScheduleWizard` continues to own the business logic.
- Decompose School Overview (`src/pages/Groups.tsx`), Lessons (`src/pages/Lessons.tsx`), and Materials (`src/pages/Materials.tsx`) into smaller view components that consume the new services.
- Remove the legacy schedule wizard implementation once the new component boundaries are verified throughout the app.
- Keep the build green by maintaining the lesson normalization helpers and watching for TypeScript regressions as we continue refactors.
- Subjects overhaul: subjects should be reusable across schools with checkbox selection in School Overview; picking a school applies the subject to all of its groups with optional per-group overrides. Document UI and data changes before implementation.
- Add unit coverage for scheduling helpers (`src/lib/scheduling/index.ts`) and create smoke tests for page services using Supabase mocks.

## Post-MVP Backlog
- Partner-school templates that pre-fill day and time defaults in the wizard.
- Bulk roster import with initial period preferences.
- Schedule audit log and undo for generated lessons.
- Optional exact-time scheduling mode (bypass period snapping).
- Unified lesson and material templates with auto-fill into lesson records.
- School-level management overhaul with date-based cancellations from the calendar.
- Visual refresh (design tokens, shared UI components, accessibility and micro-interactions).
- Curriculum coverage heatmap, public read-only schedule links, co-teacher roles, calendar sync, smart suggestions for lesson planning.

## Testing & Documentation
- Keep `docs/manual-test-plan.md` updated after each milestone.
- Run `npm run lint`, `npm run build`, and targeted `node --test` suites prior to handoff.
- Record refactor notes in `docs/rewrite-phase-notes.md` and update `docs/rewrite-plan.md` statuses as work closes.

## Historical Snapshot
- Milestones M0 through M11 delivered (project skeleton, auth, schools and subjects CRUD, groups and roster, lessons and scheduling, lesson records, attendance, lesson plans, tasks, dashboard/reports upgrades, Israeli calendar, drag-and-drop enhancements, schedule wizard).
- Detailed play-by-play for earlier milestones remains available in repository history if needed.
