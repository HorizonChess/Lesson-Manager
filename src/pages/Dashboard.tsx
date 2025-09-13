import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { testDataIsolation } from '../utils/testAuth'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { manualBootstrap } from '../utils/bootstrapUser'

export function Dashboard() {
  const { user } = useAuth()
  const [testResult, setTestResult] = useState<string>('')
  const [stats, setStats] = useState({ schools: 0, subjects: 0 })

  useEffect(() => {
    console.log('Dashboard useEffect - user:', user)
    if (user) {
      console.log('User exists, running tests...')
      testDataIsolation().then(success => {
        const result = success ? 'Authentication working correctly!' : 'Authentication test failed'
        console.log('Test result:', result)
        setTestResult(result)
      })
      fetchStats()
    } else {
      console.log('No user found')
      setTestResult('No user authenticated')
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const { data: schools } = await supabase
        .from('schools')
        .select('id')
      
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id')

      setStats({
        schools: schools?.length || 0,
        subjects: subjects?.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleBootstrap = async () => {
    const success = await manualBootstrap()
    if (success) {
      // Refresh the auth test and stats
      testDataIsolation().then(success => {
        setTestResult(success ? 'Authentication working correctly!' : 'Authentication test failed')
      })
      fetchStats()
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
        <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">Dashboard</h2>
        <div className="mt-2 space-y-1">
          <p className="text-green-700 dark:text-green-300">
            ✅ Phase 1 (M1) Complete: Supabase Auth + User Bootstrap
          </p>
          <p className="text-green-700 dark:text-green-300">
            ✅ Phase 2 (M2) Complete: Schools & Subjects
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-sm">
            <p className="text-green-600 dark:text-green-400">
              <strong>User:</strong> {user?.email}
            </p>
            <p className="text-green-600 dark:text-green-400">
              <strong>Auth Status:</strong> {testResult || 'Testing...'}
            </p>
            {(testResult.includes('failed') || testResult === 'Testing...') && (
              <button
                onClick={handleBootstrap}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Fix User Setup
              </button>
            )}
          </div>
          <div className="text-sm">
            <p className="text-green-600 dark:text-green-400">
              <strong>Schools:</strong> {stats.schools}
            </p>
            <p className="text-green-600 dark:text-green-400">
              <strong>Subjects:</strong> {stats.subjects}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link 
          to="/schools" 
          className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 p-4 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
        >
          <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Schools & Subjects</h3>
          <p className="text-blue-600 dark:text-blue-400">
            {stats.schools} schools, {stats.subjects} subjects
          </p>
          <p className="text-sm text-blue-500 dark:text-blue-400 mt-2">
            Manage your educational institutions →
          </p>
        </Link>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Today's Lessons</h3>
          <p className="text-gray-600 dark:text-gray-400">No lessons scheduled</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Coming in Phase 4
          </p>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Tasks</h3>
          <p className="text-gray-600 dark:text-gray-400">No pending tasks</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Coming in Phase 8
          </p>
        </div>
      </div>
    </div>
  )
}