import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Spinner, EmptyState } from '../../components/ui'

export default function RapportMatieres() {
  const [data, setData] = useState([])
  const [filieres, setFilieres] = useState([])
  const [loading, setLoading] = useState(false)
  const [filiereId, setFiliereId] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    api.get('/filieres').then(r => setFilieres(r.data))
  }, [])

  const search = () => {
    setLoading(true); setSearched(true)
    const params = filiereId ? `?filiere_id=${filiereId}` : ''
    api.get(`/rapports/matieres-filiere${params}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }

  // Load all on mount
  useEffect(() => { search() }, [])

  const exportCSV = () => {
    const headers = ['Code matière', 'Nom matière', 'Filière', 'Enseignant', 'Nb séances']
    const rows = data.map(r => [r.code_matiere, r.nom_matiere, r.libelle_filiere, `${r.ens_nom} ${r.ens_prenom}`, r.nb_seances])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'matieres_par_filiere.csv'; a.click()
  }

  // Group by filiere
  const grouped = data.reduce((acc, row) => {
    const key = row.libelle_filiere
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Matières par filière</div><div className="page-subtitle">Répartition des matières enseignées par filière</div></div>
        {data.length > 0 && <button className="btn btn-outline" onClick={exportCSV}>📥 Exporter CSV</button>}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="filters" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label>Filière</label>
              <select value={filiereId} onChange={e => setFiliereId(e.target.value)}>
                <option value="">Toutes les filières</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.libelle_filiere}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" onClick={search}>🔍 Afficher</button>
            </div>
          </div>
        </div>
      </div>

      {loading && <Spinner />}

      {!loading && searched && data.length === 0 && <EmptyState message="Aucune donnée trouvée" />}

      {!loading && data.length > 0 && Object.entries(grouped).map(([filiere, matieres]) => (
        <div className="card" key={filiere} style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-primary" style={{ fontSize: 13, padding: '4px 12px' }}>{filiere}</span>
              <span className="card-title">{matieres.length} matière(s)</span>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Code</th><th>Nom de la matière</th><th>Enseignant responsable</th><th>Nb de séances</th></tr>
              </thead>
              <tbody>
                {matieres.map((row, i) => (
                  <tr key={i}>
                    <td><span className="badge badge-gray">{row.code_matiere}</span></td>
                    <td style={{ fontWeight: 500 }}>{row.nom_matiere}</td>
                    <td>{row.ens_nom} {row.ens_prenom}</td>
                    <td>
                      <span className="badge badge-primary">{row.nb_seances} séance(s)</span>
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
