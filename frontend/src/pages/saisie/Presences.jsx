import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Spinner, EmptyState } from '../../components/ui'

export default function Presences() {
  const [enseignements, setEnseignements] = useState([])
  const [filieres, setFilieres] = useState([])
  const [selectedEns, setSelectedEns] = useState('')
  const [etudiants, setEtudiants] = useState([])
  const [presences, setPresences] = useState({}) // etudiant_id -> statut
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/enseignements'), api.get('/filieres')])
      .then(([e, f]) => { setEnseignements(e.data); setFilieres(f.data) })
      .finally(() => setLoading(false))
  }, [])

  const loadSession = async (ensId) => {
    setSelectedEns(ensId)
    setPresences({})
    if (!ensId) { setEtudiants([]); return }
    
    const ens = enseignements.find(e => e.id == ensId)
    if (!ens) return

    // Load students of that filiere
    const [etudRes, presRes] = await Promise.all([
      api.get(`/presences/filiere/${ens.filiere_id}`),
      api.get(`/presences/enseignement/${ensId}`)
    ])

    setEtudiants(etudRes.data)
    const pMap = {}
    presRes.data.forEach(p => { pMap[p.etudiant_id] = p.statut })
    // Default: present
    etudRes.data.forEach(e => { if (!pMap[e.id]) pMap[e.id] = 'present' })
    setPresences(pMap)
  }

  const setStatut = (etudId, statut) => setPresences(p => ({ ...p, [etudId]: statut }))

  const save = async () => {
    if (!selectedEns) return
    setSaving(true)
    const payload = etudiants.map(e => ({ etudiant_id: e.id, statut: presences[e.id] || 'present' }))
    try {
      await api.post('/presences/bulk', { enseignement_id: parseInt(selectedEns), presences: payload })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { alert(err.response?.data?.error || 'Erreur lors de la sauvegarde') }
    finally { setSaving(false) }
  }

  const ens = enseignements.find(e => e.id == selectedEns)
  const nbAbsents = Object.values(presences).filter(v => v === 'absent').length
  const nbPresents = Object.values(presences).filter(v => v === 'present').length

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Saisie des Présences</div><div className="page-subtitle">Enregistrer les présences et absences par séance</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Sélectionner une séance d'enseignement *</label>
            <select value={selectedEns} onChange={e => loadSession(e.target.value)}>
              <option value="">-- Choisir une séance --</option>
              {enseignements.map(e => (
                <option key={e.id} value={e.id}>
                  {new Date(e.date_enseignement).toLocaleDateString('fr-FR')} — {e.nom_matiere} ({e.libelle_filiere}) — {e.ens_nom} {e.ens_prenom} {e.horaire ? `[${e.horaire}]` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {ens && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-icon" style={{ background: 'var(--success-light)' }}>✅</div>
            <div><div className="stat-value" style={{ color: 'var(--success)' }}>{nbPresents}</div><div className="stat-label">Présents</div></div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>❌</div>
            <div><div className="stat-value" style={{ color: 'var(--danger)' }}>{nbAbsents}</div><div className="stat-label">Absents</div></div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>⏰</div>
            <div><div className="stat-value" style={{ color: 'var(--warning)' }}>{Object.values(presences).filter(v => v === 'retard').length}</div><div className="stat-label">En retard</div></div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>👥</div>
            <div><div className="stat-value">{etudiants.length}</div><div className="stat-label">Total</div></div>
          </div>
        </div>
      )}

      {selectedEns && etudiants.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Feuille de présence — {ens?.nom_matiere}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-outline btn-sm" onClick={() => {
                const updated = {}; etudiants.forEach(e => { updated[e.id] = 'present' }); setPresences(updated)
              }}>Tous présents</button>
              {saved && <span className="badge badge-success">✓ Enregistré</span>}
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Sauvegarde...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
          <div className="table-wrap presence-table">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Matricule</th><th>Nom & Prénom</th>
                  <th style={{ textAlign: 'center' }}>Présent</th>
                  <th style={{ textAlign: 'center' }}>Absent</th>
                  <th style={{ textAlign: 'center' }}>Retard</th>
                </tr>
              </thead>
              <tbody>
                {etudiants.map((etud, i) => (
                  <tr key={etud.id} style={{ background: presences[etud.id] === 'absent' ? '#fff5f5' : presences[etud.id] === 'retard' ? '#fffbf0' : 'white' }}>
                    <td style={{ color: 'var(--gray-400)', width: 40 }}>{i + 1}</td>
                    <td><span className="badge badge-gray">{etud.matricule}</span></td>
                    <td style={{ fontWeight: 500 }}>{etud.nom} {etud.prenom}</td>
                    {['present', 'absent', 'retard'].map(s => (
                      <td key={s} style={{ textAlign: 'center' }}>
                        <button
                          className={`status-btn ${s}${presences[etud.id] === s ? ' active' : ''}`}
                          onClick={() => setStatut(etud.id, s)}
                        >
                          {s === 'present' ? '✓' : s === 'absent' ? '✗' : '⏰'}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEns && etudiants.length === 0 && (
        <EmptyState message="Aucun étudiant dans cette filière" />
      )}

      {!selectedEns && (
        <div className="card">
          <div className="card-body">
            <EmptyState message="Sélectionnez une séance pour commencer la saisie" />
          </div>
        </div>
      )}
    </div>
  )
}
