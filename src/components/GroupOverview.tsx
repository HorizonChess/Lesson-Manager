import { useState } from 'react'
import type { Group, School, Subject } from '../types/database'

interface GroupOverviewProps {
  group: Group
  school: School
  subject: Subject
  onClose: () => void
  onGroupUpdate?: (updatedGroup: Group) => void
}

type TabType = 'students' | 'attendance' | 'lessons' | 'settings'

export function GroupOverview({ group, school, subject, onClose, onGroupUpdate }: GroupOverviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('students')

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '✓' },
    { id: 'lessons', label: 'Lessons', icon: '📚' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'students':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Students in {group.name}</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                Add Student
              </button>
            </div>
            <div className="text-gray-500 text-center py-8">
              Student management will be implemented in M8.7
            </div>
          </div>
        )

      case 'attendance':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Attendance History</h3>
            <div className="text-gray-500 text-center py-8">
              Attendance integration will be implemented in M8.8
            </div>
          </div>
        )

      case 'lessons':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Lessons</h3>
            <div className="text-gray-500 text-center py-8">
              Lesson management will be implemented in M8.9
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Group Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name
                </label>
                <div className="text-gray-900 dark:text-white font-medium">{group.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  School
                </label>
                <div className="text-gray-900 dark:text-white">{school.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <div className="text-gray-900 dark:text-white">{subject.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule
                </label>
                <div className="space-y-1">
                  {group.timeslots && group.timeslots.length > 0 ? (
                    group.timeslots.map((slot: any, index: number) => (
                      <div key={index} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {slot.day} {slot.startTime} - {slot.endTime}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm italic">No schedule set</div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-gray-500 text-center py-4">
              Settings editing will be implemented in M8.7
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6" aria-label="Group tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto" role="tabpanel">
        {renderTabContent()}
      </div>
    </div>
  )
}