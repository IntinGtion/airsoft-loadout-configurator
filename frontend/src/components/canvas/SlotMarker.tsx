import { Circle } from 'react-konva'

interface Props {
  x: number
  y: number
  occupied: boolean
}

const FREE_COLOR = '#6ee7a0'
const OCCUPIED_COLOR = '#5a6080'

export function SlotMarker({ x, y, occupied }: Props) {
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
