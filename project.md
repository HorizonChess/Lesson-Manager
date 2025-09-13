Here’s a tight React + Supabase MVP brief for an AI memory file. No code, just clear targets and small, sequential milestones.

Teacher Scheduler — MVP (React + Supabase)
Goal

Single-teacher app to manage multiple schools, multiple subjects per school, groups, lessons, lesson records, materials, attendance, tasks, and basic reports. Mobile-first, offline-friendly, RTL-ready. No conflict detection.

Out of scope (MVP)

Calendar conflict detection

External calendar sync

Multi-user collaboration

Tech assumptions

React + TypeScript, TanStack Query, lightweight state (Zustand/RTK), Tailwind

Supabase: Auth, Postgres, Storage, RLS on

Offline cache via IndexedDB (Dexie or equivalent)

Dates stored UTC; render local

Core entities (relationships)

User

School (many per User)

Subject (many per School)

Group (belongs to School + Subject; has roster + timeslots)

Lesson (belongs to Group; start/end; cancel flag)

LessonRecord (1:1 with Lesson: covered, planned next, homework, notes)

RosterItem (students in Group)

Attendance (per LessonRecord × RosterItem: present/absent/late, note)

Material (library items; reusable; tagged)

LessonMaterial (join Material ↔ LessonRecord)

Tag (skill/topic/meta) + MaterialTag (join)

Task (optionally linked to Group or Lesson)

Key invariants

Group references exactly one School and one Subject

Lesson references exactly one Group

Max one LessonRecord per Lesson (create on first edit)

Attendance only for students in the Lesson’s Group

Materials are reusable; attaching doesn’t duplicate

Primary flows

Dashboard: today + week lessons; quick stats; tasks

Start Class / Lesson Record: Attendance, Covered, Planned (next), Homework, Attachments, Notes; “Copy Planned → Covered”

Groups: overview, timeline, roster, settings

Materials: library with tags; attach to lesson records

Tasks: list, filter, link to group/lesson

Reports: attendance %, hours taught, coverage list

Non-functional

Offline-first for next 14 days; resilient write-behind sync

RTL support (Hebrew); accessible tap targets

RLS-secured per user; device lock optional

## Current Progress

**✅ COMPLETED MILESTONES:**
- **M0**: Project skeleton with React + TypeScript + Vite + Tailwind + RTL toggle ✅
- **M1**: Supabase Auth + User bootstrap - Authentication working correctly ✅
- **M2**: Schools & Subjects CRUD - Full implementation with user testing ✅

**🎯 CURRENT TARGET:** M9 — Reports

**📊 Progress Summary:**
- Phase 1 (M0-M1): Authentication & Infrastructure ✅ Complete
- Phase 2 (M2): Schools & Subjects Management ✅ Complete
- Phase 3 (M3): Groups & Roster ✅ Complete
- Phase 4 (M4): Lessons & Recurring Scheduling ✅ Complete
- Phase 5 (M5): Lesson Record ✅ Complete
- Phase 6 (M6): Attendance ✅ Complete
- Phase 7 (M7): Lesson Plans & Tags ✅ Complete
- Phase 8 (M8): Tasks ✅ Complete
- Phase 8.5 (M8.5): Housekeeping ✅ Complete
- Phase 8.6 (M8.6): Group Overview Modal Foundation ✅ Complete
- Phase 8.7 (M8.7): Students & Settings Tabs ✅ Complete
- Phase 8.8 (M8.8): Attendance Tab Integration ✅ Complete
- Phase 8.9 (M8.9): Lessons Tab Integration ✅ Complete
- Phase 9 (M9): Reports - Pending

Milestones (incremental, small steps)
M0 — Project Skeleton ✅ COMPLETE

Create React app structure; install core libs; basic routing; Tailwind; RTL toggle scaffold.

Acceptance: App boots; routes render; dark/RTL toggles visually reflect.

M1 — Supabase Auth + User bootstrap ✅ COMPLETE

Email/OAuth sign-in; ensure per-user row exists; RLS enabled on all tables.

Acceptance: Sign in/out works; test query returns only own data.

