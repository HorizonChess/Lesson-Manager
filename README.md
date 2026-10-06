# Lesson Manager

A scheduling and record-keeping app for a teacher who works across several schools.
I built it for my own work teaching chess and debate in multiple schools, where I
needed one place to plan the week, take attendance, track what each group covered,
and work out how many hours (and how much pay) I had earned.

![Build](https://github.com/HorizonChess/Lesson-Manager/actions/workflows/ci.yml/badge.svg)

## What it does

- **Dashboard**: today's and this week's lessons, open tasks, and one-tap attendance.
- **Schools and groups**: each school has its subjects and groups, with weekly timeslots and a student roster.
- **Schedule wizard**: generates a term of recurring lessons from a group's timeslots, mapped onto the standard school day periods (45-minute academic hours).
- **Lesson records**: attendance, what was planned versus covered, homework, notes, and attached lesson plans.
- **Lesson plans library**: reusable, tagged materials that can be attached to any lesson.
- **Reports**: attendance rates, hours taught, curriculum coverage, and wage calculation, exportable to Excel.
- **Tasks**: a to-do list linked to groups and lessons.
- Mobile-first layout, dark mode, and right-to-left (Hebrew) support.

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Headless UI, Framer Motion |
| Data | Supabase (PostgreSQL, Auth, Row Level Security), TanStack Query, Zustand |
| Calendar and export | react-big-calendar, SheetJS (xlsx) |
| Testing | Node's built-in test runner, Playwright |

Every table is protected by Row Level Security, so each signed-in teacher can only
read and change their own data.

## Running it locally

You need Node.js 20 or newer and a free [Supabase](https://supabase.com) project.

```bash
git clone https://github.com/HorizonChess/Lesson-Manager.git
cd Lesson-Manager
npm install
cp .env.example .env    # then fill in your Supabase URL and anon key
npm run dev
```

Create the database tables by running the SQL files in `supabase/migrations/`, in
order, in the Supabase SQL editor.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Type-check and build the production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `node --test tests/scheduling.test.ts` | Run the scheduling unit tests |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
  pages/       one file per screen (Dashboard, Schools, Lessons, Reports, ...)
  components/  reusable UI, grouped by feature
  services/    all Supabase queries and mutations
  lib/         scheduling math and the Supabase client
  hooks/, stores/, contexts/, types/
supabase/migrations/  database schema
tests/                unit tests
docs/                 design notes and refactoring plans
```

More detail on the architecture is in [docs/project.md](docs/project.md).
