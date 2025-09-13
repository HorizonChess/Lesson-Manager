import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Schools } from './pages/Schools'
import { Lessons } from './pages/Lessons'
import { Materials } from './pages/Materials'
import { Tasks } from './pages/Tasks'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="schools" element={<Schools />} />
          <Route path="lessons" element={<Lessons />} />
          <Route path="lesson-plans" element={<Materials />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="reports" element={<div>Reports (Coming Soon)</div>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
