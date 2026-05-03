import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { Spinner, EmptyState } from '../../components/ui'

export default function ClassePresences() {
  const { filiereId } = useParams()
  const [filiere, setFiliere] = useState(null)
  const [affectations, setAffectations] = useState([])
  const [selectedAff, setSelectedAff] = useState('')
  const [seances, setSeances] = useState([])
  const [selectedSeance, setSelectedSeance] = useState('')
  const [etudiants, setEtudiants] = useState([])
  const [presences, setPresences] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  useEffect(() => {
    Promise.all([
      api.get('/filieres'),
      api.get(`/affectations?filiere_id=${filiereId}${!isAdmin ? `&enseignant_id=${user.id}` : ''}`)
    ]).then(([fr, ar]) => {
      setFiliere(fr.data.find(x => x.id == filiereId))
      setAffectations(ar.data)
    }).finally(() => setLoading(false))
  }, [filiereId])

  const onSelectAff = async affId => {
    setSelectedAff(affId); setSelectedSeance(''); setSeances([]); setEtudiants([]); setPresences({})
    if (!affId) return
    const r = await api.get(`/seances/affectation/${affId}`)
    setSeances(r.data)
  }

  const onSelectSeance = async seanceId => {
    setSelectedSeance(seanceId)
    if (!seanceId) { setEtudiants([]); setPresences({}); return }
    const [etudRes, presRes] = await Promise.all([
      api.get(`/presences/filiere/${filiereId}/affectation/${selectedAff}`),
      api.get(`/presences/seance/${seanceId}`)
    ])
    setEtudiants(etudRes.data)
    const pMap = {}
    etudRes.data.forEach(e => { pMap[e.id] = 'present' })
    presRes.data.forEach(p => { pMap[p.etudiant_id] = p.statut })
    setPresences(pMap)
  }

  const save = async () => {
    if (!selectedSeance) return
    setSaving(true)
    const payload = etudiants.map(e => ({ etudiant_id: e.id, statut: presences[e.id] || 'present' }))
    try {
      await api.post('/presences/bulk', { seance_id: parseInt(selectedSeance), presences: payload })
      setSaved(true); setTimeout(() => setSaved(false), 4000)
      // Recharger pour avoir les heures à jour
      const etudRes = await api.get(`/presences/filiere/${filiereId}/affectation/${selectedAff}`)
      setEtudiants(etudRes.data)
    } catch (err) { alert(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const tousPresents = () => { const u = {}; etudiants.forEach(e => { u[e.id] = 'present' }); setPresences(u) }
  const nbPresents = Object.values(presences).filter(v => v === 'present').length
  const nbAbsents = Object.values(presences).filter(v => v === 'absent').length
  const nbRetard = Object.values(presences).filter(v => v === 'retard').length
  const seance = seances.find(s => s.id == selectedSeance)
  const aff = affectations.find(a => a.id == selectedAff)

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/classes">Classes</Link><span>›</span>
        <Link to={`/classes/${filiereId}`}>{filiere?.libelle_filiere || '...'}</Link><span>›</span>
        <span className="current">Cahier d'appel</span>
      </div>
      <div className="page-header">
        <div>
          <div className="page-title">📋 Cahier d'appel — {filiere?.code_filiere}</div>
          <div className="page-subtitle">Sélectionnez un cours et une séance pour faire l'appel</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          {loading ? <Spinner /> : affectations.length === 0 ? (
            <div className="alert alert-info">
              Aucun cours affecté. <Link to={`/classes/${filiereId}/seances`} style={{ fontWeight: 700 }}>Créer des séances →</Link>
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Cours *</label>
                <select value={selectedAff} onChange={e => onSelectAff(e.target.value)}>
                  <option value="">-- Choisir un cours --</option>
                  {affectations.map(a => <option key={a.id} value={a.id}>{a.nom_matiere} — {a.ens_nom} {a.ens_prenom}</option>)}
                </select>
              </div>
              {selectedAff && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Séance *</label>
                  {seances.length === 0 ? (
                    <div className="alert alert-info" style={{ marginTop: 4 }}>
                      Aucune séance pour ce cours. <Link to={`/classes/${filiereId}/seances`} style={{ fontWeight: 700 }}>Créer une séance →</Link>
                    </div>
                  ) : (
                    <select value={selectedSeance} onChange={e => onSelectSeance(e.target.value)}>
                      <option value="">-- Choisir une séance --</option>
                      {seances.map(s => (
                        <option key={s.id} value={s.id}>
                          {new Date(s.date_seance).toLocaleDateString('fr-FR')} · {s.heure_debut}–{s.heure_fin} · {s.nb_absents} absent(s)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedSeance && etudiants.length > 0 && (
        <>
          <div className="stats-grid" style={{ marginBottom: 14 }}>
            {[
              { label: 'Présents', val: nbPresents, color: '#059669', bg: '#d1fae5', icon: '✅' },
              { label: 'Absents', val: nbAbsents, color: '#dc2626', bg: '#fee2e2', icon: '❌' },
              { label: 'Retards', val: nbRetard, color: '#d97706', bg: '#fef3c7', icon: '⏰' },
              { label: 'Total', val: etudiants.length, color: 'var(--primary-darker)', bg: 'var(--primary-light)', icon: '👥' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: s.bg, fontSize: 18 }}>{s.icon}</div>
                <div><div className="stat-value" style={{ color: s.color }}>{s.val}</div><div className="stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <span className="card-title">Appel</span>
                {seance && (
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                    {aff?.nom_matiere} · {new Date(seance.date_seance).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {seance.heure_debut}–{seance.heure_fin}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-outline btn-sm" onClick={tousPresents}>✓ Tous présents</button>
                {saved && <span className="badge badge-success">✓ Enregistré !</span>}
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '...' : '💾 Enregistrer'}</button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Matricule</th><th>Nom & Prénom</th>
                    <th style={{ textAlign: 'center' }}>Heures absences</th>
                    <th style={{ textAlign: 'center', color: '#059669' }}>✅</th>
                    <th style={{ textAlign: 'center', color: '#dc2626' }}>❌</th>
                    <th style={{ textAlign: 'center', color: '#d97706' }}>⏰</th>
                    <th>Parent</th>
                  </tr>
                </thead>
                <tbody>
                  {etudiants.map((etud, i) => {
                    const statut = presences[etud.id] || 'present'
                    const hAbsences = parseInt(etud.heures_absence) || 0
                    return (
                      <tr key={etud.id} style={{ background: statut === 'absent' ? '#fff5f5' : statut === 'retard' ? '#fffbf0' : 'white' }}>
                        <td style={{ color: 'var(--gray-400)' }}>{i + 1}</td>
                        <td><span className="badge badge-primary">{etud.matricule}</span></td>
                        <td style={{ fontWeight: 600 }}>{etud.nom} {etud.prenom}</td>
                        <td style={{ textAlign: 'center' }}>
                          {hAbsences > 0
                            ? <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 13 }}>{hAbsences}h</span>
                            : <span style={{ color: '#94a3b8', fontSize: 12 }}>0h</span>}
                        </td>
                        {['present', 'absent', 'retard'].map(s => (
                          <td key={s} style={{ textAlign: 'center' }}>
                            <button onClick={() => setPresences(p => ({ ...p, [etud.id]: s }))}
                              style={{
                                width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 16,
                                background: statut === s ? (s === 'present' ? '#059669' : s === 'absent' ? '#dc2626' : '#d97706') : '#f1f5f9',
                                color: statut === s ? 'white' : '#94a3b8',
                                transform: statut === s ? 'scale(1.15)' : 'scale(1)',
                                transition: 'all .15s'
                              }}>
                              {s === 'present' ? '✓' : s === 'absent' ? '✗' : '⏰'}
                            </button>
                          </td>
                        ))}
                        <td style={{ textAlign: 'center' }}>
                          {etud.email_parent
                            ? <span title={etud.email_parent} style={{ color: '#059669' }}>📧</span>
                            : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {selectedSeance && etudiants.length === 0 && <EmptyState message="Aucun étudiant inscrit dans cette classe" />}
    </div>
  )
}
