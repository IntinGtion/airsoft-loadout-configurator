import { useState } from 'react'
import type { ComponentResponse, LoadoutItemResponse } from '../../api/types'
import { ComponentSprite } from './ComponentSprite'
import { SlotMarker } from './SlotMarker'

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

          return (
            <SlotMarker
              key={slot.id}
              x={sx}
              y={sy}
              selected={selectedSlotId === slot.id}
              onClick={() => onSlotClick(slot.id, slot.attachmentTypeId)}
            />
          )
        })}
    </>
  )
}