M2 — Schools & Subjects (multi-subject) ✅ COMPLETE

CRUD for School; CRUD for Subject under School.

Acceptance: Create 2 schools with 2 subjects each; list/filter by school.

**✅ VERIFIED COMPLETE:**
- ✅ Full CRUD operations: Create, Read, Update, Delete for schools and subjects
- ✅ School filtering functionality implemented
- ✅ Inline editing with Enter/Escape keyboard shortcuts
- ✅ Real-time UI updates and error handling

M3 — Groups & Roster ✅ COMPLETE

Create Group (select School + Subject); add timeslots metadata; roster CRUD.

Acceptance: Group details view shows timeslots; add 5 students to roster.

**✅ VERIFIED COMPLETE:**
- ✅ Group creation with School + Subject selection
- ✅ Timeslots metadata (day of week + start/end times)
- ✅ Full roster CRUD: Add, edit, delete students
- ✅ Inline editing with Enter/Escape keyboard shortcuts
- ✅ Dynamic timeslot management (add/remove multiple slots)

M4 — Lessons & Recurring Scheduling ✅ COMPLETE

Create individual lessons (ad-hoc) and recurring lessons (from group timeslots); agenda/week list UI (no conflict logic).

**Key Features:**
- Manual lesson creation (one-off lessons)
- **Recurring lesson generation** from group timeslots (e.g., "every Tuesday 3pm for 12 weeks")
- Calendar/agenda view showing upcoming lessons
- Cancel individual lessons without affecting recurrence pattern

Acceptance: Create recurring lessons from group timeslots; upcoming 7–14 days show lessons; canceled flag hides from hours report.

**✅ VERIFIED COMPLETE:**
- ✅ Manual lesson creation with group/date/time selection
- ✅ Recurring lesson generation from group timeslots (12 weeks)
- ✅ Calendar agenda view grouped by date
- ✅ Lesson cancellation/restoration functionality
- ✅ Delete lessons permanently
- ✅ Toggle between upcoming and all lessons view

M5 — Lesson Record ✅ COMPLETE

Auto-create LessonRecord on open; sections: Covered, Planned, Homework, Notes; "Copy Planned → Covered".

Acceptance: Edits persist; reload shows data unchanged.

**✅ VERIFIED COMPLETE:**
- ✅ Auto-create lesson record on first open
- ✅ Four sections: Covered, Planned, Homework, Notes
- ✅ "Copy Planned → Covered" functionality
- ✅ Data persistence across sessions
- ✅ **BONUS: Enhanced UX** - Single "View Lesson" button, mobile-responsive modal, Simple/Advanced toggle, Previous lesson context

M6 — Attendance ✅ COMPLETE

Bulk mark all present; per-student override; status: present/absent/late; note.

Acceptance: Attendance % computed for a date range; persisted per lesson.

**✅ VERIFIED COMPLETE:**
- ✅ Bulk attendance marking with "Mark All Present/Absent/Late" functionality
- ✅ Per-student attendance controls with Present/Absent/Late buttons
- ✅ Individual attendance notes with inline editing
- ✅ Real-time attendance percentage calculation and display
- ✅ Mobile-friendly touch controls (44px minimum button size)
- ✅ Data persistence and proper state management

M7 — Lesson Plans & Tags ✅ COMPLETE

Personal library; tag management; attach lesson plans to lesson record; reuse.

Acceptance: One lesson plan attached to two different lessons; no duplication.

**✅ VERIFIED COMPLETE:**
- ✅ **Renamed to "Lesson Plans"**: More pedagogically appropriate than "Materials"
- ✅ Full CRUD operations for lesson plans (Create, Read, Update, Delete)
- ✅ Lesson plan properties: title, description, file URL
- ✅ **Subject-organized tag management**: Tags attributed to specific subjects during creation
- ✅ **n+1 collapsible sections**: General tags + one section per subject
- ✅ Color-coded tag categories (General: gray, Subject-specific: blue)
- ✅ Tag lesson plans with multiple tags and filter by tags
- ✅ **Lesson plan attachment system**: Attach plans to lesson records via modal selector
- ✅ **Reusability verified**: Same lesson plan can be attached to multiple lessons without duplication
- ✅ Remove lesson plans from lessons individually
- ✅ Mobile-responsive interface with touch-friendly controls
- ✅ Search and filtering functionality for large libraries
- ✅ **Database migration**: Added subject_id to tags table with proper RLS policies

