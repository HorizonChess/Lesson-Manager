# Teacher Scheduler Project

## Product Brief
- **Goal:** Single-teacher scheduler that manages schools, subjects, groups, lessons, schedule, lesson records, materials, attendance, tasks, and reports. Mobile-friendly, offline aware, RTL-ready. No calendar conflict detection in scope.
- **Out of scope (MVP):** Calendar conflict detection, external calendar sync, multi-user collaboration.
- **Tech stack:** React + TypeScript + Vite, TanStack Query, light client state (Zustand or RTK), Tailwind. Backend via Supabase (Auth, Postgres, Storage, RLS). Offline cache through IndexedDB. All dates stored in UTC and rendered local.
- **Core entities:** user, school, subject, group, lesson, lesson record, roster item, attendance, material, lesson material join, tag, material tag join, task, wage_setting, wage_exception.
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
  - Reports (attendance percent, hours taught, coverage list, wage tracking).
  - Wage Management (default hourly rate, per-school/per-group rate overrides, academic hour calculation, salary projections).
- **Non-functional:** Offline-first for 14 days with resilient write-behind sync, RTL support, accessible touch targets, RLS per user, optional device lock.

## Terminology
- **School Overview:** UI tab that lets teachers manage groups, schedules, and roster data. Lives at `src/pages/Schools.tsx` and uses `src/components/GroupOverview.tsx` for the modal view.
- **Lesson Plans:** UI label for the Materials page (`src/pages/Materials.tsx`). Backed by `src/services/materials.ts`.
- **Schedule Wizard:** Entry point at `src/components/ScheduleWizard.tsx`, state handled by `src/hooks/useScheduleWizard.tsx`, scheduling math in `src/lib/scheduling/index.ts`.
- **Service layer:** Data access modules in `src/services/`. Shared CRUD (for example `groups.ts`, `lessons.ts`) power multiple flows. Page orchestrators (`groupsPage.ts`, `lessonsPage.ts`, `materials.ts`, `tasksPage.ts`, `setupPage.ts`) gather the joined data each screen needs. Mutation bundles (for example `lessonsMutations.ts`) centralize write logic for complex flows.

## Architecture Rules & Patterns

### Component Architecture
Following our refactoring project, the application follows strict component separation patterns:

#### Pages Layer (`src/pages/`)
- **Data Orchestration Only**: Pages should only handle data fetching, state management, and error handling
- **No Direct UI Logic**: Pages pass data down to components and handle callbacks
- **Service Layer Usage**: ALWAYS use service functions instead of direct Supabase calls
- **Example**: `Schools.tsx` fetches global subjects, school data, and orchestrates the data flow to `GlobalSubjectsSection` and `SchoolSubjectAssignment` components

#### Components Layer (`src/components/`)
- **UI Logic & Rendering**: Components handle all presentation logic and user interactions
- **Props-Based Architecture**: Receive data and callbacks through props, no direct data fetching
- **Single Responsibility**: Each component has one clear purpose (e.g., `GlobalSubjectsSection` only handles global subject CRUD UI)
- **Reusable**: Components should be reusable across different pages when possible

#### Services Layer (`src/services/`)
- **All Supabase Calls**: Only service functions should make direct database calls
- **Type Safety**: Functions should have proper TypeScript return types matching database schemas
- **Error Handling**: Services throw errors that pages can catch and display appropriately
- **Separation**:
  - CRUD services (e.g., `globalSubjects.ts`) for basic operations
  - Page orchestrators (e.g., `groupsPage.ts`) for complex joined data
  - Mutation bundles (e.g., `lessonsMutations.ts`) for complex write operations

### When to Create New Components
Create a new component when:
1. **File Size**: A page/component exceeds ~200-300 lines
2. **Repeated UI Patterns**: The same UI pattern appears in multiple places
3. **Clear Responsibility**: You can identify a distinct UI responsibility (forms, lists, modals, etc.)
4. **Testing**: The functionality would benefit from isolated testing

### Anti-Patterns to Avoid
- **No Direct Supabase in Pages**: Pages should never import `supabase` directly
- **No Bloated Components**: Avoid creating massive components with multiple responsibilities
- **No Props Drilling**: Use context or component composition instead of passing props through many levels
- **No Mixed Concerns**: Don't mix data fetching with presentation logic in the same component

