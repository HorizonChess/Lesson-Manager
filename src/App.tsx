import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="schools" element={<div>Schools (Coming Soon)</div>} />
        <Route path="groups" element={<div>Groups (Coming Soon)</div>} />
        <Route path="lessons" element={<div>Lessons (Coming Soon)</div>} />
        <Route path="materials" element={<div>Materials (Coming Soon)</div>} />
        <Route path="tasks" element={<div>Tasks (Coming Soon)</div>} />
        <Route path="reports" element={<div>Reports (Coming Soon)</div>} />
      </Route>
    </Routes>
  )
}

export default App
