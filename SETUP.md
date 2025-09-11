# Setup Instructions

## Phase 1 (M1) - Supabase Auth + User Bootstrap

This project has completed Phase 1 implementation. Here's what you need to do to run it:

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. In your Supabase dashboard, go to Settings > API
3. Copy the following:
   - Project URL
   - Anon (public) key

### 2. Environment Configuration

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema

Run the migration file in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the migration

This will create all tables with Row Level Security (RLS) enabled to ensure data isolation between users.

### 4. Authentication Providers (Optional)

To enable Google OAuth:

1. In your Supabase dashboard, go to Authentication > Providers
2. Enable Google provider
3. Configure with your Google OAuth credentials

### 5. Run the Application

```bash
npm install
npm run dev
```

## What's Implemented

✅ **Complete Authentication System:**
- Email/password sign-in and sign-up
- Google OAuth support
- Protected routes
- Automatic user bootstrapping
- Sign out functionality

✅ **Database Schema with RLS:**
- All core entities (users, schools, subjects, groups, lessons, etc.)
- Row Level Security policies for data isolation
- Automatic timestamps and triggers
- Proper foreign key relationships

✅ **User Interface:**
- Login/signup form with error handling
- Protected dashboard
- User info display in header
- Authentication status testing

## Testing Authentication

Once set up, you can:

1. Sign up with a new email/password
2. Sign in with existing credentials
3. Try Google OAuth (if configured)
4. Verify data isolation by checking the dashboard
5. Sign out and sign back in

The dashboard will show authentication status and user information to confirm everything is working correctly.

## Next Steps

Ready for Phase 2 (M2) - Schools & Subjects implementation!