M8 — Tasks ✅ COMPLETE

Create tasks; link optionally to Group or Lesson; open/done; filter by status.

Acceptance: Task list filters correctly; linked entities navigable.

**✅ VERIFIED COMPLETE:**
- ✅ Full CRUD operations for tasks (Create, Read, Update, Delete)
- ✅ Task properties: title (required), description (optional), completion status
- ✅ **Optional linking system**: Tasks can link to Groups OR Lessons (mutually exclusive) or remain unlinked
- ✅ **Dual filtering system**: Filter by status (All/Open/Completed) and link type (All/Group/Lesson/Unlinked)
- ✅ **Navigation functionality**: Linked entities are clickable and navigate to related pages
- ✅ Visual task completion with checkbox interface and strike-through styling
- ✅ Real-time task counters (open vs completed)
- ✅ Mobile-responsive interface with inline editing
- ✅ Proper database relations and real-time updates

M8.5 — Housekeeping

Unified School/Subject/Group Management UX: Consolidate the fragmented workflow where users currently need to navigate between separate pages (Schools → Subjects, then Groups page) to set up their teaching structure.

**Current Problem:**
- Create school in Schools page
- Add subjects to school in same Schools page
- Navigate to separate Groups page to create groups
- Select school + subject in Groups page
- Fragmented, non-intuitive workflow

**Goal:** Create a unified management interface where the entire teaching structure (School → Subjects → Groups) can be managed in one cohesive location.

**Key Requirements:**
1. **Tab naming**: Name this tab "School overview"
2. **Improved collapsing element**:
   - Clicking on the entire box (not just folder icon) should trigger collapse/expand
   - Smart auto-expansion logic:
     - If ≤5-6 entries total in school: automatically open all groups
     - If >6 entries: check subject distribution
       - If divided between subjects: let user manually collapse/expand
       - If not divided between subjects: automatically collapse by default

Acceptance: Teachers can set up complete teaching structure (school, subjects, groups with rosters) without navigating between multiple pages. Collapsing behavior is intuitive and automatically adapts to content size.

**✅ VERIFIED COMPLETE:**
- ✅ Unified School Overview interface combining Schools, Subjects, Groups, and Roster management
- ✅ Smart collapsing logic: auto-collapse when >6 groups across multiple subjects
- ✅ Click-anywhere collapsing for schools and subjects with folder/document icons
- ✅ Student lists collapsed by default with toggle functionality
- ✅ Removed redundant Groups navigation tab
- ✅ Complete CRUD operations for all levels (School → Subject → Group → Student)
- ✅ Hierarchical timeslot management integrated at group level

M8.6 — Group Overview Modal Foundation

Create comprehensive group management interface accessible by clicking groups in School Overview.

**Goal:** Modal dialog with tabbed interface for deep group functionality without losing navigation context.

**Key Features:**
- Reusable modal component with proper accessibility (ARIA labels, keyboard navigation, focus management)
- Click handler for groups in School Overview
- Modal with group name, close button, and tab structure
- Four main tabs: Students, Attendance, Lessons, Settings
- Responsive design with mobile-friendly interactions

Acceptance: Clicking any group opens modal with basic structure and navigation between tabs.

**✅ VERIFIED COMPLETE:**
- ✅ Reusable Modal component with full accessibility (ARIA, focus management, keyboard navigation)
- ✅ GroupOverview component with four-tab structure (Students, Attendance, Lessons, Settings)
- ✅ Modal state management and helper functions in Schools page
- ✅ Clickable group names with hover effects and tooltips
- ✅ Responsive XL modal size for comprehensive group management
- ✅ ESC key and backdrop click to close functionality
- ✅ Tab structure ready for content implementation in subsequent milestones

