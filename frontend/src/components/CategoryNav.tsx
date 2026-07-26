import type { CategoryResponse } from '../api/types'
import styles from './CategoryNav.module.css'

const ICONS: Record<string, string> = {
  'plate-carrier': '🦺',
  rifle:           '🔫',
  pistol:          '🔫',
  optic:           '🔭',
  pouch:           '🎒',
}

interface Props {
  categories: CategoryResponse[]
  selected: number | null
  onSelect: (id: number | null) => void
}

export function CategoryNav({ categories, selected, onSelect }: Props) {
  return (
    <nav className={styles.nav}>
      <h2 className={styles.heading}>Categories</h2>
      <ul className={styles.list}>
        <li>
          <button
            className={`${styles.item} ${selected === null ? styles.active : ''}`}
            onClick={() => onSelect(null)}
          >
            All
          </button>
        </li>
        {categories.map(cat => (
          <li key={cat.id}>
            <button
              className={`${styles.item} ${selected === cat.id ? styles.active : ''}`}
              onClick={() => onSelect(cat.id)}
            >
              <span className={styles.icon}>{ICONS[cat.icon] ?? '📦'}</span>
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
