# Subjects Overhaul: Global Subjects Implementation

## ✅ COMPLETED

**Project Goal**: Transform subjects from school-specific to global reusable subjects to eliminate duplicates and improve material tagging.

**Problem**: "Chess" existed 3 times for 3 schools → **Solution**: One global "Chess" usable across all schools.

## Implementation Summary

### Database Changes
- ✅ Added `school_subjects` junction table linking schools to subjects
- ✅ Removed `school_id` column from `subjects` table
- ✅ Updated RLS policies for global subject access
- ✅ Consolidated duplicate subjects by name

### Code Changes
- ✅ Updated TypeScript types (`Subject`, added `SchoolSubject`)
- ✅ Fixed all service layer functions (subjects.ts, setupPage.ts, groupsPage.ts, materials.ts)
- ✅ Updated Schools.tsx to use school_subjects junction table
- ✅ Fixed group filtering and counting by school
- ✅ Synced existing group timeslots from lessons data
- ✅ Updated schedule wizard to set timeslots when creating groups

### UI Features Added
1. **"Manage Subjects" button** - Global subjects management
   - View all subjects
   - Edit subject names (affects all schools)
   - Delete subjects (removes from all schools, groups remain)

2. **"Add Subject" with two modes**:
   - "Select Existing" - Assign existing global subject to school
   - "Create New" - Create and assign new global subject

3. **Subject removal** - Unassign subject from school (groups remain)

## Database Schema (Final)

```sql
subjects:
  - id (uuid, primary key)
  - name (text)
  - created_at (timestamp)
  - updated_at (timestamp)

school_subjects (junction table):
  - id (uuid, primary key)
  - school_id (uuid, foreign key → schools)
  - subject_id (uuid, foreign key → subjects)
  - created_at (timestamp)
  - UNIQUE(school_id, subject_id)

groups:
  - id (uuid, primary key)
  - school_id (uuid, foreign key → schools)
  - subject_id (uuid, foreign key → subjects)
  - name (text)
  - timeslots (jsonb array)
  - created_at (timestamp)
  - updated_at (timestamp)
```

## Migration Applied

**File**: `supabase/migrations/003_global_subjects.sql`

**What it does**:
1. Creates `school_subjects` junction table with RLS policies
2. Migrates existing school-subject relationships to junction table
3. Consolidates duplicate subjects by name (case-insensitive)
4. Updates all `groups.subject_id` to point to consolidated subjects
5. Removes `school_id` column from subjects table
6. Updates RLS policies for global subject access
7. Adds performance indexes

## Data Integrity

- ✅ All lessons preserved (803 lessons intact)
- ✅ All groups preserved (23 groups intact)
- ✅ Group timeslots synced from lessons
- ✅ School-subject relationships maintained via junction table

## Backup & Restore

**Backup script**: `scripts/backup-database.ts`
```bash
npm run backup
```

**Restore script**: `scripts/restore-database.ts`
```bash
npm run restore ./backups/backup-YYYY-MM-DDTHH-mm-ss
```

**Timeslot sync script**: `scripts/sync-group-timeslots.ts`
```bash
npm run sync-timeslots
```

## Benefits Achieved

1. **No duplicate subjects** - "Chess" exists once, shared across schools
2. **Material tagging simplified** - Tags reference global subjects, not school-specific ones
3. **Easier subject management** - Edit subject name once, affects all schools
4. **Flexible assignment** - Assign same subject to multiple schools

## Future Considerations

- Consider adding subject categories/types if needed
- May want to track which user created each global subject
- Could add subject descriptions or metadata fields

## Testing Checklist

- [x] Migration runs without errors
- [x] No data loss
- [x] Duplicate subjects consolidated
- [x] Foreign keys intact
- [x] Schools page displays correctly
- [x] Groups filtered by school correctly
- [x] Subjects can be assigned to schools
- [x] Subjects can be removed from schools
- [x] Tags show global subjects (no duplicates)
- [x] Lessons page still works
- [x] Schedule wizard sets timeslots correctly

## Subject Deduplication (Sept 30, 2025)

**Problem**: Subjects could be created with duplicate names, defeating the purpose of global subjects.

**Solution**: Implemented tag-like behavior where editing a subject name to match an existing subject reassigns instead of creating duplicates.

### Changes Made:

1. **Cleanup Script** (`scripts/merge-duplicate-subjects.ts`)
   - Merges existing duplicate subjects by name (case-insensitive)
   - Consolidates all groups and school assignments to oldest subject
   - Successfully merged duplicate "שחמט" (Chess) subjects

2. **Service Layer Functions** (`src/services/groupsPage.ts`)
   - `findSubjectByName()` - Case-insensitive subject lookup
   - `reassignSchoolSubject()` - Smart subject update that reassigns to existing if name matches
   - `updateSubjectName()` - Enhanced with duplicate prevention for global edits

3. **UI Updates** (`src/pages/Schools.tsx`)
   - School-level subject edit now uses `reassignSchoolSubject()` - typing existing subject name reassigns school to that subject
   - Global "Manage Subjects" edit throws error if trying to rename to existing subject name
   - Both flows refresh data to show accurate state after changes

### Behavior:

