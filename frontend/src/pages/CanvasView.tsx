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

interface DraggingItem {
  componentId: number
  name: string
}

export function CanvasView() {
  const { id } = useParams<{ id: string }>()
  const loadoutId = Number(id)

  const [loadout, setLoadout] = useState<LoadoutResponse | null>(null)
  const [componentsById, setComponentsById] = useState<Map<number, ComponentResponse>>(new Map())
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [colorway, setColorway] = useState<string | null>(null)

  // Native HTML5 drag-and-drop (draggable/dragstart/dragover/drop) turned out to be
  // unreliable in real browsers when the drop target contains a <canvas> (Konva's
  // Stage) — it worked under Playwright's synthetic drag simulation but not for an
  // actual mouse drag, per the project owner's manual testing on 2026-07-27. Plain
  // mouse events (mousedown/mousemove/mouseup) don't have that class of bug and are
  // consistent across browsers, so dragging is implemented by hand instead.
  const [dragging, setDragging] = useState<DraggingItem | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const stageWrapRef = useRef<HTMLDivElement | null>(null)

  const { categories, components: catalog, selected, setSelected } = useComponents()

  // Absolute canvas positions of every currently rendered slot, keyed by slot ID —
  // updated by CanvasNode as it computes layout, read once at drop time to find the
  // nearest free slot under the cursor.
  const slotPositions = useRef(new Map<number, DropCandidate>())

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

  const placeComponent = useCallback(async (componentId: number, dropX: number, dropY: number) => {
    setError(null)

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
  }, [loadoutId, reload, rootItems.length])

  function startDrag(item: DraggingItem, e: React.MouseEvent) {
    e.preventDefault()
    setDragging(item)
    setDragPos({ x: e.clientX, y: e.clientY })
  }

  useEffect(() => {
    if (!dragging) return

    function isOverStage(clientX: number, clientY: number) {
      const rect = stageWrapRef.current?.getBoundingClientRect()
      if (!rect) return false
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    }

    function handleMove(e: MouseEvent) {
      setDragPos({ x: e.clientX, y: e.clientY })
      setDragOver(isOverStage(e.clientX, e.clientY))
    }

    function handleUp(e: MouseEvent) {
      const rect = stageWrapRef.current?.getBoundingClientRect()
      const dropInStage = rect && isOverStage(e.clientX, e.clientY)

      setDragging(null)
      setDragPos(null)
      setDragOver(false)

      if (dropInStage && rect && dragging) {
        placeComponent(dragging.componentId, e.clientX - rect.left, e.clientY - rect.top)
      }
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, placeComponent])

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
            ref={stageWrapRef}
            className={`${styles.stageWrap} ${dragOver ? styles.stageWrapDragOver : ''}`}
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
                  onMouseDown={e => startDrag({ componentId: c.id, name: c.name }, e)}
                >
                  <span className={styles.catalogItemName}>{c.name}</span>
                  <span className={styles.catalogItemCategory}>{c.categoryName}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {dragging && dragPos && (
        <div
          className={styles.dragGhost}
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          {dragging.name}
        </div>
      )}
    </div>
  )
}
