import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { supabase } from '../lib/supabase'

interface WageException {
  id: string
  school_id: string | null
  group_id: string | null
  hourly_rate: number
  school_name?: string
  group_name?: string
}

interface ManageWagesModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function ManageWagesModal({ isOpen, onClose, userId }: ManageWagesModalProps) {
  const [defaultRate, setDefaultRate] = useState<string>('0')
  const [currency, setCurrency] = useState<string>('NIS')
  const [exceptions, setExceptions] = useState<WageException[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // New exception form
  const [showAddForm, setShowAddForm] = useState(false)
  const [exceptionType, setExceptionType] = useState<'school' | 'group'>('school')
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [exceptionRate, setExceptionRate] = useState('')

  useEffect(() => {
    if (isOpen && userId) {
      fetchWageSettings()
      fetchSchools()
      fetchGroups()
    }
  }, [isOpen, userId])

  const fetchWageSettings = async () => {
    try {
      // Fetch default rate
      const { data: settings, error: settingsError } = await supabase
        .from('wage_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = no rows
        throw settingsError
      }

      if (settings) {
        setDefaultRate(settings.default_hourly_rate.toString())
        setCurrency(settings.currency || 'NIS')
      }

      // Fetch exceptions
      const { data: exceptionsData, error: exceptionsError } = await supabase
        .from('wage_exceptions')
        .select(`
          *,
          schools:school_id(name),
          groups:group_id(name)
        `)
        .eq('user_id', userId)

      if (exceptionsError) throw exceptionsError

      const formattedExceptions = (exceptionsData || []).map(exc => ({
        id: exc.id,
        school_id: exc.school_id,
        group_id: exc.group_id,
        hourly_rate: exc.hourly_rate,
        school_name: exc.schools?.name,
        group_name: exc.groups?.name
      }))

      setExceptions(formattedExceptions)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchSchools = async () => {
    const { data } = await supabase
      .from('schools')
      .select('*')
      .order('name')

    setSchools(data || [])
  }

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('groups')
      .select('*, schools(name), subjects(name)')
      .order('name')

    setGroups(data || [])
  }

  const saveDefaultRate = async () => {
    try {
      setLoading(true)
      setError('')
      setSaved(false)

      const rate = parseFloat(defaultRate)
      if (isNaN(rate) || rate < 0) {
        throw new Error('Please enter a valid hourly rate')
      }

      const { error } = await supabase
        .from('wage_settings')
        .upsert(
          {
            user_id: userId,
            default_hourly_rate: rate,
            currency
          },
          {
            onConflict: 'user_id'
          }
        )

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addException = async () => {
    try {
      setLoading(true)
      setError('')

      const rate = parseFloat(exceptionRate)
      if (isNaN(rate) || rate < 0) {
        throw new Error('Please enter a valid hourly rate')
      }

      if (exceptionType === 'school' && !selectedSchoolId) {
        throw new Error('Please select a school')
      }

      if (exceptionType === 'group' && !selectedGroupId) {
        throw new Error('Please select a group')
      }

      const { error } = await supabase
        .from('wage_exceptions')
        .insert({
          user_id: userId,
          school_id: exceptionType === 'school' ? selectedSchoolId : null,
          group_id: exceptionType === 'group' ? selectedGroupId : null,
          hourly_rate: rate
        })

      if (error) throw error

      // Reset form
      setShowAddForm(false)
      setSelectedSchoolId('')
      setSelectedGroupId('')
      setExceptionRate('')

      // Refresh exceptions
      await fetchWageSettings()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteException = async (id: string) => {
    if (!confirm('Delete this wage exception?')) return

    try {
      const { error } = await supabase
        .from('wage_exceptions')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchWageSettings()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Wages" size="xl">
      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Default Hourly Rate */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Default Hourly Rate</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Hourly Rate</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="surface-input w-full px-3 py-2"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="surface-input w-full px-3 py-2"
              >
                <option value="NIS">NIS (₪)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveDefaultRate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              {saved && (
                <span className="text-sm text-gray-500 dark:text-gray-400">Saved</span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            This rate applies to all lessons unless overridden by a school or group exception below.
          </p>
        </div>

        {/* Exceptions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Wage Exceptions</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {showAddForm ? 'Cancel' : '+ Add Exception'}
            </button>
          </div>

          {showAddForm && (
            <div className="surface-section-muted p-4 mb-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Exception Type</label>
                  <select
                    value={exceptionType}
                    onChange={(e) => setExceptionType(e.target.value as 'school' | 'group')}
                    className="surface-input w-full px-3 py-2"
                  >
                    <option value="school">School</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                {exceptionType === 'school' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">School</label>
                    <select
                      value={selectedSchoolId}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      className="surface-input w-full px-3 py-2"
                    >
                      <option value="">Select a school...</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {exceptionType === 'group' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Group</label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="surface-input w-full px-3 py-2"
                    >
                      <option value="">Select a group...</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.schools?.name} - {group.subjects?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Hourly Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={exceptionRate}
                    onChange={(e) => setExceptionRate(e.target.value)}
                    className="surface-input w-full px-3 py-2"
                    placeholder="0.00"
                  />
                </div>

                <button
                  onClick={addException}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Exception
                </button>
              </div>
            </div>
          )}

          {/* Exceptions List */}
          <div className="space-y-2">
            {exceptions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No wage exceptions. All lessons use the default hourly rate.
              </p>
            ) : (
              exceptions.map(exception => (
                <div
                  key={exception.id}
                  className="surface-section-muted flex justify-between items-center p-4"
                >
                  <div>
                    <div className="font-medium">
                      {exception.school_name || exception.group_name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {exception.school_id ? 'School' : 'Group'} • {currency === 'NIS' ? '₪' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}{exception.hourly_rate}/hour
                    </div>
                  </div>
                  <button
                    onClick={() => deleteException(exception.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
