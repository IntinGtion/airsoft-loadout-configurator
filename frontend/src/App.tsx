import { ComponentBrowser } from './pages/ComponentBrowser'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <span className={styles.logo}>⚙ Loadout Configurator</span>
      </header>
      <div className={styles.body}>
        <ComponentBrowser />
      </div>
    </div>
  )
}
