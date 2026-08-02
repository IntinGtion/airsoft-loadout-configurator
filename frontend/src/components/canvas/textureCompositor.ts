import type { Colorway } from './colorways'
import { getRecoloredSvgUrl } from './recolorSvg'

const svgTextCache = new Map<string, Promise<string>>()
const compositeCache = new Map<string, Promise<string>>()

function fetchSvgText(url: string): Promise<string> {
  let p = svgTextCache.get(url)
  if (!p) { p = fetch(url).then(r => r.text()); svgTextCache.set(url, p) }
  return p
}

function parseSvgSize(text: string): { w: number; h: number } {
  const vb = text.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  if (vb) return { w: parseFloat(vb[1]), h: parseFloat(vb[2]) }
  const w = text.match(/\bwidth="([\d.]+)"/)
  const h = text.match(/\bheight="([\d.]+)"/)
  return { w: w ? parseFloat(w[1]) : 300, h: h ? parseFloat(h[1]) : 300 }
}

function svgBlobUrl(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Composites a camo texture onto an SVG component shape.
//
// The SVG is split into two derived layers:
//   silhouette — fills only, no strokes  →  defines the alpha mask (component shape)
//   detail     — strokes only, no fills  →  MOLLE slots / edges / bars on top
//
// The camo texture is tiled (repeat) and clipped to the silhouette via
// source-in compositing, then the detail strokes are drawn on top.
// The result is returned as a PNG data URL at the SVG's natural resolution.
async function compositeTexture(svgUrl: string, textureUrl: string): Promise<string> {
  const key = `${svgUrl}::${textureUrl}`
  let p = compositeCache.get(key)
  if (p) return p

  p = (async () => {
    const svgText = await fetchSvgText(svgUrl)
    const { w, h } = parseSvgSize(svgText)

    const silhouetteSvg = svgText
      .replace(/stroke="[^"]*"/g, 'stroke="none"')
      .replace(/stroke-width="[^"]*"/g, '')

    const detailSvg = svgText
      .replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="none"')

    const [silhouetteImg, textureImg, detailImg] = await Promise.all([
      loadImg(svgBlobUrl(silhouetteSvg)),
      loadImg(textureUrl),
      loadImg(svgBlobUrl(detailSvg)),
    ])

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    ctx.drawImage(silhouetteImg, 0, 0, w, h)

    ctx.globalCompositeOperation = 'source-in'
    const pattern = ctx.createPattern(textureImg, 'repeat')!
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, w, h)

    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(detailImg, 0, 0, w, h)

    return canvas.toDataURL('image/png')
  })()

  compositeCache.set(key, p)
  return p
}

// Unified entry point used by ComponentSprite and the drag ghost preview.
//
// Original colorway → PNG (exact Figma rendering, derived by swapping .svg → .png).
// Solid colorway    → SVG with fill replaced (recolorSvg).
// Texture colorway  → SVG composited with camo pattern (compositeTexture).
export async function resolveComponentUrl(svgUrl: string, colorway: Colorway | null | undefined): Promise<string> {
  if (!colorway?.fill) return svgUrl.replace(/\.svg$/, '.png')
  if (colorway.fill.type === 'solid') return getRecoloredSvgUrl(svgUrl, colorway.fill.hex)
  return compositeTexture(svgUrl, colorway.fill.url)
}
