import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Spinner, EmptyState } from '../../components/ui'

export default function RapportEtudiant() {
  const [etudiants, setEtudiants] = useState([])
  const [selected, setSelected] = useState('')
  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/etudiants').then(r => setEtudiants(r.data))
  }, [])

  const loadAbsences = (id) => {
    setSelected(id)
    if (!id) { setAbsences([]); return }
    setLoading(true)
    api.get(`/rapports/absences-etudiant/${id}`)
      .then(r => setAbsences(r.data))
      .finally(() => setLoading(false))
  }

  const etud = etudiants.find(e => e.id == selected)

  const filtered = etudiants.filter(e =>
    `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    if (!etud) return
    const headers = ['Matière', 'Date séance', 'Horaire', 'Statut', 'Motif justification', 'Statut justification']
    const rows = absences.map(r => [
      r.nom_matiere,
      new Date(r.date_enseignement).toLocaleDateString('fr-FR'),
      r.horaire || '',
      r.statut,
      r.motif || '',
      r.justif_statut || 'Non justifiée'
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `absences_${etud.matricule}.csv`; a.click()
  }

  const justifBadge = s => {
    if (!s) return <span className="badge badge-gray">Non justifiée</span>
    if (s === 'validee') return <span className="badge badge-success">Justifiée ✓</span>
    if (s === 'rejetee') return <span className="badge badge-danger">Rejetée</span>
    return <span className="badge badge-warning">En attente</span>
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Rapport par étudiant</div><div className="page-subtitle">Historique des absences d'un étudiant</div></div>
        {absences.length > 0 && <button className="btn btn-outline" onClick={exportCSV}>📥 Exporter CSV</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Left: student list */}
        <div className="card">
          <div className="card-header"><span className="card-title">Sélectionner un étudiant</span></div>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)' }}>
            <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {filtered.length === 0 && <EmptyState message="Aucun résultat" />}
            {filtered.map(e => (
              <div key={e.id}
                onClick={() => loadAbsences(e.id)}
                style={{
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--gray-100)',
                  background: selected == e.id ? 'var(--primary-light)' : 'white',
                  borderLeft: selected == e.id ? '3px solid var(--primary)' : '3px solid transparent'
                }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{e.nom} {e.prenom}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', display: 'flex', gap: 8, marginTop: 2 }}>
                  <span>{e.matricule}</span>
                  <span className="badge badge-gray" style={{ fontSize: 10 }}>{e.code_filiere}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: absences */}
        <div>
          {!selected && (
            <div className="card"><div className="card-body"><EmptyState message="Sélectionnez un étudiant à gauche" /></div></div>
          )}

          {selected && etud && (
            <>
              {/* Student info card */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700 }}>
                        {etud.prenom[0]}{etud.nom[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{etud.nom} {etud.prenom}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                          Matricule: <strong>{etud.matricule}</strong> &nbsp;|&nbsp;
                          Filière: <strong>{etud.libelle_filiere || etud.code_filiere}</strong> &nbsp;|&nbsp;
                          {etud.sexe === 'F' ? '♀ Femme' : '♂ Homme'}
                        </div>
                        {etud.email && <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>{etud.email}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--danger)' }}>{absences.length}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Total absences</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>{absences.filter(a => a.justif_statut === 'validee').length}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Justifiées</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--warning)' }}>{absences.filter(a => !a.justif_statut).length}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Non justifiées</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Historique des absences</span>
                  <span className="badge badge-danger">{absences.length} absence(s)</span>
                </div>
                {loading ? <Spinner /> : absences.length === 0 ? (
                  <div className="card-body"><EmptyState message="Cet étudiant n'a aucune absence enregistrée 🎉" /></div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Matière</th><th>Date</th><th>Horaire</th><th>Justification</th></tr>
                      </thead>
                      <tbody>
                        {absences.map((row, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{row.nom_matiere}</td>
                            <td>{new Date(row.date_enseignement).toLocaleDateString('fr-FR')}</td>
                            <td>{row.horaire || '-'}</td>
                            <td>
                              {justifBadge(row.justif_statut)}
                              {row.motif && <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{row.motif}</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
