import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Stage, Layer } from 'react-konva'
import { api } from '../api'
import type { ComponentResponse, LoadoutItemResponse, LoadoutResponse } from '../api/types'
import { useComponents } from '../hooks/useComponents'
import { CategoryNav } from '../components/CategoryNav'
import { CanvasNode, type DropCandidate } from '../components/canvas/CanvasNode'
import { COLORWAYS } from '../components/canvas/colorways'
import { getDisplayWidth } from '../components/canvas/scale'
import styles from './CanvasView.module.css'

const STAGE_WIDTH = 640
const STAGE_HEIGHT = 720
const ROOT_DISPLAY_WIDTH_FALLBACK = 380
const DROP_SNAP_DISTANCE = 26

export function CanvasView() {
  const { id } = useParams<{ id: string }>()
  const loadoutId = Number(id)

  const [loadout, setLoadout] = useState<LoadoutResponse | null>(null)
  const [componentsById, setComponentsById] = useState<Map<number, ComponentResponse>>(new Map())
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [colorway, setColorway] = useState<string | null>(null)

  const { categories, components: catalog, selected, setSelected } = useComponents()

  // Absolute canvas positions of every currently rendered slot, keyed by slot ID —
  // updated by CanvasNode as it computes layout, read once at drop time to find the
  // nearest free slot under the cursor.
  const slotPositions = useRef(new Map<number, DropCandidate>())

  // The native HTML5 'drop' event's own clientX/clientY isn't reliable across
  // browsers (some report stale or zeroed-out coordinates on drop). 'dragover'
  // fires continuously and reliably throughout the drag, so track the latest
  // pointer position there and use that instead of trusting the drop event.
  const lastDragClientPos = useRef<{ x: number; y: number } | null>(null)

  const handleSlotsComputed = useCallback((slots: DropCandidate[]) => {
    slots.forEach(s => slotPositions.current.set(s.id, s))
  }, [])

  const reload = useCallback(() => {
    setLoading(true)
    api.loadouts.getById(loadoutId)
      .then(async l => {
        setLoadout(l)
        setNotFound(false)

        const ids = [...new Set(l.items.map(i => i.componentId))]
        const fetched = await Promise.all(ids.map(cid => api.components.getById(cid)))
        setComponentsById(new Map(fetched.map(c => [c.id, c])))
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [loadoutId])

  useEffect(() => {
    Promise.resolve().then(reload)
  }, [reload])

  const rootItems = useMemo(
    () => loadout?.items.filter(i => i.parentSlotId === null) ?? [],
    [loadout]
  )

  const childItemsBySlotId = useMemo(() => {
    const map = new Map<number, LoadoutItemResponse>()
    loadout?.items.forEach(i => {
      if (i.parentSlotId !== null) map.set(i.parentSlotId, i)
    })
    return map
  }, [loadout])

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
    lastDragClientPos.current = { x: e.clientX, y: e.clientY }
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    setError(null)

    const componentId = Number(e.dataTransfer.getData('text/component-id'))
    if (!componentId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clientPos = lastDragClientPos.current ?? { x: e.clientX, y: e.clientY }
    const dropX = clientPos.x - rect.left
    const dropY = clientPos.y - rect.top

    let nearest: DropCandidate | null = null
    let nearestDist = Infinity
    for (const candidate of slotPositions.current.values()) {
      if (candidate.occupied) continue
      const dist = Math.hypot(candidate.x - dropX, candidate.y - dropY)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = candidate
      }
    }

    if (nearest && nearestDist <= DROP_SNAP_DISTANCE) {
      try {
        await api.loadouts.addItem(loadoutId, componentId, nearest.id)
        reload()
      } catch (err) {
        setError(String(err))
      }
      return
    }

    if (rootItems.length === 0) {
      // Bootstrapping case: nothing placed yet, so any drop starts the loadout
      // with this as a new independent base item.
      try {
        await api.loadouts.addItem(loadoutId, componentId, null)
        reload()
      } catch (err) {
        setError(String(err))
      }
      return
    }

    setError('No attachment slot near where you dropped that.')
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
      <div className={styles.stageArea}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{loadout?.name ?? 'Canvas'}</h1>
            <p className={styles.subtitle}>
              {rootItems.length === 0
                ? 'Drag a base component (e.g. a plate carrier) onto the canvas to start'
                : 'Drag a component from the catalog onto a highlighted slot'}
            </p>
          </div>
          <Link className={styles.backLink} to={`/loadout/${loadoutId}`}>Back to list view</Link>
        </header>

        <div className={styles.colorwayRow}>
          <span className={styles.colorwayLabel}>Colorway</span>
          {COLORWAYS.map(cw => (
            <button
              key={cw.name}
              type="button"
              className={`${styles.colorwaySwatch} ${colorway === cw.hex ? styles.colorwaySwatchActive : ''}`}
              style={cw.hex ? { background: cw.hex } : undefined}
              title={cw.name}
              onClick={() => setColorway(cw.hex)}
            >
              {!cw.hex && '?'}
            </button>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : (
          <div
            className={`${styles.stageWrap} ${dragOver ? styles.stageWrapDragOver : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {rootItems.length === 0 && (
              <div className={styles.emptyHint}>
                Drag a base component here, or add one from the{' '}
                <Link to={`/loadout/${loadoutId}`}>list view</Link>
              </div>
            )}
            <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT}>
              <Layer>
                {rootItems.map((item, i) => {
                  const component = componentsById.get(item.componentId)
                  if (!component) return null
                  const rootWidth = getDisplayWidth(component, ROOT_DISPLAY_WIDTH_FALLBACK)
                  return (
                    <CanvasNode
                      key={item.id}
                      component={component}
                      x={(STAGE_WIDTH - rootWidth) / 2}
                      y={20 + i * 40}
                      width={rootWidth}
                      componentsById={componentsById}
                      childItemsBySlotId={childItemsBySlotId}
                      onSlotsComputed={handleSlotsComputed}
                      colorway={colorway}
                    />
                  )
                })}
              </Layer>
            </Stage>
          </div>
        )}
      </div>

      <aside className={styles.catalog}>
        <CategoryNav categories={categories} selected={selected} onSelect={setSelected} />
        <div className={styles.catalogListWrap}>
          <h2 className={styles.catalogTitle}>Drag onto canvas</h2>
          <ul className={styles.catalogList}>
            {catalog.map(c => (
              <li key={c.id}>
                <div
                  className={styles.catalogItem}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('text/component-id', String(c.id))}
                >
                  <span className={styles.catalogItemName}>{c.name}</span>
                  <span className={styles.catalogItemCategory}>{c.categoryName}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
