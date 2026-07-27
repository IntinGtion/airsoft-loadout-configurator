// Konva draws SVGs as rasterized <img> bitmaps (via use-image), so recoloring has to
// happen on the SVG source text before it's ever loaded as an image — CSS filters or
// fill overrides on the resulting Konva.Image wouldn't touch the original vector fill.
// Every component asset so far has exactly one solid hex fill on its main silhouette
// (see frontend/public/components/*.svg), so a blanket text replace is enough; this
// would need a real per-shape convention if an asset ever needs multiple independently
// colored regions.

const rawSvgTextCache = new Map<string, Promise<string>>()
const recoloredUrlCache = new Map<string, string>()

function fetchSvgText(url: string): Promise<string> {
  let cached = rawSvgTextCache.get(url)
  if (!cached) {
    cached = fetch(url).then(r => r.text())
    rawSvgTextCache.set(url, cached)
  }
  return cached
}

export async function getRecoloredSvgUrl(url: string, colorHex: string | null): Promise<string> {
  if (!colorHex) return url

  const cacheKey = `${url}::${colorHex}`
  const cached = recoloredUrlCache.get(cacheKey)
  if (cached) return cached

  const svgText = await fetchSvgText(url)
  const recolored = svgText.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${colorHex}"`)
  const objectUrl = URL.createObjectURL(new Blob([recolored], { type: 'image/svg+xml' }))
  recoloredUrlCache.set(cacheKey, objectUrl)
  return objectUrl
}
