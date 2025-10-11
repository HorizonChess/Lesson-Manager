import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { cn } from '../lib/utils'
import '../styles/backgroundPatterns.css'

const patterns = [
  { name: 'Enhanced Gradient', class: 'bg-gradient-enhanced', description: 'Soft multi-hue gradient with radial glow accents' },
  { name: 'Wavescape', class: 'bg-asset-wave', description: 'Wave illustration with ambient overlay' },
  { name: 'Playful Pattern', class: 'bg-asset-pattern', description: 'Geometric pattern pairing light and dark variants' },
  { name: 'Aurora Abstract', class: 'bg-asset-abstract', description: 'Vibrant abstract blend with glass friendly contrast' }
]

export function BackgroundPatternShowcase() {
  const [selectedPattern, setSelectedPattern] = useState(patterns[0].class)

  const copyToClipboard = (className: string) => {
    navigator.clipboard.writeText(className)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Background Options</h2>
        <p className="text-slate-600 dark:text-slate-300">
          These are the curated backgrounds available inside the app. Select one to preview how it pairs with the glass surfaces.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {patterns.map((pattern) => (
          <Card
            key={pattern.class}
            className={cn('overflow-hidden cursor-pointer transition hover:-translate-y-0.5 hover:shadow-2xl', selectedPattern === pattern.class && 'ring-2 ring-blue-400')}
            onClick={() => setSelectedPattern(pattern.class)}
          >
            <div className={cn('h-28 border-b border-white/20 dark:border-white/10', pattern.class)} />
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-1 text-slate-900 dark:text-slate-100">{pattern.name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                {pattern.description}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(pattern.class)
                }}
              >
                Copy Class Name
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Full Screen Preview</h3>
        <div className={cn('rounded-2xl border border-white/20 p-8 min-h-96 flex items-center justify-center', selectedPattern)}>
          <Card className="max-w-md w-full">
            <div className="p-6 space-y-3">
              <h4 className="text-xl font-bold">Sample Content</h4>
              <p className="text-slate-600 dark:text-slate-300">
                This demonstrates the contrast of cards, chips, and form controls relative to the selected background.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="surface-chip">Attendance</span>
                <span className="surface-chip">Scheduling</span>
                <span className="surface-chip">Analytics</span>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="h-10 surface-panel animate-pulse" />
                <div className="h-10 surface-panel animate-pulse" />
                <div className="h-10 surface-panel animate-pulse" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="surface-panel border border-blue-200/60 dark:border-blue-400/40">
        <div className="p-4 space-y-1 text-sm text-slate-700 dark:text-slate-200">
          <p>To apply one of these backgrounds manually, update the class on the <code className="px-1 rounded bg-white/60 dark:bg-white/10">min-h-screen</code> container inside <code className="px-1 rounded bg-white/60 dark:bg-white/10">src/components/Layout.tsx</code>.</p>
          <p>Changes made through the UI are stored in <code className="px-1 rounded bg-white/60 dark:bg-white/10">localStorage</code>.</p>
        </div>
      </Card>
    </div>
  )
}
