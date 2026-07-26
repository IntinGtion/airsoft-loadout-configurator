import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { LoadoutSummary } from '../api/types'
import styles from './LoadoutSwitcher.module.css'

export function LoadoutSwitcher() {
  const [loadouts, setLoadouts] = useState<LoadoutSummary[]>([])
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    api.loadouts.getAll().then(setLoadouts).catch(console.error)
  }, [])

  function handleToggle() {
    if (detailsRef.current?.open) {
      api.loadouts.getAll().then(setLoadouts).catch(console.error)
    }
  }

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false
  }

  return (
    <details ref={detailsRef} className={styles.dropdown} onToggle={handleToggle}>
      <summary className={styles.trigger}>My Loadouts</summary>
      <ul className={styles.menu}>
        {loadouts.length === 0 ? (
          <li className={styles.empty}>No loadouts yet</li>
        ) : (
          loadouts.map(l => (
            <li key={l.id}>
              <Link className={styles.menuItem} to={`/loadout/${l.id}`} onClick={closeMenu}>
                <span className={styles.menuItemName}>{l.name}</span>
                <span className={styles.menuItemCount}>{l.itemCount}</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </details>
  )
}
