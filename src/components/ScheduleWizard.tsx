import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react'
import { ScheduleWizardStepContent } from './schedule-wizard/StepContent'
import { useScheduleWizard } from '../hooks/useScheduleWizard'

export function ScheduleWizard() {
  const wizard = useScheduleWizard()
  const {
    isOpen,
    loading,
    currentStep,
    currentWizardStep,
    progressPercent,
    nextLabel,
    wizardSteps,
    openWizard,
    closeWizard,
    goToNextStep,
    goToPreviousStep,
    canProceed
  } = wizard

  return (
    <>
      <button
        onClick={openWizard}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Schedule Wizard
        </div>
      </button>

      <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="surface-modal w-full max-w-md overflow-hidden">
            <div className="px-6 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Step {currentStep + 1} of {wizardSteps.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(progressPercent)}%
                </div>
              </div>
              <div className="w-full bg-white/30 dark:bg-white/10 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="px-6 py-6">
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {currentWizardStep.title}
              </DialogTitle>
              <Description className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {currentWizardStep.description}
              </Description>

              <div className="max-h-[55vh] overflow-y-auto pr-1 sm:pr-2 space-y-4">
                <ScheduleWizardStepContent wizard={wizard} />
              </div>
            </div>

            <div className="surface-toolbar flex justify-between items-center px-6 py-4 rounded-b-xl">
              <button
                onClick={currentStep === 0 ? closeWizard : goToPreviousStep}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
              >
                {currentStep === 0 ? 'Cancel' : 'Back'}
              </button>
              {currentStep === wizardSteps.length - 1 ? (
                <button
                  onClick={closeWizard}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer"
                >
                  Done
                </button>
              ) : (
                <button
                  onClick={goToNextStep}
                  disabled={!canProceed() || loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  )}
                  {nextLabel}
                </button>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
