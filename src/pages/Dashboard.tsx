export function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
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