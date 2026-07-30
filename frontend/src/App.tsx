import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { api } from './api'
import { ComponentBrowser } from './pages/ComponentBrowser'
import { LoadoutBuilder } from './pages/LoadoutBuilder'
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
        <span className={styles.logo}>⚙ Loadout Configurator</span>
        <nav className={styles.nav}>
          <Link className={styles.navLink} to="/">Browse</Link>
          <Link className={styles.navLink} to="/loadouts">My Loadouts</Link>
        </nav>
        <button className={styles.newLoadoutBtn} onClick={handleNewLoadout}>
          + New Loadout
        </button>
      </header>
      <div className={styles.body}>
        <Routes>
          <Route path="/" element={<ComponentBrowser />} />
          <Route path="/loadouts" element={<LoadoutsPage onCreate={handleNewLoadout} />} />
          <Route path="/loadout/:id" element={<LoadoutBuilder />} />
          <Route path="/loadout/:id/canvas" element={<CanvasView />} />
        </Routes>
      </div>
    </div>
  )
}
