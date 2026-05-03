import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import { Spinner } from '../../components/ui'

export default function ClasseDetail() {
  const { filiereId } = useParams()
  const navigate = useNavigate()
  const [filiere, setFiliere] = useState(null)
  const [stats, setStats] = useState(null)
  const [mesAffectations, setMesAffectations] = useState([])
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  useEffect(() => {
    api.get('/filieres').then(r => setFiliere(r.data.find(x => x.id == filiereId)))
    api.get(`/rapports/stats-filiere/${filiereId}`).then(r => setStats(r.data)).catch(() => {})
    if (!isAdmin && user.id) {
      api.get(`/affectations?filiere_id=${filiereId}&enseignant_id=${user.id}`)
        .then(r => setMesAffectations(r.data)).catch(() => {})
    }
  }, [filiereId])

  if (!filiere) return <Spinner />

  const modules = [
    { icon: '📌', title: 'Affectations', desc: "Configurer les enseignants et matières pour l'année", path: `/classes/${filiereId}/affectations`, color: '#0284c7', bg: '#e0f2fe', adminOnly: true },
    { icon: '👥', title: 'Étudiants', desc: 'Consulter et gérer les étudiants de cette classe', path: `/classes/${filiereId}/etudiants`, color: '#38bdf8', bg: '#f0f9ff', adminOnly: false },
    { icon: '📅', title: 'Séances', desc: 'Créer et gérer les séances de cours', path: `/classes/${filiereId}/seances`, color: '#7c3aed', bg: '#ede9fe', adminOnly: false },
    { icon: '📋', title: "Cahier d'appel", desc: 'Faire l\'appel pour une séance', path: `/classes/${filiereId}/presences`, color: '#059669', bg: '#d1fae5', adminOnly: false },
    { icon: '✅', title: 'Justifications', desc: 'Traiter les absences et justifications', path: `/classes/${filiereId}/justifications`, color: '#d97706', bg: '#fef3c7', adminOnly: false },
    { icon: '📁', title: 'Documents', desc: 'Déposer et consulter les supports de cours', path: `/classes/${filiereId}/documents`, color: '#db2777', bg: '#fce7f3', adminOnly: false },
    { icon: '📊', title: 'Rapport', desc: 'Rapport complet des absences', path: `/classes/${filiereId}/rapport`, color: '#64748b', bg: '#f1f5f9', adminOnly: false },
  ]
  const visible = modules.filter(m => !m.adminOnly || isAdmin)

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/classes">Classes</Link><span>›</span>
        <span className="current">{filiere.libelle_filiere}</span>
      </div>

      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-darker) 100%)', borderRadius: 14, padding: '28px 32px', marginBottom: 20, color: 'white', boxShadow: '0 8px 24px rgba(56,189,248,.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .8, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em' }}>Classe</div>
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{filiere.libelle_filiere}</div>
            <div style={{ opacity: .85, fontSize: 13 }}>Code : <strong>{filiere.code_filiere}</strong> · {filiere.nbre_etud} étudiant(s)</div>
          </div>
          <div style={{ fontSize: 52, opacity: .8 }}>🎓</div>
        </div>
      </div>

      {!isAdmin && mesAffectations.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '2px solid #86efac', borderRadius: 12, padding: '18px 22px', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#166534', marginBottom: 12 }}>📋 Mes interventions dans cette classe</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 10 }}>
            {mesAffectations.map(a => (
              <div key={a.id} style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: '1.5px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ background: '#0284c7', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{a.code_matiere}</span>
                  <span style={{ background: '#f0fdf4', color: '#166534', borderRadius: 6, padding: '2px 8px', fontSize: 13, fontWeight: 800, border: '1px solid #86efac' }}>{a.heures_restantes}h restantes</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 4 }}>{a.nom_matiere}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Volume total : {a.volume_horaire}h · {a.periode_libelle}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Étudiants', val: stats.nb_etudiants, bg: '#f0f9ff', icon: '👥' },
            { label: 'Séances', val: stats.nb_seances, bg: '#d1fae5', icon: '📅' },
            { label: 'Absences', val: stats.nb_absences, bg: '#fee2e2', icon: '❌' },
            { label: 'Justif. en attente', val: stats.nb_justif_attente, bg: '#fef3c7', icon: '⏳' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, fontSize: 18 }}>{s.icon}</div>
              <div><div className="stat-value">{s.val}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
        {visible.map(m => (
          <div key={m.path} onClick={() => navigate(m.path)}
            style={{ background: 'white', borderRadius: 12, padding: '20px', cursor: 'pointer', border: `2px solid ${m.bg}`, transition: 'all .2s', boxShadow: 'var(--shadow)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = m.bg; e.currentTarget.style.transform = '' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 10 }}>{m.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-900)', marginBottom: 4 }}>{m.title}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.5 }}>{m.desc}</div>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, color: m.color }}>Accéder →</div>
          </div>
        ))}
      </div>
    </div>
  )
}
