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

Milestones (incremental, small steps)
M0 — Project Skeleton

Create React app structure; install core libs; basic routing; Tailwind; RTL toggle scaffold.

Acceptance: App boots; routes render; dark/RTL toggles visually reflect.

M1 — Supabase Auth + User bootstrap

Email/OAuth sign-in; ensure per-user row exists; RLS enabled on all tables.

Acceptance: Sign in/out works; test query returns only own data.

M2 — Schools & Subjects (multi-subject)

CRUD for School; CRUD for Subject under School.

Acceptance: Create 2 schools with 2 subjects each; list/filter by school.

M3 — Groups & Roster

Create Group (select School + Subject); add timeslots metadata; roster CRUD.

Acceptance: Group details view shows timeslots; add 5 students to roster.

M4 — Lessons (schedule list view only)

Create lessons (from timeslots or ad-hoc); agenda/week list UI (no conflict logic).

Acceptance: Upcoming 7–14 days show lessons; canceled flag hides from hours report.

M5 — Lesson Record

Auto-create LessonRecord on open; sections: Covered, Planned, Homework, Notes; “Copy Planned → Covered”.

Acceptance: Edits persist; reload shows data unchanged.

M6 — Attendance

Bulk mark all present; per-student override; status: present/absent/late; note.

Acceptance: Attendance % computed for a date range; persisted per lesson.

M7 — Materials & Tags

Personal library; tag management; attach materials to lesson record; reuse.

Acceptance: One material attached to two different lessons; no duplication.

M8 — Tasks

Create tasks; link optionally to Group or Lesson; open/done; filter by status.

Acceptance: Task list filters correctly; linked entities navigable.

M9 — Reports

Attendance report per group/date range.

Hours taught per school/group/date range (sum non-canceled durations).

Coverage list: lessons + “covered” text.

Acceptance: Reports match hand-calculated checks on seed data.

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