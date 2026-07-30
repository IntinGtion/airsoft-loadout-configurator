import { useEffect, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { ComponentResponse, LoadoutResponse } from '../api/types'
import { LoadoutThumbnail } from '../components/LoadoutThumbnail'
import styles from './LoadoutsPage.module.css'

interface Props {
  onCreate: () => void
}

export function LoadoutsPage({ onCreate }: Props) {
  const [loadouts, setLoadouts] = useState<LoadoutResponse[] | null>(null)
  const [componentsById, setComponentsById] = useState<Map<number, ComponentResponse>>(new Map())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const summaries = await api.loadouts.getAll()
      const full = await Promise.all(summaries.map(s => api.loadouts.getById(s.id)))
      // Thumbnails need the full ComponentResponse (svgAssetPath, slots,
      // mountPoints, realWidthMm) for every distinct component across every
      // loadout, not just what LoadoutItemResponse already carries — fetched
      // once and shared across all tiles instead of per-tile.
      const componentIds = [...new Set(full.flatMap(l => l.items.map(i => i.componentId)))]
      const components = await Promise.all(componentIds.map(id => api.components.getById(id)))
      if (cancelled) return
      setLoadouts(full)
      setComponentsById(new Map(components.map(c => [c.id, c])))
    }

    load().catch(err => !cancelled && setError(String(err)))
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDelete(e: MouseEvent, loadout: LoadoutResponse) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Delete "${loadout.name}"? This can't be undone.`)) return
    setError(null)
    try {
      await api.loadouts.remove(loadout.id)
      setLoadouts(current => current?.filter(l => l.id !== loadout.id) ?? current)
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Loadouts</h1>
          <p className={styles.subtitle}>
            {loadouts ? `${loadouts.length} loadout${loadouts.length !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {!loadouts ? (
        <div className={styles.loading}>Loading…</div>
      ) : loadouts.length === 0 ? (
        <div className={styles.empty}>
          <p>No loadouts yet.</p>
          <button className={styles.createBtn} onClick={onCreate}>+ New Loadout</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {loadouts.map(l => (
            <Link key={l.id} to={`/loadout/${l.id}`} className={styles.card}>
              <div className={styles.thumbWrap}>
                <LoadoutThumbnail loadout={l} componentsById={componentsById} />
                <button
                  className={styles.deleteBtn}
                  onClick={e => handleDelete(e, l)}
                  title="Delete loadout"
                >
                  ×
                </button>
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.cardName}>{l.name}</h3>
                <p className={styles.cardMeta}>
                  {l.items.length} item{l.items.length !== 1 ? 's' : ''} · {new Date(l.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
