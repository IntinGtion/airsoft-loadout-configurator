import { useMemo, useState } from 'react'
import type { ComponentResponse, LoadoutItemResponse } from '../../api/types'
import { ComponentSprite } from './ComponentSprite'
import { SlotMarker } from './SlotMarker'
import { computeFootprintSlotIds } from './footprint'

export const CHILD_DISPLAY_WIDTH = 64

interface Props {
  component: ComponentResponse
  x: number
  y: number
  width: number
  componentsById: Map<number, ComponentResponse>
  childItemsBySlotId: Map<number, LoadoutItemResponse>
  onSlotClick: (slotId: number, attachmentTypeId: number) => void
  selectedSlotId: number | null
}

export function CanvasNode({
  component,
  x,
  y,
  width,
  componentsById,
  childItemsBySlotId,
  onSlotClick,
  selectedSlotId,
}: Props) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const height = naturalSize ? width * (naturalSize.h / naturalSize.w) : null

  // Slots consumed by a placed component's own footprint (e.g. the other 7 slots
  // under a 2x4-MOLLE pouch), not just the one slot it's directly anchored to —
  // these must render as occupied too, not as free/clickable markers.
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

  return (
    <>
      {component.svgAssetPath && (
        <ComponentSprite
          url={component.svgAssetPath}
          x={x}
          y={y}
          width={width}
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
            return (
              <CanvasNode
                key={slot.id}
                component={childComponent}
                x={sx - CHILD_DISPLAY_WIDTH / 2}
                y={sy - CHILD_DISPLAY_WIDTH / 2}
                width={CHILD_DISPLAY_WIDTH}
                componentsById={componentsById}
                childItemsBySlotId={childItemsBySlotId}
                onSlotClick={onSlotClick}
                selectedSlotId={selectedSlotId}
              />
            )
          }

          const isOccupied = occupiedSlotIds.has(slot.id)
          return (
            <SlotMarker
              key={slot.id}
              x={sx}
              y={sy}
              occupied={isOccupied}
              selected={selectedSlotId === slot.id}
              onClick={isOccupied ? undefined : () => onSlotClick(slot.id, slot.attachmentTypeId)}
            />
          )
        })}
    </>
  )
}
