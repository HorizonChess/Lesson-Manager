import type { ChangeEvent } from 'react'
import type { MaterialWithTags, TagWithSubject } from '../../services/materials'

interface MaterialsGridProps {
  materials: MaterialWithTags[]
  allCount: number
  tags: TagWithSubject[]
  editingMaterialId: string | null
  editMaterial: { title: string; description: string; file_url: string }
  editingTagIds: string[]
  onStartEdit: (material: MaterialWithTags) => void
  onChangeField: (field: 'title' | 'description' | 'file_url', value: string) => void
  onToggleTag: (tagId: string, checked: boolean) => void
  onSave: (materialId: string) => void
  onCancel: () => void
  onDelete: (materialId: string) => void
}

export function MaterialsGrid({
  materials,
  allCount,
  tags,
  editingMaterialId,
  editMaterial,
  editingTagIds,
  onStartEdit,
  onChangeField,
  onToggleTag,
  onSave,
  onCancel,
  onDelete
}: MaterialsGridProps) {
  if (materials.length === 0) {
    return (
      <div className="surface-panel col-span-full border border-dashed border-white/40 py-12 text-center text-sm text-slate-600 dark:text-slate-300">
        {allCount === 0
          ? 'No lesson plans yet. Add your first lesson plan to get started!'
          : 'No lesson plans match the current filters.'}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {materials.map((material) => (
        <MaterialCard
          key={material.id}
          material={material}
          tags={tags}
          isEditing={editingMaterialId === material.id}
          editMaterial={editMaterial}
          editingTagIds={editingTagIds}
          onStartEdit={onStartEdit}
          onChangeField={onChangeField}
          onToggleTag={onToggleTag}
          onSave={onSave}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

interface MaterialCardProps {
  material: MaterialWithTags
  tags: TagWithSubject[]
  isEditing: boolean
  editMaterial: { title: string; description: string; file_url: string }
  editingTagIds: string[]
  onStartEdit: (material: MaterialWithTags) => void
  onChangeField: (field: 'title' | 'description' | 'file_url', value: string) => void
  onToggleTag: (tagId: string, checked: boolean) => void
  onSave: (materialId: string) => void
  onCancel: () => void
  onDelete: (materialId: string) => void
}

function MaterialCard({
  material,
  tags,
  isEditing,
  editMaterial,
  editingTagIds,
  onStartEdit,
  onChangeField,
  onToggleTag,
  onSave,
  onCancel,
  onDelete
}: MaterialCardProps) {
  const handleChange = (field: 'title' | 'description' | 'file_url') => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChangeField(field, event.target.value)
  }

  const handleTagToggle = (tagId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    onToggleTag(tagId, event.target.checked)
  }

  return (
    <div className="surface-panel p-4">
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editMaterial.title}
            onChange={handleChange('title')}
            className="w-full border-b border-blue-500 bg-transparent text-base font-semibold focus:outline-none"
            autoFocus
          />
          <textarea
            value={editMaterial.description}
            onChange={handleChange('description')}
            rows={2}
            className="w-full resize-none border-b border-blue-500 bg-transparent text-sm focus:outline-none"
            placeholder="Description"
          />
          <input
            type="url"
            value={editMaterial.file_url}
            onChange={handleChange('file_url')}
            className="w-full border-b border-blue-500 bg-transparent text-sm focus:outline-none"
            placeholder="File URL"
          />

          {tags.length > 0 && (
            <div>
              <span className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">Tags</span>
              <div className="grid grid-cols-2 gap-1">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={editingTagIds.includes(tag.id)}
                      onChange={handleTagToggle(tag.id)}
                      className="h-3 w-3"
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSave(material.id)}
              className="text-xs font-medium text-green-600 transition hover:text-green-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-medium text-gray-600 transition hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{material.title}</h3>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onStartEdit(material)}
                className="rounded px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/40"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(material.id)}
                className="rounded px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/40"
              >
                Delete
              </button>
            </div>
          </div>

          {material.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300">{material.description}</p>
          )}

          {material.file_url && (
            <a
              href={material.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block break-all text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300"
            >
              View file
            </a>
          )}

          {material.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {material.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Created: {new Date(material.created_at).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
}
