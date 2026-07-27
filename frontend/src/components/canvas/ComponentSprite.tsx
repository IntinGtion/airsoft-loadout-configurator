import { useEffect } from 'react'
import { Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'

interface Props {
  url: string
  x: number
  y: number
  width: number
  opacity?: number
  onLoad?: (naturalWidth: number, naturalHeight: number) => void
}

export function ComponentSprite({ url, x, y, width, opacity = 1, onLoad }: Props) {
  const [image] = useImage(url)

  useEffect(() => {
    if (image) onLoad?.(image.naturalWidth, image.naturalHeight)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image])

  if (!image) return null

  const height = width * (image.naturalHeight / image.naturalWidth)
  return <KonvaImage image={image} x={x} y={y} width={width} height={height} opacity={opacity} />
}
