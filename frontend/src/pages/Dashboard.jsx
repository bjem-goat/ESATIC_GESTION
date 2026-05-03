import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [filieres, setFilieres] = useState([])
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  useEffect(() => {
    api.get('/rapports/stats').then(r => setStats(r.data)).catch(() => {})
    api.get('/filieres').then(r => setFilieres(r.data)).catch(() => {})
  }, [])

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-darker) 100%)',
        borderRadius: 14, padding: '28px 32px', marginBottom: 24, color: 'white',
        boxShadow: '0 8px 24px rgba(56,189,248,.35)'
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
          Bonjour, {user.prenom} 👋
        </div>
        <div style={{ opacity: .85, fontSize: 13 }}>
          Bienvenue sur le Système de Gestion des Absences — MBDS
        </div>
      </div>

      {/* Stats */}
      {isAdmin && stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Étudiants', val: stats.nb_etudiants, bg: 'var(--primary-light)', color: 'var(--primary-darker)', icon: '👥' },
            { label: 'Enseignants', val: stats.nb_enseignants, bg: '#d1fae5', color: 'var(--success)', icon: '🧑‍🏫' },
            { label: 'Absences totales', val: stats.nb_absences, bg: '#fee2e2', color: 'var(--danger)', icon: '❌' },
            { label: 'Justif. en attente', val: stats.nb_justif_attente, bg: '#fef3c7', color: 'var(--warning)', icon: '⏳' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, fontSize: 20 }}>{s.icon}</div>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.val ?? '...'}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick access to classes */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">📚 Accès rapide aux classes</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/classes')}>Voir toutes →</button>
        </div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {filieres.slice(0, 6).map(f => (
            <div key={f.id}
              onClick={() => navigate(`/classes/${f.id}`)}
              style={{
                background: 'var(--primary-lighter)', border: '1.5px solid var(--primary-light)',
                borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'all .15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-lighter)'; e.currentTarget.style.borderColor = 'var(--primary-light)' }}
            >
              <div style={{ fontWeight: 700, color: 'var(--primary-darker)', fontSize: 12, marginBottom: 4 }}>{f.code_filiere}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{f.libelle_filiere}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{f.nbre_etud} étudiant(s)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">⚙️ Paramétrage</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '📅 Périodes d\'évaluation', href: '/parametrage/periodes' },
                { label: '📖 Matières', href: '/parametrage/matieres' },
                { label: '🧑‍🏫 Enseignants', href: '/parametrage/enseignants' },
              ].map(({ label, href }) => (
                <a key={href} href={href} className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>{label}</a>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">📊 Rapports globaux</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '📉 Absences par filière', href: '/rapports/absences' },
                { label: '📚 Matières par filière', href: '/rapports/matieres' },
                { label: '👤 Rapport par étudiant', href: '/rapports/etudiant' },
              ].map(({ label, href }) => (
                <a key={href} href={href} className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>{label}</a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
