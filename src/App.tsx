import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Schools } from './pages/Schools'
import { Lessons } from './pages/Lessons'
import { Materials } from './pages/Materials'
import { Tasks } from './pages/Tasks'
import { Reports } from './pages/Reports'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

function App() {
  // CSS Debug: Verify Tailwind v4 is working correctly
  useEffect(() => {
    console.log('🎨 CSS Debug: Checking Tailwind v4')

    // Test dark mode variant
    const isDark = document.documentElement.classList.contains('dark')
    console.log('🌙 Dark mode active:', isDark)

    // Test @apply on h1 elements
    const h1 = document.querySelector('h1')
    if (h1) {
      const styles = getComputedStyle(h1)
      console.log('📏 h1 styles (should have @apply text-3xl font-bold):', {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        letterSpacing: styles.letterSpacing
      })
    }

    // Test surface-modal class
    setTimeout(() => {
      const modal = document.querySelector('.surface-modal')
      if (modal) {
        const styles = getComputedStyle(modal)
        console.log('🪟 Modal surface styles:', {
          background: styles.background,
          backdropFilter: styles.backdropFilter,
          border: styles.border
        })
      }
    }, 1000)
  }, [])

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="schools" element={<Schools />} />
          <Route path="lessons" element={<Lessons />} />
          <Route path="lesson-plans" element={<Materials />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
