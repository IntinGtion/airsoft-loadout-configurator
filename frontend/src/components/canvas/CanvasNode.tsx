import { useEffect, useMemo, useState } from 'react'
import type { ComponentResponse, LoadoutItemResponse } from '../../api/types'
import { ComponentSprite } from './ComponentSprite'
import { SlotMarker } from './SlotMarker'
import { computeFootprintSlotIds, getAnchorMountPointPercent } from './footprint'
import { getDisplayWidth } from './scale'

// Fallback for components without a RealWidthMm — matches the flat size used
// before real-world sizing existed.
export const CHILD_DISPLAY_WIDTH_FALLBACK = 64

export interface DropCandidate {
  id: number
  attachmentTypeId: number
  x: number
  y: number
  occupied: boolean
}

interface Props {
  component: ComponentResponse
  // The point (in stage coordinates) that this component's own anchor mount
  // point should land on — not its top-left corner. For a root item, pass
  // anchorPercent {x:0, y:0} so target IS the top-left, same as before this
  // distinction existed.
  targetX: number
  targetY: number
  anchorPercent: { x: number; y: number }
  width: number
  componentsById: Map<number, ComponentResponse>
  childItemsBySlotId: Map<number, LoadoutItemResponse>
  onSlotsComputed: (slots: DropCandidate[]) => void
  colorway: string | null
}

export function CanvasNode({
  component,
  targetX,
  targetY,
  anchorPercent,
  width,
  componentsById,
  childItemsBySlotId,
  onSlotsComputed,
  colorway,
}: Props) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const height = naturalSize ? width * (naturalSize.h / naturalSize.w) : null

  // Top-left render position, back-solved so the anchor mount point (not the
  // sprite's corner or center) lands exactly on targetX/targetY. Before the
  // image has loaded we don't know its aspect ratio yet, so `y` briefly uses
  // targetY as-is — corrected the moment `height` becomes available.
  const x = targetX - (anchorPercent.x / 100) * width
  const y = height != null ? targetY - (anchorPercent.y / 100) * height : targetY

  // Slots consumed by a placed component's own footprint (e.g. the other 7 slots
  // under a 2x4-MOLLE pouch), not just the one slot it's directly anchored to —
  // these must count as occupied too, not as free drop targets.
  const occupiedSlotIds = useMemo(() => {
    const occupied = new Set<number>()
    for (const slot of component.slots) {
      const childItem = childItemsBySlotId.get(slot.id)
      if (!childItem) continue
      const childComponent = componentsById.get(childItem.componentId)
      if (!childComponent) continue
      const footprint = computeFootprintSlotIds(childComponent, slot, component.slots)
      footprint?.forEach(id => occupied.add(id))
    }
    return occupied
  }, [component, childItemsBySlotId, componentsById])

  useEffect(() => {
    if (height == null) return
    onSlotsComputed(
      component.slots.map(slot => ({
        id: slot.id,
        attachmentTypeId: slot.attachmentTypeId,
        x: x + (slot.positionXPercent / 100) * width,
        y: y + (slot.positionYPercent / 100) * height,
        occupied: occupiedSlotIds.has(slot.id) || childItemsBySlotId.has(slot.id),
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component, x, y, width, height, occupiedSlotIds])

  return (
    <>
      {component.svgAssetPath && (
        <ComponentSprite
          url={component.svgAssetPath}
          x={x}
          y={y}
          width={width}
          colorway={colorway}
          onLoad={(nw, nh) => setNaturalSize({ w: nw, h: nh })}
        />
      )}

      {/* Markers render before (so, underneath, in Konva's paint order) any attached
          children below — otherwise a sibling slot occupied by another item's own
          footprint (not its anchor) would draw its grey "occupied" dot on top of
          that item's sprite instead of being hidden behind it. */}
      {height != null &&
        component.slots.map(slot => {
          if (childItemsBySlotId.has(slot.id)) return null
          const sx = x + (slot.positionXPercent / 100) * width
          const sy = y + (slot.positionYPercent / 100) * height
          return (
            <SlotMarker key={slot.id} x={sx} y={sy} occupied={occupiedSlotIds.has(slot.id)} />
          )
        })}

      {height != null &&
        component.slots.map(slot => {
          const childItem = childItemsBySlotId.get(slot.id)
          if (!childItem) return null
          const childComponent = componentsById.get(childItem.componentId)
          if (!childComponent) return null
          const sx = x + (slot.positionXPercent / 100) * width
          const sy = y + (slot.positionYPercent / 100) * height
          const childWidth = getDisplayWidth(childComponent, CHILD_DISPLAY_WIDTH_FALLBACK)
          return (
            <CanvasNode
              key={slot.id}
              component={childComponent}
              targetX={sx}
              targetY={sy}
              anchorPercent={getAnchorMountPointPercent(childComponent)}
              width={childWidth}
              componentsById={componentsById}
              childItemsBySlotId={childItemsBySlotId}
              onSlotsComputed={onSlotsComputed}
              colorway={colorway}
            />
          )
        })}
    </>
  )
}
