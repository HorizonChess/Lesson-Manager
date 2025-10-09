import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from './ui/button'
import { Palette } from 'lucide-react'
import '../styles/backgroundPatterns.css'

interface Pattern {
  name: string
  class: string
  description: string
}

const patterns: Pattern[] = [
  { name: 'Enhanced Gradient', class: 'bg-gradient-enhanced', description: 'Colorful gradient blend' },
  { name: 'Dotted Grid', class: 'bg-pattern-dots', description: 'Subtle dotted pattern' },
  { name: 'Grid Lines', class: 'bg-pattern-grid', description: 'Geometric grid' },
  { name: 'Diagonal Stripes', class: 'bg-pattern-diagonal', description: 'Dynamic diagonal lines' },
  { name: 'Topographic', class: 'bg-pattern-topo', description: 'Wave contours' },
  { name: 'Hexagonal', class: 'bg-pattern-hexagon', description: 'Hexagonal geometry' },
  { name: 'Circuit Board', class: 'bg-pattern-circuit', description: 'Tech circuit pattern' },
  { name: 'Gradient Mesh', class: 'bg-pattern-mesh', description: 'Abstract mesh' },
  { name: 'Noise Texture', class: 'bg-pattern-noise', description: 'Subtle noise grain' },
  { name: 'Flowing Waves', class: 'bg-pattern-waves', description: 'Radial waves' },
]

export function BackgroundPatternModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPattern, setCurrentPattern] = useState<string>('bg-gradient-enhanced')
  const [previewPattern, setPreviewPattern] = useState<string>('bg-gradient-enhanced')

  // Load saved pattern on mount
  useEffect(() => {
    const saved = localStorage.getItem('background-pattern')
    if (saved) {
      setCurrentPattern(saved)
      setPreviewPattern(saved)
      applyPatternToBody(saved)
    }
  }, [])

  const applyPatternToBody = (patternClass: string) => {
    const mainDiv = document.querySelector('.min-h-screen') as HTMLElement
    if (mainDiv) {
      // Remove all pattern classes
      patterns.forEach(p => mainDiv.classList.remove(p.class))
      // Add new pattern
      mainDiv.classList.add(patternClass)
    }
  }

  const handleApply = () => {
    setCurrentPattern(previewPattern)
    localStorage.setItem('background-pattern', previewPattern)
    applyPatternToBody(previewPattern)
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

      <Modal isOpen={isOpen} onClose={handleCancel} title="Background Pattern" size="xl">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose a background pattern for your app. Changes are saved automatically.
          </p>

          {/* Pattern Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2">
            {patterns.map((pattern) => (
              <button
                key={pattern.class}
                onClick={() => setPreviewPattern(pattern.class)}
                className={`text-left rounded-lg border-2 transition-all hover:shadow-md ${
                  previewPattern === pattern.class
                    ? 'border-blue-500 shadow-md'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Pattern Preview */}
                <div className={`h-20 ${pattern.class} rounded-t-lg border-b dark:border-gray-700`} />

                {/* Pattern Info */}
                <div className="p-3">
                  <h3 className="font-medium text-sm mb-1">{pattern.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {pattern.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Live Preview */}
          <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium mb-2">Preview</h4>
            <div className={`${previewPattern} rounded-lg border dark:border-gray-700 p-6 min-h-32 flex items-center justify-center`}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 shadow-md">
                <h5 className="font-semibold mb-1">Sample Content</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is how your app will look with this background.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-2 border-t dark:border-gray-700">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Background
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
