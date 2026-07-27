import { Circle } from 'react-konva'

interface Props {
  x: number
  y: number
  selected: boolean
  onClick?: () => void
}

const FREE_COLOR = '#6ee7a0'
const SELECTED_COLOR = '#e8eaf0'

export function SlotMarker({ x, y, selected, onClick }: Props) {
  return (
    <Circle
      x={x}
      y={y}
      radius={selected ? 7 : 6}
      fill={selected ? SELECTED_COLOR : FREE_COLOR}
      opacity={0.9}
      stroke="#0f1117"
      strokeWidth={1}
      onClick={onClick}
      onTap={onClick}
      onMouseEnter={e => {
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
