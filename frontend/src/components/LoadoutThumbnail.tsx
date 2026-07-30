import type { CSSProperties } from 'react'
import type { ComponentResponse, LoadoutItemResponse, LoadoutResponse } from '../api/types'
import { getAnchorMountPointPercent } from './canvas/footprint'
import { getDisplayWidth } from './canvas/scale'
import styles from './LoadoutThumbnail.module.css'

// Fixed regardless of the loadout's real-world scale — only the *ratio* between
// root and child widths (both computed via the same getDisplayWidth scale used
// on the canvas) matters, so a rifle-sized loadout and a pistol-sized one still
// render proportionally correct within the same tile footprint.
const THUMB_ROOT_WIDTH = 96
const THUMB_ROOT_FALLBACK = 80
const THUMB_CHILD_FALLBACK = 24

interface NodeProps {
  component: ComponentResponse
  anchorPercent: { x: number; y: number }
  widthPx: number
  componentsById: Map<number, ComponentResponse>
  childItemsBySlotId: Map<number, LoadoutItemResponse>
  rootDisplayWidth: number
  // Where this node sits within its parent's own image (0-100%) — omitted for
  // the root node, which is just centered in the tile by its flex container.
  positionPercent?: { x: number; y: number }
}

// Recursive, non-interactive counterpart to CanvasNode — same "anchor mount
// point lands exactly on the parent slot" idea, but done with plain CSS
// (percent-positioned + a self-relative transform) instead of Konva, since a
// static preview tile needs neither drag handling nor pixel hit-testing.
function ThumbnailNode({
  component,
  anchorPercent,
  widthPx,
  componentsById,
  childItemsBySlotId,
  rootDisplayWidth,
  positionPercent,
}: NodeProps) {
  if (!component.svgAssetPath) return null

  const style: CSSProperties = {
    width: widthPx,
    transform: `translate(-${anchorPercent.x}%, -${anchorPercent.y}%)`,
  }
  if (positionPercent) {
    style.position = 'absolute'
    style.left = `${positionPercent.x}%`
    style.top = `${positionPercent.y}%`
  }

  return (
    <div className={styles.node} style={style}>
      <img src={component.svgAssetPath} className={styles.nodeImg} alt="" />
      {component.slots.map(slot => {
        const childItem = childItemsBySlotId.get(slot.id)
        if (!childItem) return null
        const childComponent = componentsById.get(childItem.componentId)
        if (!childComponent) return null
        const childWidthPx =
          (getDisplayWidth(childComponent, THUMB_CHILD_FALLBACK) / rootDisplayWidth) * THUMB_ROOT_WIDTH
        return (
          <ThumbnailNode
            key={slot.id}
            component={childComponent}
            anchorPercent={getAnchorMountPointPercent(childComponent)}
            widthPx={childWidthPx}
            componentsById={componentsById}
            childItemsBySlotId={childItemsBySlotId}
            rootDisplayWidth={rootDisplayWidth}
            positionPercent={{ x: slot.positionXPercent, y: slot.positionYPercent }}
          />
        )
      })}
    </div>
  )
}

interface Props {
  loadout: LoadoutResponse
  componentsById: Map<number, ComponentResponse>
}

export function LoadoutThumbnail({ loadout, componentsById }: Props) {
  const rootItem = loadout.items.find(i => i.parentSlotId === null)
  const rootComponent = rootItem ? componentsById.get(rootItem.componentId) : undefined

  if (!rootItem || !rootComponent?.svgAssetPath) {
    return (
      <div className={styles.empty}>
        {loadout.items.length === 0 ? 'Empty' : 'No preview'}
      </div>
    )
  }

  const childItemsBySlotId = new Map<number, LoadoutItemResponse>()
  loadout.items.forEach(i => {
    if (i.parentSlotId !== null) childItemsBySlotId.set(i.parentSlotId, i)
  })

  return (
    <div className={styles.stage}>
      <ThumbnailNode
        component={rootComponent}
        anchorPercent={{ x: 0, y: 0 }}
        widthPx={THUMB_ROOT_WIDTH}
        componentsById={componentsById}
        childItemsBySlotId={childItemsBySlotId}
        rootDisplayWidth={getDisplayWidth(rootComponent, THUMB_ROOT_FALLBACK)}
      />
    </div>
  )
}
