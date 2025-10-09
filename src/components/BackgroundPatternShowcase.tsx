import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import '../styles/backgroundPatterns.css'

const patterns = [
  { name: 'Enhanced Gradient', class: 'bg-gradient-enhanced', description: 'Subtle gradient with radial accents - Modern & Clean' },
  { name: 'Dotted Grid', class: 'bg-pattern-dots', description: 'Professional dotted pattern - Minimal & Elegant' },
  { name: 'Grid Lines', class: 'bg-pattern-grid', description: 'Geometric grid pattern - Technical & Precise' },
  { name: 'Diagonal Stripes', class: 'bg-pattern-diagonal', description: 'Diagonal line pattern - Dynamic & Energetic' },
  { name: 'Topographic', class: 'bg-pattern-topo', description: 'Organic wave contours - Natural & Flowing' },
  { name: 'Hexagonal', class: 'bg-pattern-hexagon', description: 'Hexagonal geometry - Modern & Structured' },
  { name: 'Circuit Board', class: 'bg-pattern-circuit', description: 'Tech-inspired circuit - Digital & Connected' },
  { name: 'Gradient Mesh', class: 'bg-pattern-mesh', description: 'Abstract color mesh - Creative & Vibrant' },
  { name: 'Noise Texture', class: 'bg-pattern-noise', description: 'Subtle noise grain - Premium & Refined' },
  { name: 'Flowing Waves', class: 'bg-pattern-waves', description: 'Radial wave pattern - Calm & Organic' },
]

export function BackgroundPatternShowcase() {
  const [selectedPattern, setSelectedPattern] = useState(patterns[0].class)

  const copyToClipboard = (className: string) => {
    navigator.clipboard.writeText(className)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Background Pattern Showcase</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Preview different background patterns. Click on a pattern to see it applied below.
        </p>
      </div>

      {/* Pattern Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patterns.map((pattern) => (
          <Card
            key={pattern.class}
            className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
              selectedPattern === pattern.class ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedPattern(pattern.class)}
          >
            {/* Pattern Preview */}
            <div className={`h-32 ${pattern.class} border-b dark:border-gray-700`} />

            {/* Pattern Info */}
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-1">{pattern.name}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
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

      {/* Full Preview */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Full Screen Preview</h3>
        <div className={`${selectedPattern} rounded-lg border dark:border-gray-700 p-8 min-h-96 flex items-center justify-center`}>
          <Card className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <div className="p-6">
              <h4 className="text-xl font-bold mb-2">Sample Content</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This is how your content will look over the selected background pattern.
                The pattern is subtle enough to not distract from the content.
              </p>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <div className="p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            How to Apply a Pattern
          </h4>
          <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Choose your favorite pattern from the grid above</li>
            <li>Copy the class name by clicking the button</li>
            <li>Open <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">src/components/Layout.tsx</code></li>
            <li>Replace the <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">bg-gradient-enhanced</code> class on line 63</li>
            <li>Save and see the changes!</li>
          </ol>
        </div>
      </Card>
    </div>
  )
}
