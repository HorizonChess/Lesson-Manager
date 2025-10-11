import type { ChangeEvent, FormEvent } from 'react'
import type { TagWithSubject } from '../../services/materials'

interface MaterialCreateFormProps {
  tags: TagWithSubject[]
  title: string
  description: string
  fileUrl: string
  selectedTagIds: string[]
  onChange: (field: 'title' | 'description' | 'file_url', value: string) => void
  onToggleTag: (tagId: string, checked: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function MaterialCreateForm({
  tags,
  title,
  description,
  fileUrl,
  selectedTagIds,
  onChange,
  onToggleTag,
  onSubmit,
  onCancel
}: MaterialCreateFormProps) {
  const handleInputChange = (field: 'title' | 'description' | 'file_url') => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(field, event.target.value)
  }

  const handleTagToggle = (tagId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    onToggleTag(tagId, event.target.checked)
  }

  return (
    <div className="surface-section p-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="material-title" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title *
          </label>
          <input
            id="material-title"
            type="text"
            value={title}
            onChange={handleInputChange('title')}
            placeholder="Lesson plan title"
            className="surface-input w-full px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="material-description" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            id="material-description"
            value={description}
            onChange={handleInputChange('description')}
            placeholder="Lesson plan description"
            rows={3}
            className="surface-input w-full px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="material-file" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            File URL
          </label>
          <input
            id="material-file"
            type="url"
            value={fileUrl}
            onChange={handleInputChange('file_url')}
            placeholder="https://example.com/file.pdf"
            className="surface-input w-full px-3 py-2 text-sm"
          />
        </div>

        {tags.length > 0 && (
          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</span>
            <div className="grid gap-2 md:grid-cols-3">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={handleTagToggle(tag.id)}
                    className="h-4 w-4"
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Lesson Plan
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="surface-chip px-4 py-2 text-sm font-medium transition hover:opacity-85"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
