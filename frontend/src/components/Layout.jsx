import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

export default function Layout() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="ESATIC Gestion" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'contain', background: 'white', padding: 4 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '.02em' }}>ESATIC</div>
            <div style={{ fontSize: 12, opacity: .8, color: 'white' }}>Gestion des Absences</div>
          </div>
        </div>
        <nav className="sidebar-nav">

          <div className="nav-section">Accueil</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            Tableau de bord
          </NavLink>

          {/* Classes — accessible à tous */}
          <div className="nav-section">Classes</div>
          <NavLink to="/classes" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            Mes classes
          </NavLink>

          {/* Paramétrage — admin seulement */}
          {isAdmin && (
            <>
              <div className="nav-section">Paramétrage</div>
              <NavLink to="/parametrage/periodes" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                Périodes
              </NavLink>
              <NavLink to="/parametrage/matieres" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                Matières
              </NavLink>
              <NavLink to="/parametrage/enseignants" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                Enseignants
              </NavLink>
            </>
          )}

          {/* Rapports globaux — admin seulement */}
          {isAdmin && (
            <>
              <div className="nav-section">Rapports globaux</div>
              <NavLink to="/rapports/absences" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                Absences
              </NavLink>
              <NavLink to="/rapports/matieres" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                Matières / filière
              </NavLink>
              <NavLink to="/rapports/etudiant" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                Par étudiant
              </NavLink>
            </>
          )}

        </nav>
        <div style={{ padding: '14px 18px', borderTop: '2px solid var(--primary-light)' }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{user.prenom} {user.nom}</span>
            <span className="badge badge-primary" style={{ fontSize: 10 }}>{user.role}</span>
          </div>
          <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span className="topbar-title">ESATIC — Gestion des Absences</span>
          <div className="topbar-user">
            <div className="avatar">{(user.prenom || 'U')[0]}{(user.nom || '')[0]}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{user.prenom} {user.nom}</span>
          </div>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
