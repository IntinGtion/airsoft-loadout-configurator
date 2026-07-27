export interface Colorway {
  name: string
  hex: string | null // null = each component's own authored color
}

// Solid recolors only — a real Multicam swap would need a pattern fill, not a flat
// hex, which the current SVG-text recolor approach (recolorSvg.ts) can't produce.
export const COLORWAYS: Colorway[] = [
  { name: 'Original', hex: null },
  { name: 'Ranger Green', hex: '#4b5320' },
  { name: 'Coyote Tan', hex: '#8a7355' },
  { name: 'Black', hex: '#1c1c1c' },
]
