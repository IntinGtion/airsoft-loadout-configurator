import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { LoadoutResponse } from '../api/types'
import { useComponents } from '../hooks/useComponents'
import { CategoryNav } from '../components/CategoryNav'
import { ComponentCard } from '../components/ComponentCard'
import { LoadoutSidebar } from '../components/LoadoutSidebar'
import styles from './LoadoutBuilder.module.css'

export function LoadoutBuilder() {
  const { id } = useParams<{ id: string }>()
  const loadoutId = Number(id)

  const [loadout, setLoadout] = useState<LoadoutResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { categories, components, selected, setSelected, loading: componentsLoading } =
    useComponents()

  const reload = useCallback(() => {
    setLoading(true)
    api.loadouts.getById(loadoutId)
      .then(l => { setLoadout(l); setNotFound(false) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [loadoutId])

  useEffect(() => {
    Promise.resolve().then(reload)
  }, [reload])

  async function handleAdd(componentId: number) {
    setError(null)
    try {
      await api.loadouts.addItem(loadoutId, componentId, null)
      reload()
    } catch (e) {
      setError(String(e))
    }
  }

  async function handleRemove(itemId: number) {
    setError(null)
    try {
      await api.loadouts.removeItem(loadoutId, itemId)
      reload()
    } catch (e) {
      setError(String(e))
    }
  }

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <p>Loadout not found. <Link to="/">Back to browse.</Link></p>
      </div>
    )
  }

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
            </p>
          </div>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        {componentsLoading ? (
          <div className={styles.loading}>Loading…</div>
        ) : (
          <div className={styles.grid}>
            {components.map(c => (
              <ComponentCard key={c.id} component={c} onAdd={c => handleAdd(c.id)} />
            ))}
          </div>
        )}
      </main>

      <LoadoutSidebar loadout={loadout} loading={loading} onRemove={handleRemove} />
    </div>
  )
}
