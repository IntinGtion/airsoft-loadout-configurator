import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Stage, Layer } from 'react-konva'
import { api } from '../api'
import type { ComponentResponse, LoadoutItemResponse, LoadoutResponse } from '../api/types'
import { CanvasNode } from '../components/canvas/CanvasNode'
import styles from './CanvasView.module.css'

const STAGE_WIDTH = 640
const STAGE_HEIGHT = 720
const ROOT_DISPLAY_WIDTH = 380

export function CanvasView() {
  const { id } = useParams<{ id: string }>()
  const loadoutId = Number(id)

  const [loadout, setLoadout] = useState<LoadoutResponse | null>(null)
  const [componentsById, setComponentsById] = useState<Map<number, ComponentResponse>>(new Map())
  const [allComponents, setAllComponents] = useState<ComponentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ slotId: number; attachmentTypeId: number } | null>(null)

  useEffect(() => {
    api.components.getAll().then(setAllComponents).catch(console.error)
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

  const compatibleComponents = useMemo(() => {
    if (!selectedSlot) return []
    return allComponents.filter(c =>
      c.acceptedAttachmentTypes.some(a => a.id === selectedSlot.attachmentTypeId)
    )
  }, [selectedSlot, allComponents])

  async function handlePlace(componentId: number) {
    if (!selectedSlot) return
    setError(null)
    try {
      await api.loadouts.addItem(loadoutId, componentId, selectedSlot.slotId)
      setSelectedSlot(null)
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
      <div className={styles.stageArea}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{loadout?.name ?? 'Canvas'}</h1>
            <p className={styles.subtitle}>Click a highlighted slot to attach a compatible component</p>
          </div>
          <Link className={styles.backLink} to={`/loadout/${loadoutId}`}>Back to list view</Link>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : rootItems.length === 0 ? (
          <div className={styles.empty}>
            No base component in this loadout yet. Add one from the{' '}
            <Link to={`/loadout/${loadoutId}`}>list view</Link> first.
          </div>
        ) : (
          <div className={styles.stageWrap}>
            <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT}>
              <Layer>
                {rootItems.map((item, i) => {
                  const component = componentsById.get(item.componentId)
                  if (!component) return null
                  return (
                    <CanvasNode
                      key={item.id}
                      component={component}
                      x={(STAGE_WIDTH - ROOT_DISPLAY_WIDTH) / 2}
                      y={20 + i * 40}
                      width={ROOT_DISPLAY_WIDTH}
                      componentsById={componentsById}
                      childItemsBySlotId={childItemsBySlotId}
                      onSlotClick={(slotId, attachmentTypeId) =>
                        setSelectedSlot(prev =>
                          prev?.slotId === slotId ? null : { slotId, attachmentTypeId }
                        )
                      }
                      selectedSlotId={selectedSlot?.slotId ?? null}
                    />
                  )
                })}
              </Layer>
            </Stage>
          </div>
        )}
      </div>

      {selectedSlot && (
        <aside className={styles.picker}>
          <div className={styles.pickerHeader}>
            <h2 className={styles.pickerTitle}>Attach here</h2>
            <button className={styles.pickerClose} onClick={() => setSelectedSlot(null)}>×</button>
          </div>
          {compatibleComponents.length === 0 ? (
            <p className={styles.pickerEmpty}>No compatible components in the catalog.</p>
          ) : (
            <ul className={styles.pickerList}>
              {compatibleComponents.map(c => (
                <li key={c.id}>
                  <button className={styles.pickerItem} onClick={() => handlePlace(c.id)}>
                    <span className={styles.pickerItemName}>{c.name}</span>
                    <span className={styles.pickerItemCategory}>{c.categoryName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </div>
  )
}
