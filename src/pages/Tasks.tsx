import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Task, Group, Lesson } from '../types/database'

interface TaskWithRelations extends Task {
  group?: {
    name: string
    school: { name: string }
    subject: { name: string }
  }
  lesson?: {
    start_time: string
    group: {
      name: string
      school: { name: string }
      subject: { name: string }
    }
  }
}

export function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    group_id: '',
    lesson_id: ''
  })

  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    group_id: '',
    lesson_id: ''
  })

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'completed'>('all')
  const [linkFilter, setLinkFilter] = useState<'all' | 'group' | 'lesson' | 'unlinked'>('all')

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          school:schools(name),
          subject:subjects(name)
        `)
        .order('name')

      if (groupsError) throw groupsError

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          group:groups(
            name,
            school:schools(name),
            subject:subjects(name)
          )
        `)
        .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days and future
        .order('start_time')

      if (lessonsError) throw lessonsError

      // Fetch tasks with relations
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          group:groups(
            name,
            school:schools(name),
            subject:subjects(name)
          ),
          lesson:lessons(
            start_time,
            group:groups(
              name,
              school:schools(name),
              subject:subjects(name)
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError

      setGroups(groupsData || [])
      setLessons(lessonsData || [])
      setTasks(tasksData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim() || !user) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          group_id: newTask.group_id || null,
          lesson_id: newTask.lesson_id || null,
          is_completed: false,
        })
        .select(`
          *,
          group:groups(
            name,
            school:schools(name),
            subject:subjects(name)
          ),
          lesson:lessons(
            start_time,
            group:groups(
              name,
              school:schools(name),
              subject:subjects(name)
            )
          )
        `)
        .single()

      if (error) throw error

      setTasks([data, ...tasks])
      setNewTask({ title: '', description: '', group_id: '', lesson_id: '' })
      setShowAddTask(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateTask = async (taskId: string) => {
    if (!editTask.title.trim()) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: editTask.title.trim(),
          description: editTask.description.trim() || null,
          group_id: editTask.group_id || null,
          lesson_id: editTask.lesson_id || null,
        })
        .eq('id', taskId)
        .select(`
          *,
          group:groups(
            name,
            school:schools(name),
            subject:subjects(name)
          ),
          lesson:lessons(
            start_time,
            group:groups(
              name,
              school:schools(name),
              subject:subjects(name)
            )
          )
        `)
        .single()

      if (error) throw error

      setTasks(tasks.map(t => t.id === taskId ? data : t))
      setEditingTask(null)
      setEditTask({ title: '', description: '', group_id: '', lesson_id: '' })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_completed: !currentStatus })
        .eq('id', taskId)
        .select(`
          *,
          group:groups(
            name,
            school:schools(name),
            subject:subjects(name)
          ),
          lesson:lessons(
            start_time,
            group:groups(
              name,
              school:schools(name),
              subject:subjects(name)
            )
          )
        `)
        .single()

      if (error) throw error

      setTasks(tasks.map(t => t.id === taskId ? data : t))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Navigate to group page (for future implementation)
  const navigateToGroup = (groupId: string) => {
    // This would navigate to the groups page with the specific group highlighted
    window.location.href = `/groups#${groupId}`
  }

  // Navigate to lesson page (for future implementation)
  const navigateToLesson = (lessonId: string) => {
    // This would navigate to the lessons page with the specific lesson highlighted
    window.location.href = `/lessons#${lessonId}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'open' && !task.is_completed) ||
      (statusFilter === 'completed' && task.is_completed)

    const matchesLink = linkFilter === 'all' ||
      (linkFilter === 'group' && task.group_id && !task.lesson_id) ||
      (linkFilter === 'lesson' && task.lesson_id) ||
      (linkFilter === 'unlinked' && !task.group_id && !task.lesson_id)

    return matchesStatus && matchesLink
  })

  const openTasksCount = tasks.filter(t => !t.is_completed).length
  const completedTasksCount = tasks.filter(t => t.is_completed).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-sm text-gray-500">
            {openTasksCount} open • {completedTasksCount} completed
          </p>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'completed')}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Linked to:</label>
          <select
            value={linkFilter}
            onChange={(e) => setLinkFilter(e.target.value as 'all' | 'group' | 'lesson' | 'unlinked')}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="group">Groups</option>
            <option value="lesson">Lessons</option>
            <option value="unlinked">Unlinked</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add Task Form */}
      {showAddTask && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <form onSubmit={addTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Task Title *</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Link to Group (optional)</label>
                <select
                  value={newTask.group_id}
                  onChange={(e) => {
                    setNewTask({
                      ...newTask,
                      group_id: e.target.value,
                      lesson_id: '' // Clear lesson if group is selected
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">No group</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({(group as any).school?.name} • {(group as any).subject?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Link to Lesson (optional)</label>
                <select
                  value={newTask.lesson_id}
                  onChange={(e) => {
                    setNewTask({
                      ...newTask,
                      lesson_id: e.target.value,
                      group_id: '' // Clear group if lesson is selected
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">No lesson</option>
                  {lessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>
                      {(lesson as any).group?.name} - {new Date(lesson.start_time).toLocaleDateString()} {new Date(lesson.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Task
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddTask(false)
                  setNewTask({ title: '', description: '', group_id: '', lesson_id: '' })
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {tasks.length === 0
              ? 'No tasks yet. Add your first task to get started!'
              : 'No tasks match the current filters.'
            }
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white dark:bg-gray-800 border rounded-lg p-4 ${
                task.is_completed ? 'opacity-75' : ''
              }`}
            >
              {editingTask === task.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTask.title}
                    onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                    className="w-full font-semibold bg-transparent border-b border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <textarea
                    value={editTask.description}
                    onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                    rows={2}
                    className="w-full text-sm bg-transparent border-b border-blue-500 focus:outline-none resize-none"
                    placeholder="Description"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={editTask.group_id}
                      onChange={(e) => {
                        setEditTask({
                          ...editTask,
                          group_id: e.target.value,
                          lesson_id: e.target.value ? '' : editTask.lesson_id
                        })
                      }}
                      className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="">No group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({(group as any).school?.name})
                        </option>
                      ))}
                    </select>

                    <select
                      value={editTask.lesson_id}
                      onChange={(e) => {
                        setEditTask({
                          ...editTask,
                          lesson_id: e.target.value,
                          group_id: e.target.value ? '' : editTask.group_id
                        })
                      }}
                      className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="">No lesson</option>
                      {lessons.map(lesson => (
                        <option key={lesson.id} value={lesson.id}>
                          {(lesson as any).group?.name} - {new Date(lesson.start_time).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateTask(task.id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingTask(null)
                        setEditTask({ title: '', description: '', group_id: '', lesson_id: '' })
                      }}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      task.is_completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {task.is_completed && '✓'}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${task.is_completed ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </div>

                    {task.description && (
                      <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>

                      {task.group && (
                        <button
                          onClick={() => navigateToGroup(task.group_id!)}
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          Group: {task.group.name} →
                        </button>
                      )}

                      {task.lesson && (
                        <button
                          onClick={() => navigateToLesson(task.lesson_id!)}
                          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-800"
                        >
                          Lesson: {task.lesson.group.name} ({new Date(task.lesson.start_time).toLocaleDateString()}) →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => {
                        setEditingTask(task.id)
                        setEditTask({
                          title: task.title,
                          description: task.description || '',
                          group_id: task.group_id || '',
                          lesson_id: task.lesson_id || ''
                        })
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}