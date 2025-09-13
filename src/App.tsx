import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Schools } from './pages/Schools'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="schools" element={<Schools />} />
          <Route path="groups" element={<div>Groups (Coming Soon)</div>} />
          <Route path="lessons" element={<div>Lessons (Coming Soon)</div>} />
          <Route path="materials" element={<div>Materials (Coming Soon)</div>} />
          <Route path="tasks" element={<div>Tasks (Coming Soon)</div>} />
          <Route path="reports" element={<div>Reports (Coming Soon)</div>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