**School-level edit** (editing subject under a school):
- User edits "General Teaching" → "Debate"
- If "Debate" exists globally:
  - All groups in this school under "General Teaching" move to "Debate"
  - School is reassigned to existing "Debate" subject
  - "General Teaching" is removed from this school (but stays global if other schools use it)
- If "Debate" doesn't exist: Subject is renamed to "Debate" globally
- Works like tags - typing existing name attaches that tag, and all content (groups) moves with it

**Global edit** (Manage Subjects modal):
- User edits "Chess A" → "Chess B" where "Chess B" already exists
- Shows error: "A subject named 'Chess B' already exists. Cannot create duplicates."
- Prevents accidental duplicate creation at global level

---

## Architecture Simplification (Oct 1, 2025)

**Problem**: The junction table approach (`school_subjects`) proved overly complex for simple tag-like subject management. Delete operations failed due to RLS policy conflicts, and the architecture didn't match the proven Materials/Tags pattern.

**Root Cause**:
- Subjects had no `user_id` column (removed with `school_id` in migration 003)
- RLS policies relied on complex joins through `school_subjects` table
- Delete operations failed: code removed `school_subjects` entries first, then RLS blocked subject delete (no school_subjects entries left to verify ownership)

**Solution**: Complete architecture rebuild following Materials/Tags pattern

### Migration 005: Simplify Subjects Architecture

**File**: `supabase/migrations/005_simplify_subjects.sql`

**Changes**:
1. Added `user_id` column to subjects (direct ownership)
2. Populated `user_id` from existing `school_subjects` relationships
3. Dropped `school_subjects` junction table entirely
4. Replaced complex RLS policies with simple `user_id = auth.uid()` checks
5. Added index on `user_id` for performance

**New Schema**:
```sql
subjects:
  - id (uuid, primary key)
  - name (text)
  - user_id (uuid, foreign key → auth.users) -- NEW
  - created_at (timestamp)
  - updated_at (timestamp)

-- school_subjects table REMOVED
```

**Data Integrity** (verified Oct 1, 2025):
- ✅ 2 subjects with user_id populated
- ✅ school_subjects table dropped successfully
- ✅ RLS policies simplified (4 policies: SELECT, INSERT, UPDATE, DELETE)
- ✅ 22 groups intact
- ✅ 803 lessons intact

**New Behavior**:
- Subjects now work like tags (Materials/Tags pattern)
- Each user owns their subjects (user_id-based)
- No junction table - direct user ownership
- Simple RLS: users see only their own subjects

### Rebuild Plan (Milestones M1-M10)

- ✅ **M1**: Database migration (005_simplify_subjects.sql) [COMPLETE]
- ✅ **M2**: Rewrite service layer (remove school_subjects logic) [COMPLETE]
- ✅ **M3**: Update Schools.tsx compatibility layer [COMPLETE]
- ✅ **M4-M10**: Complete Schools.tsx rebuild [COMPLETE]

**M2 Changes** (`src/services/groupsPage.ts`, `src/types/database.ts`):
- Removed `fetchSchoolSubjectAssignments()`, `assignSubjectToSchool()`, `removeSubjectFromSchool()`, `reassignSchoolSubject()`
- Replaced with `fetchSchoolSubjects()` - derives subjects from groups
- Updated `fetchSchoolsPageData()` - removed school_subjects queries, now returns `groupsBySchool`
- Updated `createSubjectGlobal()`, `findSubjectByName()`, `updateSubjectName()`, `deleteSubjectGlobal()` to use `user_id` parameter
- Removed `SchoolSubject` type from database.ts
- Added `user_id` to `Subject` type

**M3 Changes** (`src/pages/Schools.tsx`):
- Backed up original file ([Schools.tsx.backup-20251001-120737](src/pages/Schools.tsx.backup-20251001-120737))
- Updated all subject CRUD functions to use new service layer signatures (userId parameter)
- Removed calls to deleted functions (assignSubjectToSchool, removeSubjectFromSchool, reassignSchoolSubject)
- Added TODO comments marking areas for M4-M10 rebuild
- App now compiles and runs with compatibility layer

**M4-M10 Changes** (`src/pages/Schools.tsx` - Complete rebuild):
- Complete rewrite from scratch (~1000 lines, down from 1404)
- Clean architecture following Materials/Tags pattern
- All CRUD operations implemented and working:
  - **Schools**: Add, edit (inline), delete with cascade
  - **Subjects**: Tag-like behavior, automatic deduplication, global management modal
  - **Groups**: Add with timeslots, edit, delete (moves to "General Teaching")
  - **Roster**: Add students, edit (inline), delete, collapsible lists
- **UI Features**:
  - Hierarchical collapsible interface (schools → subjects → groups → students)
  - Smart defaults: students collapsed by default
  - Inline forms for all add operations
  - Inline editing for schools, students
  - Click group name to open GroupOverview modal
  - Error handling with dismissible alerts
  - Loading states
  - Visual hierarchy with emojis (📁📂 📄📋 👥👤)
- **Helper Functions**: `getSchoolSubjects()`, `getSchoolSubjectGroups()` derive subjects/groups from data
- **TypeScript**: Fully typed, compiles without errors
- **Data Structure**: Uses `groupsBySchool` and `groupsBySubject` for efficient lookups

---

*Original Completion: 2025-09-30*
*Architecture Simplification: 2025-10-01 (All milestones M1-M10 COMPLETE)*