import type { LoadoutResponse } from '../api/types'
import { formatPrice, formatWeight } from '../lib/format'
import styles from './LoadoutSidebar.module.css'

interface Props {
  loadout: LoadoutResponse | null
  loading: boolean
  onRemove: (itemId: number) => void
}

export function LoadoutSidebar({ loadout, loading, onRemove }: Props) {
  const items = loadout?.items ?? []
  const totalWeight = items.reduce((sum, i) => sum + (i.weightGrams ?? 0), 0)
  const totalPrice  = items.reduce((sum, i) => sum + (i.priceEur ?? 0), 0)

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.heading}>{loadout?.name ?? 'Loadout'}</h2>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No items yet — drag some in from the catalog.</p>
      ) : (
        <ul className={styles.list}>
          {items.map(item => (
            <li key={item.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <p className={styles.itemCategory}>{item.categoryName}</p>
                <p className={styles.itemName}>{item.componentName}</p>
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => onRemove(item.id)}
                title="Remove from loadout"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total weight</span>
            <span>{formatWeight(totalWeight)}</span>
          </div>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total price</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </div>
      )}
    </aside>
  )
}
