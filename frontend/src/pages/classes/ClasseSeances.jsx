import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Spinner, EmptyState } from '../../components/ui'

export default function ClasseSeances() {
  const { filiereId } = useParams()
  const navigate = useNavigate()
  const [filiere, setFiliere] = useState(null)
  const [affectations, setAffectations] = useState([])
  const [selectedAff, setSelectedAff] = useState('')
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [demarrant, setDemarrant] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    Promise.all([
      api.get('/filieres'),
      api.get(`/affectations?filiere_id=${filiereId}${!isAdmin ? `&enseignant_id=${user.id}` : ''}`)
    ]).then(([fr, ar]) => {
      setFiliere(fr.data.find(x => x.id == filiereId))
      setAffectations(ar.data)
    }).finally(() => setLoading(false))
  }, [filiereId])

  const loadSeances = async affId => {
    setSelectedAff(affId)
    if (!affId) { setSeances([]); return }
    const r = await api.get(`/seances/affectation/${affId}`)
    setSeances(r.data)
  }

  const demarrer = async (seanceId) => {
    if (!confirm('Confirmer le démarrage de cette séance ? Les heures seront déduites de votre volume horaire.')) return
    setDemarrant(seanceId)
    try {
      await api.post(`/seances/${seanceId}/demarrer`)
      await loadSeances(selectedAff)
      // Rediriger vers le cahier d'appel avec cette séance
      navigate(`/classes/${filiereId}/presences?seance=${seanceId}&aff=${selectedAff}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    } finally { setDemarrant(null) }
  }

  const deleteSeance = async id => {
    if (!confirm('Supprimer cette séance ?')) return
    await api.delete(`/seances/${id}`).then(() => loadSeances(selectedAff))
  }

  const aff = affectations.find(a => a.id == selectedAff)
  const pct = aff && aff.volume_horaire > 0 ? Math.round(((aff.volume_horaire - aff.heures_restantes) / aff.volume_horaire) * 100) : 0

  const seancesDuJour = seances.filter(s => s.date_seance?.split('T')[0] === today)
  const seancesPassees = seances.filter(s => s.date_seance?.split('T')[0] < today)
  const seancesFutures = seances.filter(s => s.date_seance?.split('T')[0] > today)

  const SeanceCard = ({ s, showDemarrer }) => (
    <tr key={s.id} style={{ background: s.demarre ? '#f0fdf4' : showDemarrer ? '#fefce8' : 'white' }}>
      <td style={{ fontWeight: 600 }}>
        {new Date(s.date_seance).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        {showDemarrer && <span className="badge badge-warning" style={{ marginLeft: 8 }}>Aujourd'hui</span>}
      </td>
      <td>{s.heure_debut || '—'} – {s.heure_fin || '—'}</td>
      <td><span style={{ fontWeight: 700, color: '#0284c7' }}>{s.duree_heures}h</span></td>
      <td>
        {s.demarre
          ? <span className="badge badge-success">✓ Effectuée</span>
          : <span className="badge badge-gray">Planifiée</span>}
      </td>
      <td>
        {parseInt(s.nb_absents) > 0
          ? <span className="badge badge-danger">{s.nb_absents} absent(s)</span>
          : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
      </td>
      <td style={{ display: 'flex', gap: 6 }}>
        {showDemarrer && !s.demarre && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => demarrer(s.id)}
            disabled={demarrant === s.id}
            style={{ fontWeight: 700 }}
          >
            {demarrant === s.id ? '...' : '▶ Démarrer'}
          </button>
        )}
        {s.demarre && (
          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/classes/${filiereId}/presences?seance=${s.id}&aff=${selectedAff}`)}>
            📋 Appel
          </button>
        )}
        {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => deleteSeance(s.id)}>🗑️</button>}
      </td>
    </tr>
  )

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/classes">Classes</Link><span>›</span>
        <Link to={`/classes/${filiereId}`}>{filiere?.libelle_filiere || '...'}</Link><span>›</span>
        <span className="current">Séances</span>
      </div>
      <div className="page-header">
        <div>
          <div className="page-title">📅 Séances — {filiere?.code_filiere}</div>
          <div className="page-subtitle">Vos séances planifiées. Démarrez celle du jour pour faire l'appel.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          {loading ? <Spinner /> : affectations.length === 0 ? (
            <div className="alert alert-info">Aucun cours affecté à cette classe.</div>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Choisir le cours</label>
              <select value={selectedAff} onChange={e => loadSeances(e.target.value)}>
                <option value="">-- Sélectionner un cours --</option>
                {affectations.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nom_matiere} — {a.ens_nom} {a.ens_prenom} — {a.heures_restantes}h restantes / {a.volume_horaire}h
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {aff && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>{aff.nom_matiere}</span>
              <span style={{ fontSize: 13 }}>
                <strong style={{ color: aff.heures_restantes === 0 ? '#dc2626' : '#059669' }}>{aff.heures_restantes}h restantes</strong> sur {aff.volume_horaire}h
              </span>
            </div>
            <div style={{ background: '#e2e8f0', borderRadius: 8, height: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 8, width: `${pct}%`, background: pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#059669', transition: 'width .5s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{pct}% effectué</div>
          </div>
        </div>
      )}

      {selectedAff && (
        <>
          {/* Séances du jour */}
          {seancesDuJour.length > 0 && (
            <div className="card" style={{ marginBottom: 14, border: '2px solid #fde047' }}>
              <div className="card-header" style={{ background: '#fefce8' }}>
                <span className="card-title" style={{ color: '#92400e' }}>📌 Séance d'aujourd'hui</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Heure</th><th>Durée</th><th>Statut</th><th>Absents</th><th>Actions</th></tr></thead>
                  <tbody>{seancesDuJour.map(s => <SeanceCard key={s.id} s={s} showDemarrer={true} />)}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Toutes les séances */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Toutes les séances ({seances.length})</span>
            </div>
            <div className="table-wrap">
              {seances.length === 0 ? (
                <EmptyState message="Aucune séance planifiée. L'admin doit les créer lors de l'affectation." />
              ) : (
                <table>
                  <thead><tr><th>Date</th><th>Heure</th><th>Durée</th><th>Statut</th><th>Absents</th><th>Actions</th></tr></thead>
                  <tbody>
                    {seances.map(s => <SeanceCard key={s.id} s={s} showDemarrer={s.date_seance?.split('T')[0] === today} />)}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
