import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { Modal, Spinner, EmptyState } from '../../components/ui'

export default function ClasseJustifications() {
  const { filiereId } = useParams()
  const [filiere, setFiliere] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [motifModal, setMotifModal] = useState(null) // { id, motif }

  const load = () => {
    Promise.all([
      api.get('/filieres'),
      api.get(`/justifications?filiere_id=${filiereId}`)
    ]).then(([fr, jr]) => {
      setFiliere(fr.data.find(x => x.id == filiereId))
      setData(jr.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filiereId])

  const updateStatut = async (id, statut, motif) => {
    await api.patch(`/justifications/${id}/statut`, { statut, motif }).then(load)
    setMotifModal(null)
  }

  const filtered = data.filter(j => filter === 'all' || j.statut === filter)

  const statutBadge = s => {
    if (s === 'validee') return <span className="badge badge-success">✓ Justifiée</span>
    if (s === 'rejetee') return <span className="badge badge-danger">✗ Non justifiée</span>
    return <span className="badge badge-warning">⏳ En attente</span>
  }

  const counts = {
    all: data.length,
    en_attente: data.filter(d => d.statut === 'en_attente').length,
    validee: data.filter(d => d.statut === 'validee').length,
    rejetee: data.filter(d => d.statut === 'rejetee').length,
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/classes">Classes</Link><span>›</span>
        <Link to={`/classes/${filiereId}`}>{filiere?.libelle_filiere || '...'}</Link><span>›</span>
        <span className="current">Justifications</span>
      </div>
      <div className="page-header">
        <div>
          <div className="page-title">✅ Justifications — {filiere?.code_filiere}</div>
          <div className="page-subtitle">Chaque absence génère automatiquement une ligne. Une ligne = une absence à une date précise.</div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        💡 Si vous <strong>justifiez</strong> une absence, les heures correspondantes sont décomptées du total d'absences de l'étudiant.
      </div>

      <div className="filters" style={{ marginBottom: 16 }}>
        {[['all','Toutes'],['en_attente','⏳ En attente'],['validee','✓ Justifiées'],['rejetee','✗ Non justifiées']].map(([k, label]) => (
          <button key={k} className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(k)}>
            {label} <span className="badge badge-gray" style={{ marginLeft: 4 }}>{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState message="Aucune absence enregistrée pour cette classe" />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Matière</th>
                  <th>Date de l'absence</th>
                  <th>Heure</th>
                  <th>Durée</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.etud_nom} {row.etud_prenom}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{row.matricule}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{row.code_matiere}</span>
                      <div style={{ fontSize: 11, marginTop: 2 }}>{row.nom_matiere}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {row.date_seance ? new Date(row.date_seance).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>{row.heure_debut && row.heure_fin ? `${row.heure_debut} – ${row.heure_fin}` : '—'}</td>
                    <td><span style={{ fontWeight: 700, color: '#dc2626' }}>{row.duree_heures || 2}h</span></td>
                    <td style={{ maxWidth: 150, fontSize: 12 }}>
                      {row.motif ? <span title={row.motif}>{row.motif.substring(0, 40)}{row.motif.length > 40 ? '…' : ''}</span> : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td>{statutBadge(row.statut)}</td>
                    <td>
                      {row.statut === 'en_attente' ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-success btn-sm" onClick={() => setMotifModal({ id: row.id, action: 'validee', nom: `${row.etud_prenom} ${row.etud_nom}` })}>✓ Justifier</button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateStatut(row.id, 'rejetee', null)}>✗ Rejeter</button>
                        </div>
                      ) : (
                        <button className="btn btn-outline btn-sm" onClick={() => updateStatut(row.id, 'en_attente', null)}>↩ Annuler</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {motifModal && (
        <Modal title="Justifier l'absence" onClose={() => setMotifModal(null)}
          footer={<><button className="btn btn-outline" onClick={() => setMotifModal(null)}>Annuler</button><button className="btn btn-success" form="motif-form" type="submit">✓ Valider la justification</button></>}>
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            Étudiant : <strong>{motifModal.nom}</strong><br />
            Les heures d'absence seront déduites du compteur.
          </div>
          <form id="motif-form" onSubmit={e => { e.preventDefault(); updateStatut(motifModal.id, 'validee', motifModal.motif) }}>
            <div className="form-group">
              <label>Motif de justification</label>
              <input value={motifModal.motif || ''} onChange={e => setMotifModal(m => ({ ...m, motif: e.target.value }))} placeholder="Ex: Certificat médical, décès..." />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
