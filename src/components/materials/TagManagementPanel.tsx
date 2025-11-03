import type { FormEvent, ChangeEvent } from 'react'
import type { Subject } from '../../types/database'
import type { TagWithSubject } from '../../services/materials'

interface TagManagementPanelProps {
  tags: TagWithSubject[]
  subjects: Subject[]
  collapsedSections: Set<string>
  onToggleSection: (sectionId: string) => void
  showAddTag: boolean
  onShowAddTagChange: (value: boolean) => void
  newTagName: string
  newTagSubject: string
  onTagNameChange: (value: string) => void
  onTagSubjectChange: (value: string) => void
  onAddTag: (event: FormEvent<HTMLFormElement>) => void
  onDeleteTag: (tagId: string) => void
}

export function TagManagementPanel({
  tags,
  subjects,
  collapsedSections,
  onToggleSection,
  showAddTag,
  onShowAddTagChange,
  newTagName,
  newTagSubject,
  onTagNameChange,
  onTagSubjectChange,
  onAddTag,
  onDeleteTag
}: TagManagementPanelProps) {
  const generalTags = tags.filter((tag) => !tag.subject_id)

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTagNameChange(event.target.value)
  }

  const handleSubjectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onTagSubjectChange(event.target.value)
  }

  const handleCancel = () => {
    onShowAddTagChange(false)
    onTagNameChange('')
    onTagSubjectChange('')
  }

  return (
    <div className="surface-section p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection('tags-root')}
          className="flex items-center gap-2 text-base font-medium text-gray-800 transition hover:text-blue-600 dark:text-gray-100 cursor-pointer"
        >
          <span className="text-lg">{collapsedSections.has('tags-root') ? '+' : '-'}</span>
          Tags ({tags.length})
        </button>
      </div>

      {!collapsedSections.has('tags-root') && (
        <div className="space-y-4">
          {showAddTag && (
            <form onSubmit={onAddTag} className="surface-panel space-y-3 p-4">
              <div>
                <label htmlFor="tag-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tag name
                </label>
                <input
                  id="tag-name"
                  type="text"
                  value={newTagName}
                  onChange={handleNameChange}
                  placeholder="e.g., Grammar, Reading comprehension"
                  className="surface-input w-full px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="tag-subject" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject (optional)
                </label>
                <select
                  id="tag-subject"
                  value={newTagSubject}
                  onChange={handleSubjectChange}
                  className="surface-input w-full px-3 py-2 text-sm"
                >
                  <option value="">General (not subject-specific)</option>
                  {subjects.map((subject) => {
                    const schoolName = (subject as unknown as { school?: { name?: string } }).school?.name
                    return (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}{schoolName ? ` (${schoolName})` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer"
                >
                  Add Tag
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="surface-chip text-sm font-medium px-4 py-2 transition hover:opacity-85 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {tags.length === 0 ? (
            <span className="text-sm text-gray-500">No tags created yet.</span>
          ) : (
            <div className="space-y-4">
              {generalTags.length > 0 && (
                <TagSection
                  sectionId="tags-general"
                  title={`General (${generalTags.length})`}
                  collapsedSections={collapsedSections}
                  onToggle={onToggleSection}
                  tags={generalTags}
                  onDeleteTag={onDeleteTag}
                />
              )}

              {subjects.map((subject) => {
                const subjectTags = tags.filter((tag) => tag.subject_id === subject.id)
                if (subjectTags.length === 0) {
                  return null
                }
                const schoolName = (subject as unknown as { school?: { name?: string } }).school?.name
                const title = schoolName ? `${subject.name} (${subjectTags.length}) / ${schoolName}` : `${subject.name} (${subjectTags.length})`
                return (
                  <TagSection
                    key={subject.id}
                    sectionId={`tags-${subject.id}`}
                    title={title}
                    collapsedSections={collapsedSections}
                    onToggle={onToggleSection}
                    tags={subjectTags}
                    onDeleteTag={onDeleteTag}
                    badgeVariant="subject"
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface TagSectionProps {
  sectionId: string
  title: string
  collapsedSections: Set<string>
  onToggle: (sectionId: string) => void
  tags: TagWithSubject[]
  onDeleteTag: (tagId: string) => void
  badgeVariant?: 'general' | 'subject'
}

function TagSection({
  sectionId,
  title,
  collapsedSections,
  onToggle,
  tags,
  onDeleteTag,
  badgeVariant = 'general'
}: TagSectionProps) {
  const isCollapsed = collapsedSections.has(sectionId)
  const badgeBase = 'surface-chip text-xs';
  const badgeClass = badgeVariant === 'subject'
    ? `${badgeBase} text-blue-700 dark:text-blue-200`
    : `${badgeBase} text-slate-700 dark:text-slate-200`

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(sectionId)}
        className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-blue-600 dark:text-gray-300 cursor-pointer"
      >
        <span className="text-xs">{isCollapsed ? '+' : '-'}</span>
        {title}
      </button>

      {!isCollapsed && (
        <div className="ml-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className={`inline-flex items-center gap-2 px-3 py-1 ${badgeClass}`}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => onDeleteTag(tag.id)}
                className="text-red-600 transition hover:text-red-800 cursor-pointer"
              >
                Delete
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
