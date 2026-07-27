import { Circle } from 'react-konva'

interface Props {
  x: number
  y: number
  occupied?: boolean
  selected?: boolean
  onClick?: () => void
}

const FREE_COLOR = '#6ee7a0'
const SELECTED_COLOR = '#e8eaf0'
const OCCUPIED_COLOR = '#5a6080'

export function SlotMarker({ x, y, occupied = false, selected = false, onClick }: Props) {
  return (
    <Circle
      x={x}
      y={y}
      radius={selected ? 7 : occupied ? 4 : 6}
      fill={selected ? SELECTED_COLOR : occupied ? OCCUPIED_COLOR : FREE_COLOR}
      opacity={occupied ? 0.45 : 0.9}
      stroke="#0f1117"
      strokeWidth={1}
      onClick={occupied ? undefined : onClick}
      onTap={occupied ? undefined : onClick}
      listening={!occupied}
      onMouseEnter={e => {
        if (occupied) return
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'pointer'
      }}
      onMouseLeave={e => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'default'
      }}
    />
  )
}
