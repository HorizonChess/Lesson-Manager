
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
        <button
          type="button"
          onClick={onAddTag}
          className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Add Tag
        </button>
        <button
          type="button"
          onClick={onAddMaterial}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Lesson Plan
        </button>
      </div>
    </div>
  )
}