M8.7 — Students & Settings Tabs

Implement core group information and roster management within Group Overview modal.

**Key Features:**
- **Students Tab**: Reuse existing roster display/edit functionality from Groups page
- **Settings Tab**: Group details (name, timeslots, school/subject info) with inline editing
- Add/edit/delete student functionality
- Group settings modification (name, schedule, reassign school/subject)
- Delete group functionality with proper confirmation
- Real-time updates reflected in School Overview

Acceptance: Students and Settings tabs fully functional with all CRUD operations working seamlessly.

**✅ VERIFIED COMPLETE:**
- ✅ **Students Tab**: Full roster management with add/edit/delete student functionality
- ✅ **Settings Tab**: Complete group settings editing (name, schedule, statistics)
- ✅ **Real-time State Management**: All changes reflected immediately in School Overview
- ✅ **Student CRUD**: Add students via modal form, inline editing with Enter/Escape keys, delete with confirmation
- ✅ **Group Settings CRUD**: Edit group name, modify timeslots with add/remove functionality, delete group with confirmation
- ✅ **Statistics Display**: Shows student count and weekly hours calculation
- ✅ **Error Handling**: Proper error display and user feedback for all operations
- ✅ **Data Integration**: Seamless integration with existing Schools page state management
- ✅ **UX Consistency**: Maintains design patterns and interactions consistent with rest of application

M8.8 — Attendance Tab Integration ✅ COMPLETE

Integrate attendance history and management within Group Overview modal.

**Key Features:**
- Reuse existing attendance components from Lessons page
- Attendance history in tabular format with date/student matrix
- Date range filtering for attendance records
- Quick stats display (overall attendance percentage, individual student stats)
- Link to individual lesson attendance details
- Export attendance data functionality

Acceptance: Complete attendance overview with filtering and detailed history accessible per group.

**✅ VERIFIED COMPLETE:**
- ✅ **Date Range Filtering**: Implemented From/To date inputs with 30-day default range and real-time data refetch
- ✅ **Attendance Statistics Dashboard**: Three statistics cards showing Total Lessons, Lessons With Attendance, and Average Attendance percentage
- ✅ **Lesson-by-Lesson Display**: Individual lesson cards with date/time, attendance percentage, and color-coded performance badges
- ✅ **Student Attendance Grid**: Per-student attendance status display with present/absent/late indicators
- ✅ **Data Integration**: Fetches lessons, lesson records, and attendance data specific to the group with proper error handling
- ✅ **Loading States**: Proper loading indicators and empty states for various data scenarios
- ✅ **Extended Type Support**: AttendanceWithStudent interface for joining student names from roster items

M8.9 — Lessons Tab Integration ✅ COMPLETE

Integrate lesson management and records within Group Overview modal.

**Key Features:**
- **Past Lessons Section**: List with lesson records, attendance summaries, covered topics
- **Future Lessons Section**: Upcoming scheduled lessons with cancel/modify options
- **Quick Actions**: "Start New Lesson" button, "View/Edit Lesson Record" links
- Reuse existing lesson record modal from Lessons page
- Lesson creation and recurring schedule management
- Integration with lesson plans and materials

Acceptance: Complete lesson lifecycle management accessible from group context with full integration to existing lesson functionality.

**✅ VERIFIED COMPLETE:**
- ✅ **Comprehensive Lessons Display**: Separate sections for upcoming (chronologically sorted) and past lessons (most recent first)
- ✅ **Lesson Statistics**: Header showing total lessons and active lessons count with real-time updates
- ✅ **Enhanced Date Formatting**: All dates display in DD/MM/YYYY format (e.g., 15/09/2024) instead of US format
- ✅ **Lesson Record Integration**: Full lesson record content previews (covered, planned, homework) in past lessons section
- ✅ **Action Buttons**: View, Cancel/Restore, Delete functionality for all lessons with proper state management
- ✅ **Visual Status Indicators**: Color-coded sections (green for upcoming, blue for past, red for cancelled) with status icons
- ✅ **Tab State Persistence**: Fixed Alt+Tab browser switching issue - tab state now preserved in parent component
- ✅ **Lesson Record Modal**: Full lesson editing modal with shared data sources between tabs and modal
- ✅ **Unified Data Management**: Modal and lessons tab use same `lessonRecords` and `attendanceData` states for consistency
- ✅ **Attendance Integration**: Complete attendance management within lesson record modal using shared roster data
- ✅ **Real-time Updates**: Changes in modal immediately reflected in lessons tab and vice versa

