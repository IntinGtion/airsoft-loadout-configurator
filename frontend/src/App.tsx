import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { api } from './api'
import { LoadoutsPage } from './pages/LoadoutsPage'
import { CanvasView } from './pages/CanvasView'
import styles from './App.module.css'

export default function App() {
  const navigate = useNavigate()

  async function handleNewLoadout() {
    const name = window.prompt('Loadout name:', 'New Loadout')
    if (name === null) return
    const loadout = await api.loadouts.create(name || 'New Loadout')
    navigate(`/loadout/${loadout.id}`)
  }

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <Link className={styles.logo} to="/">⚙ Loadout Configurator</Link>
        <nav className={styles.nav}>
          <Link className={styles.navLink} to="/">My Loadouts</Link>
        </nav>
        <button className={styles.newLoadoutBtn} onClick={handleNewLoadout}>
          + New Loadout
        </button>
      </header>
      <div className={styles.body}>
        <Routes>
          <Route path="/" element={<LoadoutsPage onCreate={handleNewLoadout} />} />
          <Route path="/loadout/:id" element={<CanvasView />} />
        </Routes>
      </div>
    </div>
  )
}
