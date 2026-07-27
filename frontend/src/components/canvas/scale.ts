import type { ComponentResponse } from '../../api/types'

// Calibrated so the Condor MOPC (RealWidthMm = 270) renders at roughly the same
// size as the old fixed ROOT_DISPLAY_WIDTH (380px) used before real-world sizing
// existed, so this change doesn't suddenly make the canvas feel different scale
// overall — only the *relative* sizing between different components changes.
export const PX_PER_MM = 1.4

// Components without a RealWidthMm yet (most of the seed catalog still has no
// SVG asset at all) fall back to the given flat pixel width, same as before.
export function getDisplayWidth(component: ComponentResponse, fallbackWidth: number): number {
  return component.realWidthMm != null ? component.realWidthMm * PX_PER_MM : fallbackWidth
}
