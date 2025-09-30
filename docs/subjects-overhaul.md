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

---

*Completed: 2025-09-30*
*Session: Global subjects implementation with full UI support*