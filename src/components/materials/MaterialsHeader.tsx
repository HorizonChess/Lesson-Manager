import { Button } from '../ui/button'
import { Plus, Tag } from 'lucide-react'

interface MaterialsHeaderProps {
  onAddTag: () => void
  onAddMaterial: () => void
}

export function MaterialsHeader({ onAddTag, onAddMaterial }: MaterialsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lesson Plans Library</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Organize reusable lesson plans and attach them to lessons.</p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onAddTag}
          className="bg-green-600 hover:bg-green-700"
        >
          <Tag size={16} className="mr-2" />
          Add Tag
        </Button>
        <Button onClick={onAddMaterial}>
          <Plus size={16} className="mr-2" />
          Add Lesson Plan
        </Button>
      </div>
    </div>
  )
}