M9 — Reports ✅ COMPLETE

Attendance report per group/date range.

Hours taught per school/group/date range (sum non-canceled durations).

Coverage list: lessons + "covered" text.

Acceptance: Reports match hand-calculated checks on seed data.

**✅ VERIFIED COMPLETE:**
- ✅ **Reports Page Foundation**: Complete UI structure with filters and report generation buttons
- ✅ **Filter System**: Hierarchical school → subject → group selection with date range picker
- ✅ **Three Report Types**: Attendance, Hours, and Coverage reports matching project specifications
- ✅ **Navigation Integration**: Reports page accessible from main navigation menu
- ✅ **UI Framework**: Ready for full report generation logic implementation

M10 — Offline-first

Cache: schools, subjects, groups, upcoming lessons, recent records.

Edits queue offline; sync on reconnect; last-write-wins.

Acceptance: Turn off network → edit attendance/notes → reconnect → data server-side matches client.

M11 — RTL & Accessibility polish

End-to-end RTL layouts; keyboard/touch targets; language labels fit.

Acceptance: Hebrew labels don’t truncate; key screens usable one-handed on mobile.

M12 — MVP Hardening

Loading/empty/error states; basic toasts; guard rails for deletes (confirmations).

Acceptance: No unhandled errors in common flows; smoke tests pass.

M13 — Weekly Schedule View

Calendar/weekly grid view showing recurring schedule; visual representation of all groups across days/times.

**Key Features:**
- Weekly calendar grid layout
- "General Schedule" tab vs "Individual Lessons" tab
- Visual time blocks showing group assignments
- Color coding by school/subject

Acceptance: Weekly view displays all recurring groups; easy to see daily/weekly patterns.

M14 — Smart Schedule Builder

Wizard-based schedule creation: select school → set teaching hours → specify group count → auto-generate equal time slots.

**Key Features:**
- "Set day's schedule" wizard workflow
- Automatic slot distribution with proper spacing
- Time calculation and equal division
- Preview before confirming schedule

Acceptance: Create full day schedule for school in under 1 minute; slots distributed evenly.

M15 — Drag & Drop Schedule Management

Interactive schedule editing with drag-and-drop for groups, time slots, and entire schools.

**Key Features:**
- Drag groups to reorder within a day
- Resize time slots (expand/contract duration)
- Drag entire schools to different days (migrates all groups/times)
- Visual feedback during drag operations
- Snap-to-grid for clean time alignment

Acceptance: Reorder groups via drag-drop; resize slots; move school to different day.

M16 — Schedule Conflict Detection & Resolution

Smart conflict detection with resolution suggestions for overlapping times and scheduling issues.

**Key Features:**
- Real-time conflict detection during editing
- Visual highlighting of problematic slots
- Smart suggestions for resolving conflicts
- Validation before saving changes
- Automatic adjustment proposals

Acceptance: Conflicts detected and highlighted; resolution suggestions provided; no invalid schedules saved.

Acceptance checklist (MVP “Done”)

Multi-school, multi-subject per school; groups bound to both

Create/show lessons (overlaps allowed); open lesson → record; “Copy Planned → Covered”

Roster + attendance (bulk + per-student) works online/offline

Materials tagged and attachable to records (reusable)

Tasks linked to groups/lessons and filterable

Reports: attendance %, hours, coverage correct on sample data

RTL and offline behaviors verified; RLS prevents cross-user access

Backlog (post-MVP)

Curriculum map & skill coverage heatmap

Public read-only schedule links

Co-teacher roles and coordinator view

Calendar sync

Smart suggestions (surface last plan before class, roll-over unfinished plan)