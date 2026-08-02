export type ColorwayFill =
  | { type: 'solid'; hex: string }
  | { type: 'texture'; url: string }

export interface Colorway {
  id: string
  name: string
  fill: ColorwayFill | null  // null = use the asset's own authored colors
}

export const COLORWAYS: Colorway[] = [
  { id: 'original',     name: 'Original',     fill: null },
  { id: 'ranger-green', name: 'Ranger Green',  fill: { type: 'solid',   hex: '#4b5320' } },
  { id: 'coyote-tan',   name: 'Coyote Tan',    fill: { type: 'solid',   hex: '#8a7355' } },
  { id: 'black',        name: 'Black',          fill: { type: 'solid',   hex: '#1c1c1c' } },
  { id: 'multicam',     name: 'Multicam',       fill: { type: 'texture', url: '/textures/multicam.svg' } },
  { id: 'flecktarn',    name: 'Flecktarn',      fill: { type: 'texture', url: '/textures/flecktarn.svg' } },
]
