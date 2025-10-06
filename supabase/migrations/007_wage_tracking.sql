-- Migration: Wage tracking for salary reports
-- Allows users to set default hourly wage with exceptions per school/group

-- Step 1: Create wage_settings table
CREATE TABLE wage_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'NIS',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Step 2: Create wage_exceptions table for school/group overrides
CREATE TABLE wage_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure only one type of exception per record
  CHECK (
    (school_id IS NOT NULL AND group_id IS NULL) OR
    (school_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Step 2b: Create partial unique indexes to prevent duplicate exceptions
CREATE UNIQUE INDEX wage_exceptions_unique_school
  ON wage_exceptions(user_id, school_id)
  WHERE school_id IS NOT NULL;

CREATE UNIQUE INDEX wage_exceptions_unique_group
  ON wage_exceptions(user_id, group_id)
  WHERE group_id IS NOT NULL;

-- Step 3: Enable RLS
ALTER TABLE wage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wage_exceptions ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS policies for wage_settings
CREATE POLICY wage_settings_select_policy ON wage_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY wage_settings_insert_policy ON wage_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY wage_settings_update_policy ON wage_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY wage_settings_delete_policy ON wage_settings
  FOR DELETE USING (user_id = auth.uid());

-- Step 5: RLS policies for wage_exceptions
CREATE POLICY wage_exceptions_select_policy ON wage_exceptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY wage_exceptions_insert_policy ON wage_exceptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY wage_exceptions_update_policy ON wage_exceptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY wage_exceptions_delete_policy ON wage_exceptions
  FOR DELETE USING (user_id = auth.uid());

-- Step 6: Create indexes for performance
CREATE INDEX idx_wage_settings_user_id ON wage_settings(user_id);
CREATE INDEX idx_wage_exceptions_user_id ON wage_exceptions(user_id);
CREATE INDEX idx_wage_exceptions_school_id ON wage_exceptions(school_id);
CREATE INDEX idx_wage_exceptions_group_id ON wage_exceptions(group_id);

-- Step 7: Add updated_at trigger for wage_settings
CREATE OR REPLACE FUNCTION update_wage_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wage_settings_updated_at
  BEFORE UPDATE ON wage_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_wage_settings_updated_at();

-- Step 8: Add updated_at trigger for wage_exceptions
CREATE OR REPLACE FUNCTION update_wage_exceptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wage_exceptions_updated_at
  BEFORE UPDATE ON wage_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION update_wage_exceptions_updated_at();
