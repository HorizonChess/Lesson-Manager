-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_insert_policy ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on schools table
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Users can only see their own schools
CREATE POLICY schools_select_policy ON schools
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY schools_insert_policy ON schools
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY schools_update_policy ON schools
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY schools_delete_policy ON schools
  FOR DELETE USING (auth.uid() = user_id);

-- Create subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on subjects table
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Users can only see subjects from their own schools
CREATE POLICY subjects_select_policy ON subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schools 
      WHERE schools.id = subjects.school_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY subjects_insert_policy ON subjects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM schools 
      WHERE schools.id = subjects.school_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY subjects_update_policy ON subjects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM schools 
      WHERE schools.id = subjects.school_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY subjects_delete_policy ON subjects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM schools 
      WHERE schools.id = subjects.school_id 
      AND schools.user_id = auth.uid()
    )
  );

-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timeslots JSONB DEFAULT '[]' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on groups table
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Users can only see groups from their own schools
CREATE POLICY groups_select_policy ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schools 
      WHERE schools.id = groups.school_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY groups_insert_policy ON groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM schools 
      WHERE schools.id = groups.school_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY groups_update_policy ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM schools 
      WHERE schools.id = groups.school_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY groups_delete_policy ON groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM schools 
      WHERE schools.id = groups.school_id 
      AND schools.user_id = auth.uid()
    )
  );

-- Create roster_items table
CREATE TABLE roster_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on roster_items table
ALTER TABLE roster_items ENABLE ROW LEVEL SECURITY;

-- Users can only see roster items from their own groups
CREATE POLICY roster_items_select_policy ON roster_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups 
      JOIN schools ON schools.id = groups.school_id
      WHERE groups.id = roster_items.group_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY roster_items_insert_policy ON roster_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups 
      JOIN schools ON schools.id = groups.school_id
      WHERE groups.id = roster_items.group_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY roster_items_update_policy ON roster_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM groups 
      JOIN schools ON schools.id = groups.school_id
      WHERE groups.id = roster_items.group_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY roster_items_delete_policy ON roster_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups 
      JOIN schools ON schools.id = groups.school_id
      WHERE groups.id = roster_items.group_id 
      AND schools.user_id = auth.uid()
    )
  );

-- Create lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_cancelled BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on lessons table
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Users can only see lessons from their own groups
CREATE POLICY lessons_select_policy ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups 
      JOIN schools ON schools.id = groups.school_id
      WHERE groups.id = lessons.group_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY lessons_insert_policy ON lessons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups 
      JOIN schools ON schools.id = groups.school_id
      WHERE groups.id = lessons.group_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY lessons_update_policy ON lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM groups 
      JOIN schools ON schools.id = groups.school_id
      WHERE groups.id = lessons.group_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY lessons_delete_policy ON lessons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups 
      JOIN schools ON schools.id = groups.school_id
      WHERE groups.id = lessons.group_id 
      AND schools.user_id = auth.uid()
    )
  );

-- Create lesson_records table
CREATE TABLE lesson_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE UNIQUE,
  covered TEXT,
  planned TEXT,
  homework TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on lesson_records table
ALTER TABLE lesson_records ENABLE ROW LEVEL SECURITY;

-- Users can only see lesson records from their own lessons
CREATE POLICY lesson_records_select_policy ON lesson_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lessons.id = lesson_records.lesson_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY lesson_records_insert_policy ON lesson_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lessons.id = lesson_records.lesson_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY lesson_records_update_policy ON lesson_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lessons.id = lesson_records.lesson_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY lesson_records_delete_policy ON lesson_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lessons.id = lesson_records.lesson_id 
      AND schools.user_id = auth.uid()
    )
  );

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_record_id UUID NOT NULL REFERENCES lesson_records(id) ON DELETE CASCADE,
  roster_item_id UUID NOT NULL REFERENCES roster_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(lesson_record_id, roster_item_id)
);

