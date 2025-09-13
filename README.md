# Teacher Scheduler — React + Supabase MVP

A single-teacher application for managing multiple schools, subjects, groups, lessons, materials, attendance, and tasks. Built with React + TypeScript, Supabase, and designed mobile-first with RTL support.

## 🎯 Project Vision

Single-teacher app to manage multiple schools, multiple subjects per school, groups, lessons, lesson records, materials, attendance, tasks, and basic reports. Mobile-first, offline-friendly, RTL-ready.

## ✅ Current Status

**Phase 2 Complete** — Schools & Subjects management fully implemented

- **M0 ✅**: Project skeleton with React + TypeScript + Vite + Tailwind + RTL toggle
- **M1 ✅**: Supabase Auth + User bootstrap - Authentication verified working
- **M2 ✅**: Schools & Subjects CRUD - Full implementation with user testing

**🎯 Next: M3** — Groups & Roster implementation

## 🚀 Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create `.env.local` file with your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with RTL support
- **Backend**: Supabase (Auth, Database, Storage)
- **State Management**: TanStack Query + Context
- **Database**: PostgreSQL with Row Level Security (RLS)

## 📊 Database Schema

Current entities implemented:
- **Users**: Authentication and user management
- **Schools**: Multiple schools per user
- **Subjects**: Multiple subjects per school

Planned entities:
- Groups, Lessons, LessonRecords, Attendance, Materials, Tasks, Tags

## 🔐 Authentication

Authentication system verified working:
- Email/password sign-in
- User bootstrapping on first login
- Row Level Security (RLS) enabled
- User-specific data isolation confirmed

## 📱 Features Implemented

- ✅ Responsive mobile-first design
- ✅ Dark mode toggle
- ✅ RTL language support toggle
- ✅ User authentication & session management
- ✅ Schools management (Create, Read, Update, Delete)
- ✅ Subjects management per school
- ✅ Real-time UI updates with optimistic updates

## 🎯 Next Milestone: Groups & Roster

Implementing group creation with:
- School + Subject selection
- Timeslots metadata
- Student roster CRUD functionality

## 📋 Development Workflow

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## 🗂️ Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/        # React contexts (Auth, Theme)
├── lib/            # Supabase client and utilities
├── pages/          # Page components (Dashboard, Schools)
├── types/          # TypeScript type definitions
└── utils/          # Helper functions and test utilities
```
