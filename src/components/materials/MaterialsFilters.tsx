import type { ChangeEvent } from 'react'
import type { TagWithSubject } from '../../services/materials'

interface MaterialsFiltersProps {
  tags: TagWithSubject[]
  searchValue: string
  tagFilter: string
  onSearchChange: (value: string) => void
  onTagFilterChange: (value: string) => void
}

export function MaterialsFilters({
  tags,
  searchValue,
  tagFilter,
  onSearchChange,
  onTagFilterChange
}: MaterialsFiltersProps) {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value)
  }

  const handleTagFilter = (event: ChangeEvent<HTMLSelectElement>) => {
    onTagFilterChange(event.target.value)
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="materials-search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
        <input
          id="materials-search"
          type="text"
          value={searchValue}
          onChange={handleSearch}
          placeholder="Search lesson plans..."
          className="surface-input px-3 py-2 text-sm"
        />
      </div>

      {tags.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="materials-tag-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Tag</label>
          <select
            id="materials-tag-filter"
            value={tagFilter}
            onChange={handleTagFilter}
            className="surface-input px-3 py-2 text-sm"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
