import { Circle } from 'react-konva'

interface Props {
  x: number
  y: number
  occupied: boolean
  // Set while a catalog item is being dragged and this slot is the nearest one
  // within snap distance — lets the user see where a drop would land, and
  // whether it would actually be accepted, before they let go of the mouse.
  hover?: 'compatible' | 'incompatible' | null
}

const FREE_COLOR = '#6ee7a0'
const OCCUPIED_COLOR = '#5a6080'
const HOVER_COMPATIBLE_COLOR = '#22d3ee'
const HOVER_INCOMPATIBLE_COLOR = '#f87171'

export function SlotMarker({ x, y, occupied, hover }: Props) {
  if (hover) {
    return (
      <Circle
        x={x}
        y={y}
        radius={9}
        fill={hover === 'compatible' ? HOVER_COMPATIBLE_COLOR : HOVER_INCOMPATIBLE_COLOR}
        opacity={0.9}
        stroke="#0f1117"
        strokeWidth={2}
        listening={false}
      />
    )
  }

  return (
    <Circle
      x={x}
      y={y}
      radius={occupied ? 4 : 6}
      fill={occupied ? OCCUPIED_COLOR : FREE_COLOR}
      opacity={occupied ? 0.45 : 0.9}
      stroke="#0f1117"
      strokeWidth={1}
      listening={false}
    />
  )
}
