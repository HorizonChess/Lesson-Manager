import { Outlet, NavLink } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'

export function Layout() {
  const { isDarkMode, isRTL, toggleDarkMode, toggleRTL } = useAppStore()
  const { user, signOut } = useAuth()

  useEffect(() => {
    document.documentElement.className = isDarkMode ? 'dark' : ''
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
  }, [isDarkMode, isRTL])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="bg-blue-600 dark:bg-blue-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Teacher Scheduler</h1>
          <div className="flex gap-2 items-center">
            {user && (
              <span className="text-sm text-blue-200">
                {user.email}
              </span>
            )}
            <button
              onClick={toggleDarkMode}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={toggleRTL}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm"
            >
              {isRTL ? 'LTR' : 'RTL'}
            </button>
            {user && (
              <button
                onClick={() => signOut()}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>
      
      <nav className="bg-gray-100 dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/schools"
              className={({ isActive }) =>
                `py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              School Overview
            </NavLink>
            <NavLink
              to="/groups"
              className={({ isActive }) =>
                `py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              Groups
            </NavLink>
            <NavLink
              to="/lessons"
              className={({ isActive }) =>
                `py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              Lessons
            </NavLink>
            <NavLink
              to="/lesson-plans"
              className={({ isActive }) =>
                `py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              Lesson Plans
            </NavLink>
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                `py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              Tasks
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              Reports
            </NavLink>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}