import { useState } from 'react'
import type { Material } from '../../types/database'

interface LessonMaterialSelectorProps {
  isOpen: boolean
  materials: Material[]
  selectedMaterialIds: string[]
  onClose: () => void
  onAttach: (materialIds: string[]) => void
}

export function LessonMaterialSelector({
  isOpen,
  materials,
  selectedMaterialIds,
  onClose,
  onAttach
}: LessonMaterialSelectorProps) {
  const [localSelectedMaterials, setLocalSelectedMaterials] = useState<string[]>(selectedMaterialIds)

  if (!isOpen) return null

  const handleClose = () => {
    setLocalSelectedMaterials(selectedMaterialIds)
    onClose()
  }

  const handleAttach = () => {
    onAttach(localSelectedMaterials)
    setLocalSelectedMaterials([])
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="surface-modal w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col">
        <div className="surface-toolbar flex justify-between items-center rounded-none border-b border-white/20 px-4 py-4">
          <h3 className="text-lg font-bold">Select Lesson Plans to Attach</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {materials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No lesson plans found in your library.</p>
              <p className="text-sm mt-2">Visit the Lesson Plans page to create lesson plans first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((material) => (
                <label
                  key={material.id}
                  className="surface-section-muted flex items-start gap-3 p-3 cursor-pointer transition hover:opacity-95"
                >
                  <input
                    type="checkbox"
                    checked={localSelectedMaterials.includes(material.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLocalSelectedMaterials([...localSelectedMaterials, material.id])
                      } else {
                        setLocalSelectedMaterials(localSelectedMaterials.filter(id => id !== material.id))
                      }
                    }}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{material.title}</div>
                    {material.description && (
                      <div className="text-sm text-gray-500 mt-1">{material.description}</div>
                    )}
                    {material.file_url && (
                      <div className="text-xs text-blue-600 mt-1">Has attached file</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="surface-toolbar flex justify-end gap-2 rounded-none border-t border-white/20 px-4 py-4">
          <button
            onClick={handleClose}
            className="surface-chip px-4 py-2 text-slate-700 dark:text-slate-200 hover:opacity-85"
          >
            Cancel
          </button>
          <button
            onClick={handleAttach}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={materials.length === 0}
          >
            Attach {localSelectedMaterials.length} Plan{localSelectedMaterials.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}