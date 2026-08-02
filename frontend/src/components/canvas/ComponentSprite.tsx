import { useEffect, useState } from 'react'
import { Image as KonvaImage } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import useImage from 'use-image'
import type { Colorway } from './colorways'
import { resolveComponentUrl } from './textureCompositor'

interface Props {
  url: string
  x: number
  y: number
  width: number
  opacity?: number
  colorway?: Colorway | null
  draggable?: boolean
  onLoad?: (naturalWidth: number, naturalHeight: number) => void
  onClick?: (e: KonvaEventObject<MouseEvent>) => void
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void
}

export function ComponentSprite({
  url,
  x,
  y,
  width,
  opacity = 1,
  colorway = null,
  draggable = false,
  onLoad,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}: Props) {
  const [resolvedUrl, setResolvedUrl] = useState(url)

  useEffect(() => {
    let cancelled = false
    resolveComponentUrl(url, colorway).then(u => {
      if (!cancelled) setResolvedUrl(u)
    })
    return () => { cancelled = true }
  }, [url, colorway])

  const [image] = useImage(resolvedUrl)

  useEffect(() => {
    if (image) onLoad?.(image.naturalWidth, image.naturalHeight)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image])

  if (!image) return null

  const height = width * (image.naturalHeight / image.naturalWidth)
  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      opacity={opacity}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    />
  )
}
