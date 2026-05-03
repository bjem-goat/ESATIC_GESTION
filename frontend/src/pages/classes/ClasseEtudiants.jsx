import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { Modal, Spinner, EmptyState } from '../../components/ui'

const empty = { matricule: '', nom: '', prenom: '', sexe: 'M', email: '', telephone: '', email_parent: '', filiere_id: '' }

export default function ClasseEtudiants() {
  const { filiereId } = useParams()
  const [filiere, setFiliere] = useState(null)
  const [etudiants, setEtudiants] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  const load = () => {
    Promise.all([
      api.get('/filieres'),
      api.get(`/etudiants/filiere/${filiereId}/absences`)
    ]).then(([fr, er]) => {
      setFiliere(fr.data.find(x => x.id == filiereId))
      setEtudiants(er.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filiereId])

  const openAdd = () => { setForm({ ...empty, filiere_id: filiereId }); setEditing(null); setError(''); setModal(true) }
  const openEdit = row => {
    setForm({ matricule: row.matricule, nom: row.nom, prenom: row.prenom, sexe: row.sexe || 'M', email: row.email || '', telephone: row.telephone || '', email_parent: row.email_parent || '', filiere_id: row.filiere_id })
    setEditing(row.id); setError(''); setModal(true)
  }
  const save = async e => {
    e.preventDefault(); setError('')
    try {
      if (editing) await api.put(`/etudiants/${editing}`, form)
      else await api.post('/etudiants', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }
  const del = async id => {
    if (!confirm('Supprimer cet étudiant ?')) return
    await api.delete(`/etudiants/${id}`).then(load)
  }

  const f = (k, v) => setForm(x => ({ ...x, [k]: v }))
  const filtered = etudiants.filter(e => `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/classes">Classes</Link><span>›</span>
        <Link to={`/classes/${filiereId}`}>{filiere?.libelle_filiere || '...'}</Link><span>›</span>
        <span className="current">Étudiants</span>
      </div>
      <div className="page-header">
        <div>
          <div className="page-title">👥 Étudiants — {filiere?.code_filiere}</div>
          <div className="page-subtitle">{isAdmin ? 'Gérez les étudiants de cette classe' : 'Liste des étudiants'}</div>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Inscrire un étudiant</button>}
      </div>

      <div className="filters">
        <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 250 }} />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Étudiants</span>
          <span className="badge badge-primary">{filtered.length}</span>
        </div>
        <div className="table-wrap">
          {loading ? <Spinner /> : filtered.length === 0 ? <EmptyState message="Aucun étudiant" /> : (
            <table>
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom & Prénom</th>
                  <th>Sexe</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Email Parent</th>
                  <th style={{ textAlign: 'center' }}>Heures d'absence</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const h = parseInt(row.heures_absence) || 0
                  return (
                    <tr key={row.id}>
                      <td><span className="badge badge-gray">{row.matricule}</span></td>
                      <td style={{ fontWeight: 500 }}>{row.nom} {row.prenom}</td>
                      <td>{row.sexe === 'F' ? '♀' : '♂'}</td>
                      <td style={{ fontSize: 12 }}>{row.email || '—'}</td>
                      <td style={{ fontSize: 12 }}>{row.telephone || '—'}</td>
                      <td style={{ fontSize: 12 }}>
                        {row.email_parent ? <span style={{ color: '#059669' }}>📧 {row.email_parent}</span> : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {h > 0
                          ? <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '4px 12px', fontWeight: 800, fontSize: 14 }}>{h}h</span>
                          : <span style={{ background: '#d1fae5', color: '#059669', borderRadius: 8, padding: '4px 12px', fontWeight: 700, fontSize: 13 }}>0h ✓</span>}
                      </td>
                      {isAdmin && (
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => del(row.id)}>🗑️</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && isAdmin && (
        <Modal title={editing ? "Modifier l'étudiant" : "Inscrire un étudiant"} onClose={() => setModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary" form="etud-form" type="submit">Enregistrer</button></>}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form id="etud-form" onSubmit={save}>
            <div className="form-grid">
              <div className="form-group"><label>Matricule *</label><input value={form.matricule} onChange={e => f('matricule', e.target.value)} required /></div>
              <div className="form-group"><label>Sexe</label><select value={form.sexe} onChange={e => f('sexe', e.target.value)}><option value="M">M</option><option value="F">F</option></select></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Nom *</label><input value={form.nom} onChange={e => f('nom', e.target.value)} required /></div>
              <div className="form-group"><label>Prénom *</label><input value={form.prenom} onChange={e => f('prenom', e.target.value)} required /></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => f('email', e.target.value)} /></div>
              <div className="form-group"><label>Téléphone</label><input value={form.telephone} onChange={e => f('telephone', e.target.value)} /></div>
            </div>
            <div className="form-group">
              <label>📧 Email parent/tuteur</label>
              <input type="email" value={form.email_parent} onChange={e => f('email_parent', e.target.value)} placeholder="parent@email.com" />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
