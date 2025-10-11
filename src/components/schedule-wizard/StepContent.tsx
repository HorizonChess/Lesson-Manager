import type { UseScheduleWizardState } from '../../hooks/useScheduleWizard'
import { SchoolConfigStep } from './steps/SchoolConfigStep'
import { PreviewStep } from './steps/PreviewStep'

interface ScheduleWizardStepContentProps {
  wizard: UseScheduleWizardState
}

export function ScheduleWizardStepContent({ wizard }: ScheduleWizardStepContentProps) {
  const {
    currentWizardStep,
    currentStep,
    keepExistingData,
    schoolCount,
    schools,
    groupNamingStrategy,
    setKeepExistingData,
    setSchoolCount,
    setSchools,
    setGroupNamingStrategy
  } = wizard

  switch (currentWizardStep.id) {
    case 'intro':
      return (
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Schedule Builder Wizard</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              I'll help you set up your complete teaching schedule quickly and easily.
              This wizard will guide you through creating schools, subjects, groups, and recurring lessons.
            </p>
          </div>
        </div>
      )

    case 'existing-data':
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Existing Data Detected</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              I noticed you already have lessons planned for this year. What would you like to do?
            </p>
          </div>
          <div className="space-y-3">
            <label className="surface-section-muted flex items-center p-3 cursor-pointer transition hover:opacity-95">
              <input
                type="radio"
                name="existing-data"
                className="h-4 w-4 text-blue-600"
                onChange={() => setKeepExistingData(true)}
                checked={keepExistingData === true}
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Keep existing lessons</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">I'll add to your current schedule</div>
              </div>
            </label>
            <label className="surface-section-muted flex items-center p-3 cursor-pointer transition hover:opacity-95">
              <input
                type="radio"
                name="existing-data"
                className="h-4 w-4 text-blue-600"
                onChange={() => setKeepExistingData(false)}
                checked={keepExistingData === false}
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Remove and start fresh</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">I'll clear everything and create a new schedule</div>
              </div>
            </label>
          </div>
        </div>
      )

    case 'school-count':
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">How many schools?</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              How many schools are you teaching in this year?
            </p>
          </div>
          <div className="flex justify-center">
            <input
              type="number"
              min="1"
              max="10"
              value={schoolCount}
              onChange={(e) => setSchoolCount(parseInt(e.target.value, 10) || 1)}
              className="w-24 text-center text-2xl font-bold border-2 border-blue-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )

    case 'school-names':
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">School Names</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Enter the names of your {schoolCount} school{schoolCount > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-3">
            {schools.map((school, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  School {index + 1}
                </label>
                <input
                  type="text"
                  value={school.name}
                  onChange={(e) => {
                    const newSchools = [...schools]
                    newSchools[index].name = e.target.value
                    setSchools(newSchools)
                  }}
                  className="surface-input w-full px-3 py-2"
                  placeholder={`Enter name for school ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      )

    case 'school-config':
      return <SchoolConfigStep wizard={wizard} />

    case 'group-naming':
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Group Naming Strategy</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              How would you like to name the groups in each school?
            </p>
          </div>
          <div className="space-y-3">
            <label className="surface-section-muted flex items-center p-3 cursor-pointer transition hover:opacity-95">
              <input
                type="radio"
                name="group-naming"
                className="h-4 w-4 text-blue-600"
                checked={groupNamingStrategy === 'default'}
                onChange={() => setGroupNamingStrategy('default')}
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Use smart defaults</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Groups will be named automatically (Group 1, Group 2, ...)</div>
              </div>
            </label>
            <label className="surface-section-muted flex items-center p-3 cursor-pointer transition hover:opacity-95">
              <input
                type="radio"
                name="group-naming"
                className="h-4 w-4 text-blue-600"
                checked={groupNamingStrategy === 'individual'}
                onChange={() => setGroupNamingStrategy('individual')}
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Name each group myself</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">You'll enter names during the preview step</div>
              </div>
            </label>
          </div>
        </div>
      )

    case 'preview':
      return <PreviewStep wizard={wizard} />

    case 'complete':
      return (
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
         
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Schedule Created Successfully!</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your complete teaching schedule has been generated. You can now view and manage your lessons, groups, and schools.
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="text-sm text-green-800 dark:text-green-300">
              <strong>What was created:</strong>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>{schools.length} school{schools.length > 1 ? 's' : ''}</li>
                <li>{schools.length} subject{schools.length > 1 ? 's' : ''} (General Teaching)</li>
                <li>{schools.reduce((sum, school) => sum + school.groupCount, 0)} groups</li>
                <li>Hundreds of recurring lessons for the full school year</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Visit the Lessons page to see your schedule in action!
          </p>
        </div>
      )

    default:
      return (
        <div className="text-center">
          <p className="text-gray-500">Step {currentStep + 1} content coming soon...</p>
        </div>
      )
  }
}
