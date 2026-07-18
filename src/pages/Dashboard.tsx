import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Dashboard.module.css'

interface Filter {
  id: string
  value: string
}

export default function Dashboard() {
  const [filters, setFilters] = useState<Filter[]>([])
  const [filterDraft, setFilterDraft] = useState('')
  const navigate = useNavigate()

  const handleAddFilter = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = filterDraft.trim()
    if (trimmed) {
      setFilters((prev) => [...prev, { id: Date.now().toString(), value: trimmed }])
      setFilterDraft('')
    }
  }

  const handleRemoveFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo}>kisu</h1>
        <button
          className={styles.signOutBtn}
          onClick={() => navigate('/login?signout')}
        >
          Sign out
        </button>
      </header>

      <main className={styles.main}>
        {/* Filter input */}
        <form onSubmit={handleAddFilter} className={styles.filterForm}>
          <div className={styles.filterRow}>
            <input
              className={styles.filterInput}
              type="text"
              placeholder="Enter email or user ID"
              value={filterDraft}
              onChange={(e) => setFilterDraft(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className={styles.filterBtn}
              style={{ opacity: filterDraft.trim() ? 1 : 0.5 }}
              disabled={!filterDraft.trim()}
            >
              Add
            </button>
          </div>
        </form>

        {/* Filter chips */}
        {filters.length > 0 && (
          <div className={styles.chipContainer}>
            {filters.map((filter) => (
              <span key={filter.id} className={styles.filterChip}>
                {filter.value}
                <button
                  className={styles.chipRemove}
                  onClick={() => handleRemoveFilter(filter.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Data table */}
        <div className={styles.tableContainer}>
          {filters.length === 0 ? (
            <p className={styles.emptyTable}>Add filters above to view data.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>ID</th>
                    <th className={styles.th}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filters.map((filter, i) => (
                    <tr key={filter.id} className={i % 2 === 0 ? styles.trEven : undefined}>
                      <td className={styles.td}>{filter.id}</td>
                      <td className={styles.td}>{filter.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
