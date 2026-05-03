import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Spinner, EmptyState, Modal } from '../../components/ui'

export default function Justifications() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [motifModal, setMotifModal] = useState(null)
  const [motif, setMotif] = useState('')

  const load = () => api.get('/justifications').then(r => setData(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const updateStatut = async (id, statut) => {
    await api.patch(`/justifications/${id}/statut`, { statut }).then(load)
  }

  const addJustif = async (e) => {
    e.preventDefault()
    // This would need a presence_id - simplified flow
    alert('Fonctionnalité : saisir un motif pour une absence existante depuis le rapport')
    setMotifModal(null)
  }

  const filtered = data.filter(j => filter === 'all' || j.statut === filter)

  const statutBadge = s => {
    if (s === 'validee') return <span className="badge badge-success">Validée</span>
    if (s === 'rejetee') return <span className="badge badge-danger">Rejetée</span>
    return <span className="badge badge-warning">En attente</span>
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Justifications d'absence</div><div className="page-subtitle">Traitement des justifications soumises par les étudiants</div></div>
      </div>

      <div className="filters">
        {['all', 'en_attente', 'validee', 'rejetee'].map(s => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'Toutes' : s === 'en_attente' ? 'En attente' : s === 'validee' ? 'Validées' : 'Rejetées'}
            {s !== 'all' && <span className="badge badge-gray" style={{ marginLeft: 4 }}>{data.filter(d => d.statut === s).length}</span>}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <Spinner /> : filtered.length === 0 ? <EmptyState message="Aucune justification" /> : (
            <table>
              <thead>
                <tr><th>Étudiant</th><th>Matière</th><th>Date séance</th><th>Motif</th><th>Statut</th><th>Date soumission</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td><div style={{ fontWeight: 500 }}>{row.etud_nom} {row.etud_prenom}</div><div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{row.matricule}</div></td>
                    <td>{row.nom_matiere}</td>
                    <td>{row.date_enseignement ? new Date(row.date_enseignement).toLocaleDateString('fr-FR') : '-'}</td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.motif}>{row.motif}</div>
                    </td>
                    <td>{statutBadge(row.statut)}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(row.date_soumission).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {row.statut === 'en_attente' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-success btn-sm" onClick={() => updateStatut(row.id, 'validee')}>✓ Valider</button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateStatut(row.id, 'rejetee')}>✗ Rejeter</button>
                        </div>
                      )}
                      {row.statut !== 'en_attente' && (
                        <button className="btn btn-outline btn-sm" onClick={() => updateStatut(row.id, 'en_attente')}>↩ Annuler</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
