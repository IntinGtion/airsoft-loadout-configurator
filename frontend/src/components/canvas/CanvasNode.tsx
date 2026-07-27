import { useEffect, useMemo, useState } from 'react'
import type { ComponentResponse, LoadoutItemResponse } from '../../api/types'
import { ComponentSprite } from './ComponentSprite'
import { SlotMarker } from './SlotMarker'
import { computeFootprintSlotIds } from './footprint'
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
  x: number
  y: number
  width: number
  componentsById: Map<number, ComponentResponse>
  childItemsBySlotId: Map<number, LoadoutItemResponse>
  onSlotsComputed: (slots: DropCandidate[]) => void
  colorway: string | null
}

export function CanvasNode({
  component,
  x,
  y,
  width,
  componentsById,
  childItemsBySlotId,
  onSlotsComputed,
  colorway,
}: Props) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const height = naturalSize ? width * (naturalSize.h / naturalSize.w) : null

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

      {height != null &&
        component.slots.map(slot => {
          const sx = x + (slot.positionXPercent / 100) * width
          const sy = y + (slot.positionYPercent / 100) * height
          const childItem = childItemsBySlotId.get(slot.id)

          if (childItem) {
            const childComponent = componentsById.get(childItem.componentId)
            if (!childComponent) return null
            const childWidth = getDisplayWidth(childComponent, CHILD_DISPLAY_WIDTH_FALLBACK)
            return (
              <CanvasNode
                key={slot.id}
                component={childComponent}
                x={sx - childWidth / 2}
                y={sy - childWidth / 2}
                width={childWidth}
                componentsById={componentsById}
                childItemsBySlotId={childItemsBySlotId}
                onSlotsComputed={onSlotsComputed}
                colorway={colorway}
              />
            )
          }

          return (
            <SlotMarker key={slot.id} x={sx} y={sy} occupied={occupiedSlotIds.has(slot.id)} />
          )
        })}
    </>
  )
}