-- Enable RLS on attendance table
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Users can only see attendance from their own lesson records
CREATE POLICY attendance_select_policy ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lesson_records
      JOIN lessons ON lessons.id = lesson_records.lesson_id
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lesson_records.id = attendance.lesson_record_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY attendance_insert_policy ON attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lesson_records
      JOIN lessons ON lessons.id = lesson_records.lesson_id
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lesson_records.id = attendance.lesson_record_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY attendance_update_policy ON attendance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lesson_records
      JOIN lessons ON lessons.id = lesson_records.lesson_id
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lesson_records.id = attendance.lesson_record_id 
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY attendance_delete_policy ON attendance
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lesson_records
      JOIN lessons ON lessons.id = lesson_records.lesson_id
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lesson_records.id = attendance.lesson_record_id 
      AND schools.user_id = auth.uid()
    )
  );

-- Create materials table
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on materials table
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Users can only see their own materials
CREATE POLICY materials_select_policy ON materials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY materials_insert_policy ON materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY materials_update_policy ON materials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY materials_delete_policy ON materials
  FOR DELETE USING (auth.uid() = user_id);

-- Create lesson_materials join table
CREATE TABLE lesson_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_record_id UUID NOT NULL REFERENCES lesson_records(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(lesson_record_id, material_id)
);

-- Enable RLS on lesson_materials table
ALTER TABLE lesson_materials ENABLE ROW LEVEL SECURITY;

-- Users can only see lesson materials from their own lesson records and materials
CREATE POLICY lesson_materials_select_policy ON lesson_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lesson_records
      JOIN lessons ON lessons.id = lesson_records.lesson_id
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lesson_records.id = lesson_materials.lesson_record_id 
      AND schools.user_id = auth.uid()
    ) AND EXISTS (
      SELECT 1 FROM materials
      WHERE materials.id = lesson_materials.material_id
      AND materials.user_id = auth.uid()
    )
  );

CREATE POLICY lesson_materials_insert_policy ON lesson_materials
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lesson_records
      JOIN lessons ON lessons.id = lesson_records.lesson_id
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lesson_records.id = lesson_materials.lesson_record_id 
      AND schools.user_id = auth.uid()
    ) AND EXISTS (
      SELECT 1 FROM materials
      WHERE materials.id = lesson_materials.material_id
      AND materials.user_id = auth.uid()
    )
  );

CREATE POLICY lesson_materials_delete_policy ON lesson_materials
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lesson_records
      JOIN lessons ON lessons.id = lesson_records.lesson_id
      JOIN groups ON groups.id = lessons.group_id
      JOIN schools ON schools.id = groups.school_id
      WHERE lesson_records.id = lesson_materials.lesson_record_id 
      AND schools.user_id = auth.uid()
    ) AND EXISTS (
      SELECT 1 FROM materials
      WHERE materials.id = lesson_materials.material_id
      AND materials.user_id = auth.uid()
    )
  );

-- Create tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Enable RLS on tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tags
CREATE POLICY tags_select_policy ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY tags_insert_policy ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY tags_update_policy ON tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY tags_delete_policy ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- Create material_tags join table
CREATE TABLE material_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(material_id, tag_id)
);

-- Enable RLS on material_tags table
ALTER TABLE material_tags ENABLE ROW LEVEL SECURITY;

-- Users can only see material tags from their own materials and tags
CREATE POLICY material_tags_select_policy ON material_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM materials
      WHERE materials.id = material_tags.material_id
      AND materials.user_id = auth.uid()
    ) AND EXISTS (
      SELECT 1 FROM tags
      WHERE tags.id = material_tags.tag_id
      AND tags.user_id = auth.uid()
    )
  );

CREATE POLICY material_tags_insert_policy ON material_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM materials
      WHERE materials.id = material_tags.material_id
      AND materials.user_id = auth.uid()
    ) AND EXISTS (
      SELECT 1 FROM tags
      WHERE tags.id = material_tags.tag_id
      AND tags.user_id = auth.uid()
    )
  );

CREATE POLICY material_tags_delete_policy ON material_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM materials
      WHERE materials.id = material_tags.material_id
      AND materials.user_id = auth.uid()
    ) AND EXISTS (
      SELECT 1 FROM tags
      WHERE tags.id = material_tags.tag_id
      AND tags.user_id = auth.uid()
    )
  );

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tasks
CREATE POLICY tasks_select_policy ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY tasks_insert_policy ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY tasks_update_policy ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY tasks_delete_policy ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roster_items_updated_at BEFORE UPDATE ON roster_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_records_updated_at BEFORE UPDATE ON lesson_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();