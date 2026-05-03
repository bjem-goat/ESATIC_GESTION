import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Spinner, EmptyState } from '../../components/ui'

export default function RapportAbsences() {
  const [data, setData] = useState([])
  const [filieres, setFilieres] = useState([])
  const [periodes, setPeriodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ filiere_id: '', periode_id: '' })
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/filieres'), api.get('/periodes')])
      .then(([f, p]) => { setFilieres(f.data); setPeriodes(p.data) })
  }, [])

  const search = async () => {
    setLoading(true); setSearched(true)
    const params = new URLSearchParams()
    if (filters.filiere_id) params.append('filiere_id', filters.filiere_id)
    if (filters.periode_id) params.append('periode_id', filters.periode_id)
    api.get(`/rapports/absences-filiere?${params}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }

  const exportCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Filière', 'Matière', 'Date séance', 'Horaire', 'Statut', 'Motif justif', 'Statut justif']
    const rows = data.map(r => [
      r.matricule, r.nom, r.prenom, r.libelle_filiere, r.nom_matiere,
      new Date(r.date_enseignement).toLocaleDateString('fr-FR'), r.horaire || '',
      r.statut, r.justif_motif || '', r.justif_statut || ''
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'rapport_absences.csv'; a.click()
  }

  const statutBadge = s => {
    if (s === 'present') return <span className="badge badge-success">Présent</span>
    if (s === 'absent') return <span className="badge badge-danger">Absent</span>
    return <span className="badge badge-warning">Retard</span>
  }

  const justifBadge = s => {
    if (!s) return <span className="badge badge-gray">Non justifiée</span>
    if (s === 'validee') return <span className="badge badge-success">Justifiée ✓</span>
    if (s === 'rejetee') return <span className="badge badge-danger">Rejetée</span>
    return <span className="badge badge-warning">En attente</span>
  }

  // Group by student
  const grouped = data.reduce((acc, row) => {
    const key = row.matricule
    if (!acc[key]) acc[key] = { info: row, absences: [] }
    acc[key].absences.push(row)
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Absences par filière</div><div className="page-subtitle">Rapport des absences filtrées par filière et période</div></div>
        {data.length > 0 && (
          <button className="btn btn-outline" onClick={exportCSV}>📥 Exporter CSV</button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="filters" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label>Filière</label>
              <select value={filters.filiere_id} onChange={e => setFilters(f => ({ ...f, filiere_id: e.target.value }))}>
                <option value="">Toutes les filières</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.libelle_filiere}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Période</label>
              <select value={filters.periode_id} onChange={e => setFilters(f => ({ ...f, periode_id: e.target.value }))}>
                <option value="">Toutes les périodes</option>
                {periodes.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" onClick={search}>🔍 Générer le rapport</button>
            </div>
          </div>
        </div>
      </div>

      {loading && <Spinner />}

      {!loading && searched && data.length === 0 && (
        <EmptyState message="Aucune absence trouvée pour ces critères" />
      )}

      {!loading && data.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>📊</div>
              <div><div className="stat-value" style={{ color: 'var(--danger)' }}>{data.length}</div><div className="stat-label">Total absences</div></div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>👥</div>
              <div><div className="stat-value">{Object.keys(grouped).length}</div><div className="stat-label">Étudiants concernés</div></div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-icon" style={{ background: 'var(--success-light)' }}>✅</div>
              <div><div className="stat-value" style={{ color: 'var(--success)' }}>{data.filter(d => d.justif_statut === 'validee').length}</div><div className="stat-label">Justifiées</div></div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>⏳</div>
              <div><div className="stat-value" style={{ color: 'var(--warning)' }}>{data.filter(d => !d.justif_statut).length}</div><div className="stat-label">Non justifiées</div></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Détail des absences</span>
              <span className="badge badge-danger">{data.length} absence(s)</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Étudiant</th><th>Filière</th><th>Matière</th><th>Date</th><th>Horaire</th><th>Justification</th></tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{row.nom} {row.prenom}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{row.matricule}</div>
                      </td>
                      <td><span className="badge badge-primary">{row.libelle_filiere}</span></td>
                      <td>{row.nom_matiere}</td>
                      <td>{new Date(row.date_enseignement).toLocaleDateString('fr-FR')}</td>
                      <td>{row.horaire || '-'}</td>
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
        </>
      )}
    </div>
  )
}
