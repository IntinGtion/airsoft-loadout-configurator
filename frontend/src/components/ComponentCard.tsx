import type { ComponentResponse } from '../api/types'
import styles from './ComponentCard.module.css'

interface Props {
  component: ComponentResponse
  onAdd?: (component: ComponentResponse) => void
}

export function ComponentCard({ component, onAdd }: Props) {
  const tags = component.acceptedAttachmentTypes.map(a => a.name)
  const slots = component.slots.map(s => s.attachmentTypeName)
    .filter((v, i, arr) => arr.indexOf(v) === i)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.category}>{component.categoryName}</p>
          <h3 className={styles.name}>{component.name}</h3>
          <p className={styles.manufacturer}>{component.manufacturer}</p>
        </div>
        {onAdd && (
          <button className={styles.addBtn} onClick={() => onAdd(component)} title="Add to loadout">
            +
          </button>
        )}
      </div>

      <div className={styles.stats}>
        {component.weightGrams != null && (
          <span className={styles.stat}>
            <span className={styles.statLabel}>Weight</span>
            {component.weightGrams >= 1000
              ? `${(component.weightGrams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`
              : `${component.weightGrams} g`}
          </span>
        )}
        {component.priceEur != null && (
          <span className={styles.stat}>
            <span className={styles.statLabel}>Price</span>
            €{component.priceEur.toLocaleString('de-DE')}
          </span>
        )}
      </div>

      {(tags.length > 0 || slots.length > 0) && (
        <div className={styles.tags}>
          {tags.map(t => (
            <span key={t} className={`${styles.tag} ${styles.tagAccepts}`}>{t}</span>
          ))}
          {slots.map(s => (
            <span key={s} className={`${styles.tag} ${styles.tagSlot}`}>{s} slot</span>
          ))}
        </div>
      )}
    </div>
  )
}
