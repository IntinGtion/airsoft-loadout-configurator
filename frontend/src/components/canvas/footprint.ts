import type { ComponentResponse, MountPointResponse, SlotResponse } from '../../api/types'

// The mount point a component is anchored by when docking onto a parent slot —
// convention shared with the backend (LoadoutsController.ComputeFootprint):
// smallest grid row, then smallest grid column. Returns null for components with
// no grid-based mount points (nothing to anchor by).
function getAnchorMountPoint(component: ComponentResponse): MountPointResponse | null {
  const gridMountPoints = component.mountPoints.filter(
    m => m.gridColumn != null && m.gridRow != null
  )
  if (gridMountPoints.length === 0) return null
  return [...gridMountPoints].sort(
    (a, b) => a.gridRow! - b.gridRow! || a.gridColumn! - b.gridColumn!
  )[0]
}

// Where the anchor mount point sits within the component's own SVG (0-100%),
// used to position its rendered sprite so that point — not the sprite's visual
// center — lands exactly on the parent slot it's docked to. Falls back to the
// center for components without grid mount points, matching the simple
// single-point behavior they had before this distinction existed.
export function getAnchorMountPointPercent(component: ComponentResponse): { x: number; y: number } {
  const anchor = getAnchorMountPoint(component)
  return anchor ? { x: anchor.positionXPercent, y: anchor.positionYPercent } : { x: 50, y: 50 }
}

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
  const anchorMountPoint = getAnchorMountPoint(childComponent)

  if (!anchorMountPoint || anchorSlot.gridColumn == null || anchorSlot.gridRow == null) {
    return new Set([anchorSlot.id])
  }

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
