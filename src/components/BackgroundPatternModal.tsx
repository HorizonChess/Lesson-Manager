import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from './ui/button'
import { Palette } from 'lucide-react'
import { cn } from '../lib/utils'
import '../styles/backgroundPatterns.css'

interface Pattern {
  name: string
  class: string
  description: string
}

const patterns: Pattern[] = [
  { name: 'Enhanced Gradient', class: 'bg-gradient-enhanced', description: 'Soft multi-hue gradient with subtle glow' },
  { name: 'Wavescape', class: 'bg-asset-wave', description: 'Illustrated wave background with glass overlay' },
  { name: 'Playful Pattern', class: 'bg-asset-pattern', description: 'Geometric pattern with paired light/dark variants' },
  { name: 'Aurora Abstract', class: 'bg-asset-abstract', description: 'Vibrant abstract blend with gentle grain' }
]

const defaultPattern = patterns[0].class

const legacyClasses = [
  'bg-pattern-dots',
  'bg-pattern-grid',
  'bg-pattern-diagonal',
  'bg-pattern-topo',
  'bg-pattern-hexagon',
  'bg-pattern-circuit',
  'bg-pattern-mesh',
  'bg-pattern-noise',
  'bg-pattern-waves'
]

const removableClasses = patterns.map((p) => p.class)

export function BackgroundPatternModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPattern, setCurrentPattern] = useState<string>(defaultPattern)
  const [previewPattern, setPreviewPattern] = useState<string>(defaultPattern)

  useEffect(() => {
    const saved = localStorage.getItem('background-pattern')
    const fallback = patterns.find((pattern) => pattern.class === saved) ?? patterns[0]
    setCurrentPattern(fallback.class)
    setPreviewPattern(fallback.class)
    applyPatternToShell(fallback.class)
  }, [])

  const applyPatternToShell = (patternClass: string) => {
    const mainShell = document.querySelector('.min-h-screen') as HTMLElement | null
    if (!mainShell) return

    ;[...legacyClasses, ...removableClasses].forEach((value) => {
      mainShell.classList.remove(value)
    })
    mainShell.classList.add(patternClass)
  }

  const handleApply = () => {
    setCurrentPattern(previewPattern)
    localStorage.setItem('background-pattern', previewPattern)
    applyPatternToShell(previewPattern)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setPreviewPattern(currentPattern)
    setIsOpen(false)
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        title="Change background pattern"
      >
        <Palette size={18} />
      </Button>

      <Modal isOpen={isOpen} onClose={handleCancel} title="Background"
        size="xl"
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Choose one of the curated background treatments. They pair with the glass surfaces automatically.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto pr-2">
            {patterns.map((pattern) => {
              const isSelected = previewPattern === pattern.class
              return (
                <button
                  key={pattern.class}
                  type="button"
                  onClick={() => setPreviewPattern(pattern.class)}
                  className={cn(
                    'surface-panel text-left transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    isSelected && 'ring-2 ring-blue-400'
                  )}
                >
                  <div className={cn('h-24 border-b border-white/10 dark:border-white/10 rounded-t-xl', pattern.class)} />
                  <div className="p-4">
                    <h3 className="font-medium text-sm mb-1 text-slate-900 dark:text-slate-100">{pattern.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {pattern.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Live preview</h4>
            <div className={cn('rounded-2xl border border-white/20 p-6 min-h-32 flex items-center justify-center', previewPattern)}>
              <div className="surface-panel max-w-sm w-full shadow-lg">
                <div className="p-4 space-y-2">
                  <h5 className="font-semibold">Sample Content</h5>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    This is how your primary surfaces will sit over the selected background.
                  </p>
                  <div className="flex gap-2">
                    <span className="surface-chip">Students</span>
                    <span className="surface-chip">Lessons</span>
                    <span className="surface-chip">Reports</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-white/10 dark:border-white/5">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply background
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
