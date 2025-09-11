import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { testDataIsolation } from '../utils/testAuth'

export function Dashboard() {
  const { user } = useAuth()
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    if (user) {
      testDataIsolation().then(success => {
        setTestResult(success ? 'Authentication working correctly!' : 'Authentication test failed')
      })
    }
  }, [user])

  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
        <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">Dashboard</h2>
        <p className="text-green-700 dark:text-green-300 mt-2">
          ✅ Phase 1 (M1) Complete: Supabase Auth + User Bootstrap
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-green-600 dark:text-green-400">
            <strong>User:</strong> {user?.email}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            <strong>User ID:</strong> {user?.id}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            <strong>Auth Status:</strong> {testResult || 'Testing...'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Today's Lessons</h3>
          <p className="text-gray-600 dark:text-gray-400">No lessons scheduled</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">This Week</h3>
          <p className="text-gray-600 dark:text-gray-400">0 lessons</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Tasks</h3>
          <p className="text-gray-600 dark:text-gray-400">No pending tasks</p>
        </div>
      </div>
    </div>
  )
}