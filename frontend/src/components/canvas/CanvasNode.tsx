import { useEffect, useMemo, useState } from 'react'
import { Circle, Group, Rect, Text } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
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
  // The LoadoutItem currently occupying this slot (via its own footprint), if any.
  // Distinct from a plain boolean so a move operation can tell "occupied by the
  // item being moved itself" (fine to drop back onto) from "occupied by something
  // else" (not a valid target).
  occupiedByItemId: number | null
}

interface Props {
  component: ComponentResponse
  itemId: number
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
  selectedItemId: number | null
  onSelectItem: (itemId: number | null) => void
  onDeleteItem: (itemId: number) => void
  onItemDragEnd: (itemId: number, componentId: number, anchorStageX: number, anchorStageY: number) => void
}

export function CanvasNode({
  component,
  itemId,
  targetX,
  targetY,
  anchorPercent,
  width,
  componentsById,
  childItemsBySlotId,
  onSlotsComputed,
  colorway,
  selectedItemId,
  onSelectItem,
  onDeleteItem,
  onItemDragEnd,
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
  // these must count as occupied too, not as free drop targets. Keyed by which
  // item's footprint claims the slot, so a move can exclude "occupied by itself".
  const occupiedByItemId = useMemo(() => {
    const occupied = new Map<number, number>()
    for (const slot of component.slots) {
      const childItem = childItemsBySlotId.get(slot.id)
      if (!childItem) continue
      const childComponent = componentsById.get(childItem.componentId)
      if (!childComponent) continue
      const footprint = computeFootprintSlotIds(childComponent, slot, component.slots)
      footprint?.forEach(id => occupied.set(id, childItem.id))
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
        occupiedByItemId: occupiedByItemId.get(slot.id) ?? childItemsBySlotId.get(slot.id)?.id ?? null,
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component, x, y, width, height, occupiedByItemId])

  function handleDragEnd(e: KonvaEventObject<DragEvent>) {
    const node = e.target
    const newX = node.x()
    const newY = node.y()
    // Snap back immediately — the real move only happens once the server
    // confirms it and the tree re-renders from fresh data. Without this, a
    // rejected or still-pending move would leave the sprite wherever Konva's
    // own drag left it, out of sync with the source of truth.
    node.position({ x, y })
    if (height != null) {
      const anchorStageX = newX + (anchorPercent.x / 100) * width
      const anchorStageY = newY + (anchorPercent.y / 100) * height
      onItemDragEnd(itemId, component.id, anchorStageX, anchorStageY)
    }
  }

  return (
    <>
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
            <SlotMarker key={slot.id} x={sx} y={sy} occupied={occupiedByItemId.has(slot.id)} />
          )
        })}

      {component.svgAssetPath && (
        <ComponentSprite
          url={component.svgAssetPath}
          x={x}
          y={y}
          width={width}
          colorway={colorway}
          draggable
          onLoad={(nw, nh) => setNaturalSize({ w: nw, h: nh })}
          onClick={e => {
            e.cancelBubble = true
            onSelectItem(selectedItemId === itemId ? null : itemId)
          }}
          onDragEnd={handleDragEnd}
        />
      )}

      {selectedItemId === itemId && height != null && (
        <>
          <Rect x={x} y={y} width={width} height={height} stroke="#6ee7a0" strokeWidth={2} listening={false} />
          <Group
            x={x + width - 2}
            y={y - 2}
            onClick={e => {
              e.cancelBubble = true
              onDeleteItem(itemId)
            }}
            onTap={e => {
              e.cancelBubble = true
              onDeleteItem(itemId)
            }}
          >
            <Circle radius={10} fill="#f87171" stroke="#0f1117" strokeWidth={1} />
            <Text text="×" fontSize={16} fill="#0f1117" width={20} height={20} x={-10} y={-10} align="center" verticalAlign="middle" />
          </Group>
        </>
      )}

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
              itemId={childItem.id}
              targetX={sx}
              targetY={sy}
              anchorPercent={getAnchorMountPointPercent(childComponent)}
              width={childWidth}
              componentsById={componentsById}
              childItemsBySlotId={childItemsBySlotId}
              onSlotsComputed={onSlotsComputed}
              colorway={colorway}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
              onDeleteItem={onDeleteItem}
              onItemDragEnd={onItemDragEnd}
            />
          )
        })}
    </>
  )
}
