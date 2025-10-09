import { Outlet, NavLink } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'
import { Button } from './ui/button'
import { Toaster } from 'react-hot-toast'
import { BackgroundPatternModal } from './BackgroundPatternModal'
import {
  Home,
  School,
  Calendar,
  BookOpen,
  CheckSquare,
  BarChart3,
  Sun,
  Moon,
  Languages,
  LogOut
} from 'lucide-react'
import '../styles/backgroundPatterns.css'

export function Layout() {
  const { isDarkMode, isRTL, toggleDarkMode, toggleRTL } = useAppStore()
  const { user, signOut } = useAuth()

  useEffect(() => {
    // Apply dark mode class
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Apply text direction
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
  }, [isDarkMode, isRTL])

  // Get user initials from email
  const getUserInitials = () => {
    if (!user?.email) return '?'
    const parts = user.email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return user.email.substring(0, 2).toUpperCase()
  }

  return (
    <>
      <Toaster position="top-right" />
      {/*
        Available background patterns (replace class to switch):
        - bg-pattern-dots (subtle dotted grid)
        - bg-pattern-grid (geometric grid lines)
        - bg-pattern-diagonal (diagonal stripes)
        - bg-pattern-topo (topographic waves)
        - bg-pattern-hexagon (hexagonal pattern)
        - bg-pattern-circuit (circuit board tech theme)
        - bg-pattern-mesh (gradient mesh abstract)
        - bg-pattern-noise (subtle noise texture)
        - bg-pattern-waves (flowing wave pattern)
        - bg-gradient-enhanced (enhanced gradient - default)
      */}
      <div className="min-h-screen bg-gradient-enhanced text-gray-900 dark:text-white">
        <header className="sticky top-0 z-40 w-full border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-700 via-slate-800 to-indigo-900 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                Teacher Scheduler
              </h1>
              <div className="flex gap-2 items-center">
                {user && (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                      {user.email?.split('@')[0]}
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {getUserInitials()}
                    </div>
                  </div>
                )}
                <BackgroundPatternModal />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleDarkMode}
                  title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleRTL}
                  title="Toggle text direction"
                >
                  <Languages size={18} />
                </Button>
                {user && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => signOut()}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <LogOut size={18} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>
      
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 py-4 px-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              <Home size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink
              to="/schools"
              className={({ isActive }) =>
                `flex items-center gap-2 py-4 px-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              <School size={18} />
              <span className="hidden sm:inline">Schools</span>
            </NavLink>
            <NavLink
              to="/lessons"
              className={({ isActive }) =>
                `flex items-center gap-2 py-4 px-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              <Calendar size={18} />
              <span className="hidden sm:inline">Lessons</span>
            </NavLink>
            <NavLink
              to="/lesson-plans"
              className={({ isActive }) =>
                `flex items-center gap-2 py-4 px-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              <BookOpen size={18} />
              <span className="hidden sm:inline">Plans</span>
            </NavLink>
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                `flex items-center gap-2 py-4 px-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              <CheckSquare size={18} />
              <span className="hidden sm:inline">Tasks</span>
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center gap-2 py-4 px-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              <BarChart3 size={18} />
              <span className="hidden sm:inline">Reports</span>
            </NavLink>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      </div>
    </>
  )
}