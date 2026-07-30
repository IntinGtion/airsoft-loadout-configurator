import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Stage, Layer } from 'react-konva'
import { api } from '../api'
import type { ComponentResponse, LoadoutItemResponse, LoadoutResponse } from '../api/types'
import { useComponents } from '../hooks/useComponents'
import { CategoryNav } from '../components/CategoryNav'
import { LoadoutSidebar } from '../components/LoadoutSidebar'
import { CanvasNode, CHILD_DISPLAY_WIDTH_FALLBACK, type DropCandidate } from '../components/canvas/CanvasNode'
import { COLORWAYS } from '../components/canvas/colorways'
import { getDisplayWidth } from '../components/canvas/scale'
import { getRecoloredSvgUrl } from '../components/canvas/recolorSvg'
import { getAnchorMountPointPercent, computeFootprintPreview } from '../components/canvas/footprint'
import styles from './CanvasView.module.css'

const STAGE_WIDTH = 640
const STAGE_HEIGHT = 720
const ROOT_DISPLAY_WIDTH_FALLBACK = 380
const DROP_SNAP_DISTANCE = 26
const DRAG_PREVIEW_MAX_WIDTH = 140

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
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  // Native HTML5 drag-and-drop (draggable/dragstart/dragover/drop) turned out to be
  // unreliable in real browsers when the drop target contains a <canvas> (Konva's
  // Stage) — it worked under Playwright's synthetic drag simulation but not for an
  // actual mouse drag, per the project owner's manual testing on 2026-07-27. Plain
  // mouse events (mousedown/mousemove/mouseup) don't have that class of bug and are
  // consistent across browsers, so dragging is implemented by hand instead.
  const [dragging, setDragging] = useState<DraggingItem | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  // Every slot the dragged catalog item's full footprint would land on (not
  // just the anchor slot nearest the cursor), keyed by whether that slot would
  // actually accept it — lets the user see the whole multi-mount-point shape
  // (e.g. all 8 MOLLE straps of a pouch) before committing to a drop, instead
  // of the old guess-and-check cycle where a miss only surfaced afterwards.
  const [hoveredSlots, setHoveredSlots] = useState<Map<number, boolean>>(new Map())
  const stageWrapRef = useRef<HTMLDivElement | null>(null)

  const { categories, components: catalog, selected, setSelected } = useComponents()

  const draggingComponent = dragging ? catalog.find(c => c.id === dragging.componentId) ?? null : null
  const [dragPreviewUrl, setDragPreviewUrl] = useState<string | null>(null)
  const [dragNaturalSize, setDragNaturalSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    const svgAssetPath = draggingComponent?.svgAssetPath
    const resolved = svgAssetPath ? getRecoloredSvgUrl(svgAssetPath, colorway) : Promise.resolve(null)
    resolved.then(url => {
      if (!cancelled) setDragPreviewUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [draggingComponent, colorway])

  // Absolute canvas positions of every currently rendered slot, keyed by slot ID —
  // updated by CanvasNode as it computes layout, read once at drop time to find the
  // nearest free slot under the cursor.
  const slotPositions = useRef(new Map<number, DropCandidate>())

  const handleSlotsComputed = useCallback((slots: DropCandidate[]) => {
    slots.forEach(s => slotPositions.current.set(s.id, s))
  }, [])

  // Only the very first load shows the "Loading…" placeholder (which unmounts the
  // whole Stage). Reloads after adding/moving/deleting an item keep the canvas and
  // sidebar mounted throughout — the old state stays on screen until the fresh data
  // arrives, then React just updates the existing tree instead of a blank flash
  // followed by everything (including already-loaded images) starting over.
  const hasLoadedOnce = useRef(false)

  const reload = useCallback(() => {
    if (!hasLoadedOnce.current) setLoading(true)
    api.loadouts.getById(loadoutId)
      .then(async l => {
        setLoadout(l)
        setNotFound(false)

        const ids = [...new Set(l.items.map(i => i.componentId))]
        const fetched = await Promise.all(ids.map(cid => api.components.getById(cid)))
        setComponentsById(new Map(fetched.map(c => [c.id, c])))
      })
      .catch(() => setNotFound(true))
      .finally(() => {
        setLoading(false)
        hasLoadedOnce.current = true
      })
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
      if (candidate.occupiedByItemId != null) continue
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

  // Moving an already-placed item: unlike placeComponent, a slot the item itself
  // already occupies (via its own footprint) doesn't block it — you can drop it
  // back near its own current spot — and a miss always detaches it to become an
  // independent item rather than only doing so when the canvas is empty.
  const moveExistingItem = useCallback(async (itemId: number, componentId: number, dropX: number, dropY: number) => {
    setError(null)

    let nearest: DropCandidate | null = null
    let nearestDist = Infinity
    for (const candidate of slotPositions.current.values()) {
      if (candidate.occupiedByItemId != null && candidate.occupiedByItemId !== itemId) continue
      const dist = Math.hypot(candidate.x - dropX, candidate.y - dropY)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = candidate
      }
    }

    const targetSlotId = nearest && nearestDist <= DROP_SNAP_DISTANCE ? nearest.id : null

    try {
      await api.loadouts.moveItem(loadoutId, itemId, componentId, targetSlotId)
      reload()
    } catch (err) {
      setError(String(err))
    }
  }, [loadoutId, reload])

  const handleRemoveItem = useCallback(async (itemId: number) => {
    setError(null)
    try {
      await api.loadouts.removeItem(loadoutId, itemId)
      setSelectedItemId(current => (current === itemId ? null : current))
      reload()
    } catch (err) {
      setError(String(err))
    }
  }, [loadoutId, reload])

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

    function findNearestFreeSlot(stageX: number, stageY: number): DropCandidate | null {
      let nearest: DropCandidate | null = null
      let nearestDist = Infinity
      for (const candidate of slotPositions.current.values()) {
        if (candidate.occupiedByItemId != null) continue
        const dist = Math.hypot(candidate.x - stageX, candidate.y - stageY)
        if (dist < nearestDist) {
          nearestDist = dist
          nearest = candidate
        }
      }
      return nearest && nearestDist <= DROP_SNAP_DISTANCE ? nearest : null
    }

    function handleMove(e: MouseEvent) {
      setDragPos({ x: e.clientX, y: e.clientY })
      const rect = stageWrapRef.current?.getBoundingClientRect()
      const over = isOverStage(e.clientX, e.clientY)
      setDragOver(over)

      const nearest = over && rect ? findNearestFreeSlot(e.clientX - rect.left, e.clientY - rect.top) : null
      if (!nearest || !draggingComponent) {
        setHoveredSlots(new Map())
        return
      }

      const preview = computeFootprintPreview(
        draggingComponent,
        { gridColumn: nearest.gridColumn, gridRow: nearest.gridRow },
        nearest.parentSlots
      )

      if (preview.length === 0) {
        // No grid-based footprint to project (e.g. a single-slot component) —
        // fall back to the plain type check against just the anchor slot.
        const compatible = draggingComponent.acceptedAttachmentTypes.some(
          t => t.id === nearest.attachmentTypeId
        )
        setHoveredSlots(new Map([[nearest.id, compatible]]))
        return
      }

      setHoveredSlots(
        new Map(
          preview.map(p => [
            p.slotId,
            p.typeMatches && slotPositions.current.get(p.slotId)?.occupiedByItemId == null,
          ])
        )
      )
    }

    function handleUp(e: MouseEvent) {
      const rect = stageWrapRef.current?.getBoundingClientRect()
      const dropInStage = rect && isOverStage(e.clientX, e.clientY)

      setDragging(null)
      setDragPos(null)
      setDragOver(false)
      setHoveredSlots(new Map())

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
  }, [dragging, placeComponent, draggingComponent])

  // Anchor the ghost preview on the component's own anchor mount point (not its
  // top-left corner or visual center) so the cursor sits exactly where it would
  // dock — same reasoning as CanvasNode's targetX/targetY/anchorPercent.
  const dragAnchor = draggingComponent ? getAnchorMountPointPercent(draggingComponent) : { x: 0, y: 0 }
  const dragPreviewWidth = draggingComponent
    ? Math.min(getDisplayWidth(draggingComponent, CHILD_DISPLAY_WIDTH_FALLBACK), DRAG_PREVIEW_MAX_WIDTH)
    : 0
  const dragPreviewHeight = dragNaturalSize ? dragPreviewWidth * (dragNaturalSize.h / dragNaturalSize.w) : null
  const dragOffsetX = (dragAnchor.x / 100) * dragPreviewWidth
  const dragOffsetY = dragPreviewHeight != null ? (dragAnchor.y / 100) * dragPreviewHeight : 0
  // The ghost itself only has one glow color, so a multi-slot footprint (e.g.
  // the pouch's 8 MOLLE straps) reads as compatible only if every one of its
  // slots would actually accept it — one conflicting slot is enough to flag
  // the whole prospective drop as a problem.
  const hoveredAllCompatible = hoveredSlots.size > 0 && [...hoveredSlots.values()].every(Boolean)

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <p>Loadout not found. <Link to="/">Back to My Loadouts.</Link></p>
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
          <Link className={styles.backLink} to="/">My Loadouts</Link>
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
                Drag a base component here to start
              </div>
            )}
            <Stage
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              onClick={e => {
                if (e.target === e.target.getStage()) setSelectedItemId(null)
              }}
            >
              <Layer>
                {rootItems.map((item, i) => {
                  const component = componentsById.get(item.componentId)
                  if (!component) return null
                  const rootWidth = getDisplayWidth(component, ROOT_DISPLAY_WIDTH_FALLBACK)
                  return (
                    <CanvasNode
                      key={item.id}
                      component={component}
                      itemId={item.id}
                      targetX={(STAGE_WIDTH - rootWidth) / 2}
                      targetY={20 + i * 40}
                      anchorPercent={{ x: 0, y: 0 }}
                      width={rootWidth}
                      componentsById={componentsById}
                      childItemsBySlotId={childItemsBySlotId}
                      onSlotsComputed={handleSlotsComputed}
                      colorway={colorway}
                      selectedItemId={selectedItemId}
                      onSelectItem={setSelectedItemId}
                      onDeleteItem={handleRemoveItem}
                      onItemDragEnd={moveExistingItem}
                      hoveredSlots={hoveredSlots}
                    />
                  )
                })}
              </Layer>
            </Stage>
          </div>
        )}
      </div>

      <LoadoutSidebar loadout={loadout} loading={loading} onRemove={handleRemoveItem} />

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
        <div className={styles.dragGhost} style={{ left: dragPos.x, top: dragPos.y }}>
          {dragPreviewUrl && (
            <div
              className={`${styles.dragGhostImageWrap} ${
                hoveredSlots.size > 0
                  ? hoveredAllCompatible
                    ? styles.dragGhostImageWrapCompatible
                    : styles.dragGhostImageWrapIncompatible
                  : ''
              }`}
              style={{ left: -dragOffsetX, top: -dragOffsetY, width: dragPreviewWidth }}
            >
              <img
                src={dragPreviewUrl}
                alt=""
                className={styles.dragGhostImage}
                style={{ width: dragPreviewWidth }}
                onLoad={e =>
                  setDragNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
                }
              />
              {dragPreviewHeight != null &&
                draggingComponent?.mountPoints.map(mp => (
                  <span
                    key={mp.id}
                    className={styles.dragGhostMountDot}
                    style={{ left: `${mp.positionXPercent}%`, top: `${mp.positionYPercent}%` }}
                  />
                ))}
            </div>
          )}
          <span className={styles.dragGhostLabel}>{dragging.name}</span>
        </div>
      )}

      {/* The footprint dots sit exactly where the dragged component's own body
          renders (that's the point — the pouch is meant to land there), so they'd
          be completely hidden under the opaque drag ghost if drawn on the Konva
          Stage like the normal SlotMarker hover ring. Rendered here instead, as a
          plain HTML overlay stacked above the ghost (z-index in CSS), the same fix
          already applied to the single-slot case but generalized to N slots. */}
      {dragging && hoveredSlots.size > 0 && stageWrapRef.current && (() => {
        const rect = stageWrapRef.current.getBoundingClientRect()
        return (
          <div className={styles.footprintOverlay} style={{ left: rect.left, top: rect.top }}>
            {[...hoveredSlots.entries()].map(([slotId, compatible]) => {
              const pos = slotPositions.current.get(slotId)
              if (!pos) return null
              return (
                <span
                  key={slotId}
                  className={compatible ? styles.footprintDotCompatible : styles.footprintDotIncompatible}
                  style={{ left: pos.x, top: pos.y }}
                />
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}