### Migration Examples
- **Before**: 800-line `Lessons.tsx` with embedded modals and direct Supabase calls
- **After**: Clean `Lessons.tsx` orchestrator + extracted `LessonsRecordModal`, `RecurringLessonsModal` components using service layer

### Text Color & Visibility Guidelines

**Critical**: All text must be visible in both light and dark modes on glass morphism surfaces.

#### Semantic Color Classes (from `themeSurfaces.css`)

Use these **theme-aware** classes instead of hardcoded gray/slate colors:

| Class | Light Mode | Dark Mode | Use Case |
|-------|------------|-----------|----------|
| `text-soft` | `rgba(15, 23, 42, 0.7)` | `rgba(226, 232, 240, 0.72)` | Secondary text, labels, descriptions |
| `text-soft-muted` | `rgba(71, 85, 105, 0.6)` | `rgba(203, 213, 225, 0.55)` | Tertiary text, hints, placeholders |
| (surface inherit) | `rgba(15, 23, 42, 0.82)` | `rgba(226, 232, 240, 0.92)` | Primary text (auto-inherited on `.surface-*` elements) |

#### Common Patterns

```tsx
// ❌ DON'T: Hardcoded colors without dark mode
<p className="text-gray-500">Description</p>

// ✅ DO: Use semantic classes
<p className="text-soft-muted">Description</p>

// ✅ DO: Add dark: variants for specific needs
<h1 className="text-gray-900 dark:text-gray-100">Title</h1>

// ✅ DO: Accent colors always need dark: variants
<a className="text-blue-600 dark:text-blue-400">Link</a>
```

#### Replacement Guide

- **Empty states**: `text-gray-500` → `text-soft-muted`
- **Helper text**: `text-gray-500` → `text-soft-muted`
- **Labels**: `text-gray-600` → `text-soft`
- **Interactive hover**: `text-gray-600 hover:text-gray-800` → `text-soft hover:text-gray-900 dark:hover:text-white transition-colors`
- **Close buttons**: `text-gray-500 hover:text-gray-700` → `text-soft hover:text-gray-900 dark:hover:text-white`

**Full Style Guide**: See [`docs/text-color-style-guide.md`](text-color-style-guide.md) for comprehensive examples and testing checklist.

**Audit Report**: See [`docs/text-color-audit.md`](text-color-audit.md) for current status of text color fixes (202 instances across 31 files).

## Current Status (October 26, 2025)

### Project Health
✅ **MVP Complete & Production-Ready**
- All core flows (schools → subjects → groups → lessons → attendance → reports) fully functional
- Service layer architecture fully implemented and validated
- Glass morphism UI with dark mode, animations, mobile-responsive
- Performance optimized (80-95% improvements in Oct 26 update)

### Code Statistics (Validated Oct 26, 2025)
**Pages**: 8 files (1443-1455 lines each for Schools/Lessons)
- [Dashboard.tsx](src/pages/Dashboard.tsx), [Schools.tsx](src/pages/Schools.tsx), [Lessons.tsx](src/pages/Lessons.tsx), [Materials.tsx](src/pages/Materials.tsx), [Tasks.tsx](src/pages/Tasks.tsx), [Reports.tsx](src/pages/Reports.tsx), [Setup.tsx](src/pages/Setup.tsx), [Groups.tsx](src/pages/Groups.tsx)

