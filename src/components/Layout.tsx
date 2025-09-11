import { Outlet } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import { useEffect } from 'react'

export function Layout() {
  const { isDarkMode, isRTL, toggleDarkMode, toggleRTL } = useAppStore()

  useEffect(() => {
    document.documentElement.className = isDarkMode ? 'dark' : ''
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
  }, [isDarkMode, isRTL])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="bg-blue-600 dark:bg-blue-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Teacher Scheduler</h1>
          <div className="flex gap-2">
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
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}