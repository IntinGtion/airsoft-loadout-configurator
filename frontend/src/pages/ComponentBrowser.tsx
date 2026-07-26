import { useEffect, useState } from 'react'
import { api } from '../api'
import type { CategoryResponse, ComponentResponse } from '../api/types'
import { CategoryNav } from '../components/CategoryNav'
import { ComponentCard } from '../components/ComponentCard'
import styles from './ComponentBrowser.module.css'

export function ComponentBrowser() {
  const [categories, setCategories]   = useState<CategoryResponse[]>([])
  const [components, setComponents]   = useState<ComponentResponse[]>([])
  const [selected, setSelected]       = useState<number | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    api.categories.getAll().then(setCategories).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.components.getAll(selected ?? undefined)
      .then(setComponents)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [selected])

  const totalWeight = components.reduce((sum, c) => sum + (c.weightGrams ?? 0), 0)

  return (
    <div className={styles.layout}>
      <CategoryNav
        categories={categories}
        selected={selected}
        onSelect={setSelected}
      />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {selected
                ? (categories.find(c => c.id === selected)?.name ?? 'Components')
                : 'All Components'}
            </h1>
            <p className={styles.subtitle}>
              {components.length} item{components.length !== 1 ? 's' : ''}
              {totalWeight > 0 && ` · ${(totalWeight / 1000).toFixed(2)} kg total`}
            </p>
          </div>
        </header>

        {error && <p className={styles.error}>Failed to load: {error}</p>}

        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : (
          <div className={styles.grid}>
            {components.map(c => (
              <ComponentCard key={c.id} component={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
