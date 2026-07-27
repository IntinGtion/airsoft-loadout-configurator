import type { ComponentResponse, SlotResponse } from '../../api/types'

// Mirrors the backend's LoadoutsController.ComputeFootprint: given a component
// anchored at `anchorSlot`, returns the full set of parent slot IDs it occupies
// (matched via discrete grid coordinates, not percent positions — see
// DEVELOPMENT.md section 3 "Footprint-Matching" for why), or null if it doesn't
// actually fit (shouldn't happen for data the server already accepted).
export function computeFootprintSlotIds(
  childComponent: ComponentResponse,
  anchorSlot: SlotResponse,
  parentSlots: SlotResponse[]
): Set<number> | null {
  const gridMountPoints = childComponent.mountPoints.filter(
    m => m.gridColumn != null && m.gridRow != null
  )

  if (gridMountPoints.length === 0 || anchorSlot.gridColumn == null || anchorSlot.gridRow == null) {
    return new Set([anchorSlot.id])
  }

  const anchorMountPoint = [...gridMountPoints].sort(
    (a, b) => a.gridRow! - b.gridRow! || a.gridColumn! - b.gridColumn!
  )[0]

  const slotIds = new Set<number>()
  for (const mp of gridMountPoints) {
    const targetColumn = anchorSlot.gridColumn + (mp.gridColumn! - anchorMountPoint.gridColumn!)
    const targetRow = anchorSlot.gridRow + (mp.gridRow! - anchorMountPoint.gridRow!)
    const match = parentSlots.find(
      s => s.gridColumn === targetColumn && s.gridRow === targetRow && s.attachmentTypeId === mp.attachmentTypeId
    )
    if (!match) return null
    slotIds.add(match.id)
  }
  return slotIds
}
