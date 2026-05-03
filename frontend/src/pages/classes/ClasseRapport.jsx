import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { Spinner, EmptyState } from '../../components/ui'

export default function ClasseRapport() {
  const { filiereId } = useParams()
  const [filiere, setFiliere] = useState(null)
  const [absences, setAbsences] = useState([])
  const [periodes, setPeriodes] = useState([])
  const [periodeId, setPeriodeId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/filieres'), api.get('/periodes')])
      .then(([fr, pr]) => {
        setFiliere(fr.data.find(x => x.id == filiereId))
        setPeriodes(pr.data)
      })
    loadAbsences()
  }, [filiereId])

  const loadAbsences = (pid = '') => {
    setLoading(true)
    const params = new URLSearchParams({ filiere_id: filiereId })
    if (pid) params.append('periode_id', pid)
    api.get(`/rapports/absences-filiere?${params}`)
      .then(r => setAbsences(r.data))
      .finally(() => setLoading(false))
  }

  const handlePeriode = (pid) => {
    setPeriodeId(pid)
    loadAbsences(pid)
  }

  const exportCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Matière', 'Date', 'Horaire', 'Justification']
    const rows = absences.map(r => [
      r.matricule, r.nom, r.prenom, r.nom_matiere,
      new Date(r.date_enseignement).toLocaleDateString('fr-FR'),
      r.horaire || '', r.justif_statut || 'Non justifiée'
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `absences_${filiere?.code_filiere}.csv`
    a.click()
  }

  // Group by student
  const byStudent = absences.reduce((acc, r) => {
    if (!acc[r.matricule]) acc[r.matricule] = { nom: r.nom, prenom: r.prenom, matricule: r.matricule, list: [] }
    acc[r.matricule].list.push(r)
    return acc
  }, {})

  const justifBadge = s => {
    if (s === 'validee') return <span className="badge badge-success">Justifiée</span>
    if (s === 'rejetee') return <span className="badge badge-danger">Rejetée</span>
    if (s === 'en_attente') return <span className="badge badge-warning">En attente</span>
    return <span className="badge badge-gray">Non justifiée</span>
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/classes">Classes</Link>
        <span>›</span>
        <Link to={`/classes/${filiereId}`}>{filiere?.libelle_filiere || '...'}</Link>
        <span>›</span>
        <span className="current">Rapport</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">📊 Rapport — {filiere?.code_filiere}</div>
          <div className="page-subtitle">Absences pour {filiere?.libelle_filiere}</div>
        </div>
        {absences.length > 0 && (
          <button className="btn btn-outline" onClick={exportCSV}>📥 Exporter CSV</button>
        )}
      </div>

      {/* Filter by periode */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="filters" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label>Filtrer par période</label>
              <select value={periodeId} onChange={e => handlePeriode(e.target.value)}>
                <option value="">Toutes les périodes</option>
                {periodes.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fee2e2' }}>❌</div>
            <div><div className="stat-value" style={{ color: 'var(--danger)' }}>{absences.length}</div><div className="stat-label">Total absences</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>👥</div>
            <div><div className="stat-value">{Object.keys(byStudent).length}</div><div className="stat-label">Étudiants concernés</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>✅</div>
            <div><div className="stat-value" style={{ color: 'var(--success)' }}>{absences.filter(a => a.justif_statut === 'validee').length}</div><div className="stat-label">Justifiées</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>⚠️</div>
            <div><div className="stat-value" style={{ color: 'var(--warning)' }}>{absences.filter(a => !a.justif_statut).length}</div><div className="stat-label">Non justifiées</div></div>
          </div>
        </div>
      )}

      {loading && <Spinner />}
      {!loading && absences.length === 0 && <EmptyState message="Aucune absence enregistrée pour cette classe 🎉" />}

      {/* Per student breakdown */}
      {!loading && Object.values(byStudent).map(etud => (
        <div key={etud.matricule} className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-darker))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
                {etud.prenom[0]}{etud.nom[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{etud.nom} {etud.prenom}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{etud.matricule}</div>
              </div>
            </div>
            <span className="badge badge-danger">{etud.list.length} absence{etud.list.length > 1 ? 's' : ''}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Matière</th><th>Date</th><th>Horaire</th><th>Justification</th></tr></thead>
              <tbody>
                {etud.list.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{row.nom_matiere}</td>
                    <td>{new Date(row.date_enseignement).toLocaleDateString('fr-FR')}</td>
                    <td>{row.horaire || '—'}</td>
                    <td>
                      {justifBadge(row.justif_statut)}
                      {row.justif_motif && <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{row.justif_motif}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
