import { useEffect, useState } from 'react'
import { Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import { getRecoloredSvgUrl } from './recolorSvg'

interface Props {
  url: string
  x: number
  y: number
  width: number
  opacity?: number
  colorway?: string | null
  onLoad?: (naturalWidth: number, naturalHeight: number) => void
}

export function ComponentSprite({ url, x, y, width, opacity = 1, colorway = null, onLoad }: Props) {
  const [resolvedUrl, setResolvedUrl] = useState(url)

  useEffect(() => {
    let cancelled = false
    getRecoloredSvgUrl(url, colorway).then(u => {
      if (!cancelled) setResolvedUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [url, colorway])

  const [image] = useImage(resolvedUrl)

  useEffect(() => {
    if (image) onLoad?.(image.naturalWidth, image.naturalHeight)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image])

  if (!image) return null

  const height = width * (image.naturalHeight / image.naturalWidth)
  return <KonvaImage image={image} x={x} y={y} width={width} height={height} opacity={opacity} />
}