**Components**: 36 files organized by domain
- `/ui` (8): Button, Input, Card, Badge, Select, Textarea, Switch, Label
- `/lessons` (6): CalendarView, ListView, RecordModal (564 lines), RecurringModal, AddLessonModal, MaterialSelector
- `/materials` (4): Header, Grid, Filters, CreateForm, TagManagement
- `/groups` (4): GroupOverview, SummaryCard, SummaryList, FilterBar
- `/schedule-wizard` (3): ScheduleWizard, StepContent, steps/*
- Modal.tsx, BackgroundPatternModal, ManageWagesModal, auth components

**Services**: 15 files (full service layer coverage)
- Page orchestrators: `lessonsPage.ts`, `materials.ts`, `groupsPage.ts`, `setupPage.ts`, `tasksPage.ts`, `dashboard.ts`
- CRUD services: `schools.ts`, `subjects.ts`, `groups.ts`, `lessons.ts`, `lessonRecords.ts`, `roster.ts`
- Mutations: `lessonsMutations.ts`
- Utilities: `israeliCalendar.ts`, `groups.view.ts`

**Architecture Compliance**: ⚠️ ~90% (Lessons.tsx needs service layer refactoring)
- **Lessons.tsx violations**: 6 direct supabase calls bypassing service layer
  - Line 292: `generateRecurringLessons()` - bulk insert with join
  - Line 628: `removeMaterial()` - delete from lesson_materials
  - Line 933: `updateLessonTime()` - update lesson times
  - Line 960: `moveLessonToNewTime()` - update with join select
  - Line 1113: `handleDeleteRecurringPattern()` - bulk delete
  - Line 1180: `bulkUpdateRecurringLessons()` - bulk update in loop
- **7 other pages**: Fully compliant with service layer ✅
- **Component extraction**: Complete ✅

### Recent Milestones
- **Oct 26 (PM)**: Text color & visibility fixes - All lessons components dark/light mode compliant
  - Fixed 20+ hardcoded color instances across 6 lessons components
  - Global placeholder fix (themeSurfaces.css) - 85% opacity for better light mode visibility
  - Dropdown options styling - explicit text/bg colors for select elements
  - Calendar today highlight - subtle blue tint instead of white in dark mode
  - Enhanced hover effects - scale animations on close buttons
  - See [text-color-audit.md](text-color-audit.md) and [text-color-style-guide.md](text-color-style-guide.md)
- **Oct 26 (AM)**: Lessons modal performance - modal opens 80% faster, typing lag 95% reduced ([lessons-performance-fixes.md](lessons-performance-fixes.md))
- **Oct 5**: Lessons UI modernization - animations, borders, list view optimization
- **Oct 3-4**: Schools page complete rebuild - search, animations, toast notifications, 1443 lines
- **Sept-Oct**: Subjects architecture - three migrations to perfect global subjects pattern
- **Sept 20**: Lessons decomposition complete - all modals extracted

### Known Issues & Cleanup
⚠️ **Documentation**:
- README.md outdated (shows M2/M3 status from early 2025, needs October 2025 update)
- Manual test plan incomplete - attendance, reports, offline tests pending

ℹ️ **Architecture Debt**:
- **Lessons.tsx**: 6 functions need migration to service layer
  - `generateRecurringLessons()` → move to `lessonsMutations.ts`
  - `removeMaterial()` → already have `detachLessonMaterial()` in mutations, use that instead
  - `updateLessonTime()` → move to `lessonsMutations.ts`
  - `moveLessonToNewTime()` → move to `lessonsMutations.ts`
  - `handleDeleteRecurringPattern()` → move to `lessonsMutations.ts` as `deleteRecurringPattern()`
  - `bulkUpdateRecurringLessons()` → move to `lessonsMutations.ts` as `updateRecurringPattern()`
- **Reports.tsx**: Needs service layer audit

📝 **Pending Work**:
- Complete manual test plan validation (attendance workflows, reports filters, offline mode)
- Unit tests for scheduling helpers (`src/lib/scheduling/index.ts`)
- Smoke tests for page services with Supabase mocks

### Global Subjects Implementation (Sept-Oct 2025)
- **Sept 30, 2025**: Subjects transformed from school-specific to global with `school_subjects` junction table
- **Oct 1, 2025**: Architecture simplified - added `user_id` to subjects, following Materials/Tags pattern (Migration 005)
- **Oct 3, 2025**: Architecture corrected - restored `school_subjects` junction table for proper attribution (Migration 006). Subjects work like tags with school-based attribution via junction table, matching Materials/Tags pattern exactly.
- See `docs/subjects-overhaul.md` for complete implementation details

### Schools.tsx Complete Rebuild (Sept-Oct 2025)
- **Sept 30, 2025**: Successfully refactored 1609-line Schools.tsx to follow architecture rules
- **Oct 1, 2025**: Complete rebuild from scratch (~1000 lines) following proper component architecture
- All direct Supabase calls replaced with service layer functions
- All CRUD operations (schools, subjects, groups, roster items) use `groupsPage.ts` service functions
- Card-based hierarchical UI with color-coded levels (blue/purple/orange)
- Collapsible interface with visual hierarchy icons

### Lessons Page UI Modernization (Oct 5, 2025)
- **Visual Consistency**: Unified border colors and weights across calendar (all 1px, consistent rgba values)
- **Border Alignment Fix**: Perfect alignment between header and body using `::before` pseudo-elements
- **Button Styling**: Updated to match Schools page using shadcn Button component
- **Animations**: Implemented framer-motion stagger animations matching Schools overview
- **View Transitions**: Added loading spinner during Calendar ↔ List view switch
- **List View**: Sequential stagger animations for day groups (100ms intervals)
- **Calendar Events**: Fixed layout - removed duplicate timestamp, school name top-right

### Glass Morphism Design System (October 2025)
- **Complete UI Overhaul**: Introduced `src/styles/themeSurfaces.css` with comprehensive glass morphism primitives
- **Surface Classes**: `surface-panel`, `surface-modal`, `surface-toolbar`, `surface-input`, `surface-chip`, `surface-body` with consistent backdrop-filter and blur effects
- **Text Tokens**: `text-soft`, `text-soft-muted` for theme-responsive typography
- **Dark Mode Support**: Full light/dark theme with opacity adjustments and proper color inheritance
- **Background Patterns**: Asset-based backgrounds (`bg-asset-wave`, `bg-asset-pattern`, `bg-asset-abstract`) with BackgroundPatternModal for user selection
- **Reusable Modal Component**: `src/components/Modal.tsx` with framer-motion animations, proper focus management, and accessibility

### Wage Tracking System (October 2025)
- **ManageWagesModal**: Full wage configuration UI with default hourly rate and currency selection
- **Rate Exceptions**: Per-school and per-group hourly rate overrides for flexible compensation modeling
- **Academic Hours**: Smart calculation (30-60min = 1hr, 61-110min = 2hr, pattern continues) in Reports page
- **Salary Reports**: Hours taught breakdown by school/subject/group with expected salary calculations
- **Database Schema**: `wage_settings` table (user_id, default_hourly_rate, currency) and `wage_exceptions` table (school_id, group_id, hourly_rate)

## Active Refactor Checklist (Phase A)
- [done] Schedule wizard UI renders through `ScheduleWizardStepContent` plus panels in `src/components/schedule-wizard/`, while `useScheduleWizard` keeps the business logic (complete).
- [done] School Overview and Materials pages now delegate view rendering to components in `src/components/`, leaving pages focused on data orchestration.
- [COMPLETE] Lessons page decomposition progress:
  - ✅ `LessonMaterialSelector` - extracted and working
  - ✅ `LessonsAddLessonModal` - extracted and working (calendar slot selection, vacation validation)
  - ✅ `RecurringLessonsModal` - **FULLY FIXED & WORKING** (Logic corrected: uses form timeslots instead of requiring database timeslots, Playwright confirmed lesson creation)
  - ✅ `LessonsRecordModal` - **FULLY EXTRACTED & WORKING** (~435 lines extracted, attendance/editing/materials functionality maintained)
- **Phase A Complete**: All Lessons page components successfully extracted with proper TypeScript interfaces and service integration.
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

---

## Historical Documentation Archive

This section consolidates detailed implementation notes from docs/*.md files for reference. For active testing and planning, see the Current Status section above.

### Manual Testing Checklist

**Baseline Flows** (as of Oct 2025):
- ✅ Auth: login, logout, session persistence
- ✅ Dashboard: daily/weekly view renders without errors
- ✅ Schedule Wizard: full new-user path (no existing data) completes successfully
- ✅ Schedule Wizard: existing data path respects keep/remove choice
- ✅ Schedule Wizard: smart analysis renders and navigation footer stays visible on long configurations
- ✅ Lessons page: create single lesson, edit, cancel, restore
- ✅ Lessons page: recurring generation and cancellation
- ✅ Materials library: create/edit/delete material, attach to lesson record
- ⏳ Attendance workflow: bulk mark, individual override, notes persist
- ⏳ Reports page: attendance / hours / coverage filters operate
- ⏳ Offline cache smoke test (airplane mode for cached flows)

**Regression Guardrails**:
- Run `npm run lint`, `npm run build` before handoff
- Verify Supabase migrations if modified
- Check TypeScript compilation

### Refactor Timeline (Phase A - Complete)

**Sept 18, 2025 - Service Layer Sweep**:
- Centralized Supabase access for all pages (dashboard, groups, roster, lessons, subjects, schools)
- Created page orchestrators: `lessonsPage.ts`, `materials.ts`, `groupsPage.ts`, `setupPage.ts`, `tasksPage.ts`
- Split wizard orchestration into `useScheduleWizard` hook with math in `src/lib/scheduling/index.ts`
- Staged `lessonsMutations.ts` for calendar workflows

**Sept 19, 2025 - Mutations & View Splits**:
- Lessons calendar routes all CRUD through `lessonsMutations.ts`
- Tasks page uses `tasksPage.ts` service
- Extracted schedule wizard UI into `ScheduleWizardStepContent` + view panels
- Lifted calendar/list views into `LessonsCalendarView.tsx` and `LessonsListView.tsx`
- Normalized lesson data handling, resolved all TypeScript errors

**Sept 19, 2025 (evening) - School Overview & Materials Decomposition**:
- Extracted School Overview filters, summary grid, creation modal into `src/components/groups/`
- Materials library now uses dedicated components (`MaterialsHeader`, `MaterialsFilters`, `TagManagementPanel`, etc.)

**Sept 20, 2025 - Lessons Page Decomposition**:
- ✅ Extracted `LessonMaterialSelector` - clean material attachment UI
- ✅ Extracted `LessonsAddLessonModal` - calendar slot selection with validation
- ✅ Fixed `RecurringLessonsModal` - corrected logic to use form timeslots instead of database timeslots (Playwright confirmed)
- ✅ Extracted `LessonsRecordModal` (~435 lines) - final large component with attendance/editing/materials

**Phase A Result**: All Lessons page components successfully extracted with proper TypeScript interfaces and service integration.

### Subjects Architecture Evolution

**Sept 30, 2025 - Global Subjects (Migration 003)**:
- Transformed subjects from school-specific to global reusable entities
- Created `school_subjects` junction table linking schools to subjects
- Removed `school_id` column from subjects, consolidated duplicates
- UI: "Manage Subjects" button for global management, "Add Subject" with two modes (select existing / create new)

**Sept 30, 2025 - Deduplication**:
- Implemented tag-like behavior for subject names
- School-level edit: typing existing subject name reassigns school to that subject
- Global edit: prevents duplicate names with error message
- Created `merge-duplicate-subjects.ts` script

**Oct 1, 2025 - Architecture Simplification (Migration 005)**:
- Added `user_id` column to subjects (direct ownership)
- Dropped `school_subjects` junction table
- Simplified RLS policies to `user_id = auth.uid()`
- Complete rebuild of Schools.tsx (~1000 lines, down from 1404)
- Subjects now derived from groups

**Oct 3, 2025 - Architecture Correction (Migration 006)**:
- Restored `school_subjects` junction table for proper attribution
- Correct pattern: Subjects work like tags (global entities) with school-based attribution via junction table
- Matches Materials/Tags pattern exactly
- Subjects appear under a school ONLY if attributed via junction table
- Service layer functions: `assignSubjectToSchool()`, `removeSubjectFromSchool()`, `fetchSchoolSubjectAssignments()`

**Final Schema**:
```
subjects: id, name, user_id, created_at, updated_at
school_subjects: id, school_id, subject_id, created_at (UNIQUE: school_id + subject_id)
groups: id, school_id, subject_id, name, timeslots, created_at, updated_at
```

### UI Modernization Timeline

**Oct 3-4, 2025 - Schools Page Modernization**:

**Phase 1**: UI Foundation
- Created `src/components/ui/` directory (button, card, badge, input)
- Installed: class-variance-authority, clsx, tailwind-merge
- Following shadcn/ui patterns

**Phase 2**: Schools Page Styling
- Removed all colored gradients → neutral white/gray backgrounds
- Reduced spacing (35% vertical space reduction)
- Replaced all buttons with Button component (outline/ghost variants)
- Color preserved ONLY in icons (blue/purple/orange for hierarchy)
- Added hover effects (`hover:shadow-md hover:-translate-y-0.5`)

**Phase 3-4**: Space Optimization & Functional Enhancements
- Added responsive max-width container (max-w-7xl)
- Fixed group modal tab switching bug
- Modernized all GroupOverview buttons
- Fixed group ordering (chronological by schedule)
- Added subject inline editing within schools
- Search functionality with hierarchical filtering
- Expand/Collapse All controls

**Phase 5-6**: Animations & Polish
- Installed framer-motion and react-hot-toast
- Toast notifications for all CRUD operations
- Staggered entrance animations (50ms cascade)
- Smooth collapse/expand (0.3s easeInOut)
- Modal animations (backdrop fade + slide up)
- Schools collapsed by default

**Oct 4, 2025 - App-Wide UI Modernization**:

**Phase 1**: Core Infrastructure & Dark Mode Fix
- Dark mode persistence with zustand
- System preference detection
- Installed @tailwindcss/forms
- Minimal gradients configured
- **CRITICAL FIX**: Added `@custom-variant dark` directive to index.css (Tailwind v4 requirement)

**Phase 2**: Layout & Navigation
- Glassmorphism header with backdrop-blur
- Navigation icons (lucide-react)
- User initials avatar
- Global toaster in Layout
- Gradient text logo (blue → purple replaced with slate → indigo for light, cyan → blue for dark)

**Phase 3**: Reusable UI Components
- Created: Input, Textarea, Select, Switch, Label components
- Consistent design system (rounded-lg, focus rings, error states)
- Full dark mode support

**Phase 4-5**: Lessons Page Modernization
- Complete calendar CSS rewrite (100+ lines)
- Opacity-based borders, smooth transitions
- Dark mode: Rich slate-950 background
- List view: 35% space reduction, 2-line layout, icon-only buttons
- Button dark mode variants with scale animations
- Alert boxes dark mode

**Oct 5, 2025 - Lessons Page Animations**:
- Framer-motion animations matching Schools overview
- View transition loading state (200ms delay with spinner)
- Stagger animations for list view (100ms intervals)
- Fixed calendar border alignment with pseudo-elements
- Unified border colors and weights (all 1px)

**Oct 26, 2025 - Lessons Performance Optimization**:
- **Problem**: Modal took 300-600ms to open due to blocking database calls
- **Fix #1**: Modal opens immediately (<50ms), database calls run in background
- **Fix #2**: Added 4 `useMemo` hooks to eliminate 120+ filter operations per render
- **Fix #3**: Roster data cached at page-level (fetched once on load)
- **Fix #4**: Reduced animation duration from 200ms → 120ms (40% faster)
- **Result**: Modal open 80% faster, typing lag 95% faster, render performance 100% faster
- See `docs/lessons-performance-fixes.md` for detailed analysis

### Glass Morphism Design System (October 2025)

**Complete UI Overhaul**:
- `src/styles/themeSurfaces.css` with comprehensive glass morphism primitives
- Surface classes: `surface-panel`, `surface-modal`, `surface-toolbar`, `surface-input`, `surface-chip`, `surface-body`
- Text tokens: `text-soft`, `text-soft-muted`
- Asset-based backgrounds: `bg-asset-wave`, `bg-asset-pattern`, `bg-asset-abstract`
- BackgroundPatternModal for user selection
- Reusable Modal component with framer-motion animations

### Rollout Plan (Phases B-D)

**Phase B - Scheduling Productivity Enhancements**:
1. Partner-school templates (schema + wizard picker)
2. Bulk roster import + period preferences (CSV/Excel)
3. Exact-time scheduling mode (toggle in wizard)
4. Schedule audit log / undo (`schedule_batches` table)

**Phase C - Curriculum & Lesson Alignment**:
1. Unified lesson/material templates (structured fields, auto-fill)
2. School-level management overhaul (date-based cancellation, per-school controls)

**Phase D - Visual & UX Refresh**:
1. Design system adoption (tokens layer, shared components)
2. Micro-interactions & accessibility (focus states, reduced motion, screen-reader labels, keyboard traps elimination)
3. Axe audits and keyboard-only walkthrough

**Ongoing**:
- Update `docs/manual-test-plan.md` after each milestone
- Log findings in PROJECT.md
- Keep commits scoped per step, run automated checks before handoff


