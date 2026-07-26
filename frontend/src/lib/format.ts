export function formatWeight(grams: number): string {
  return grams >= 1000
    ? `${(grams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`
    : `${grams} g`
}

export function formatPrice(eur: number): string {
  return `€${eur.toLocaleString('de-DE')}`
}
