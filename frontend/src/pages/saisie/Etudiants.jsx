import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Modal, EmptyState, Spinner } from '../../components/ui'

const empty = { matricule: '', nom: '', prenom: '', sexe: 'M', email: '', telephone: '', email_parent: '', filiere_id: '' }

export default function Etudiants() {
  const [data, setData] = useState([])
  const [filieres, setFilieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = () => Promise.all([api.get('/etudiants'), api.get('/filieres')])
    .then(([e, f]) => { setData(e.data); setFilieres(f.data) })
    .finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal(true) }
  const openEdit = row => {
    setForm({
      matricule: row.matricule, nom: row.nom, prenom: row.prenom,
      sexe: row.sexe || 'M', email: row.email || '', telephone: row.telephone || '',
      email_parent: row.email_parent || '', filiere_id: row.filiere_id || ''
    })
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
    await api.delete(`/etudiants/${id}`).then(load).catch(err => alert(err.response?.data?.error))
  }

  const f = (k, v) => setForm(x => ({ ...x, [k]: v }))
  const filtered = data.filter(e => `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Étudiants</div><div className="page-subtitle">Inscription et gestion des étudiants</div></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Inscrire un étudiant</button>
      </div>

      <div className="filters">
        <div className="form-group"><label>Recherche</label><input placeholder="Nom, prénom ou matricule..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 250 }} /></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Liste des étudiants</span>
          <span className="badge badge-primary">{filtered.length} étudiant(s)</span>
        </div>
        <div className="table-wrap">
          {loading ? <Spinner /> : filtered.length === 0 ? <EmptyState message="Aucun étudiant trouvé" /> : (
            <table>
              <thead><tr><th>Matricule</th><th>Nom & Prénom</th><th>Sexe</th><th>Filière</th><th>Email</th><th>Téléphone</th><th>Email Parent</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td><span className="badge badge-gray">{row.matricule}</span></td>
                    <td style={{ fontWeight: 500 }}>{row.nom} {row.prenom}</td>
                    <td>{row.sexe === 'F' ? '♀' : '♂'}</td>
                    <td><span className="badge badge-primary">{row.code_filiere || '-'}</span></td>
                    <td style={{ color: 'var(--primary)', fontSize: 12 }}>{row.email || '-'}</td>
                    <td>{row.telephone || '-'}</td>
                    <td style={{ fontSize: 12 }}>
                      {row.email_parent
                        ? <span style={{ color: '#059669' }}>✓ {row.email_parent}</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(row.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <Modal title={editing ? "Modifier l'étudiant" : "Inscrire un étudiant"} onClose={() => setModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary" form="etud-form" type="submit">Enregistrer</button></>}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form id="etud-form" onSubmit={save}>
            <div className="form-grid">
              <div className="form-group"><label>Matricule *</label><input value={form.matricule} onChange={e => f('matricule', e.target.value)} required placeholder="ETU001" /></div>
              <div className="form-group"><label>Sexe</label><select value={form.sexe} onChange={e => f('sexe', e.target.value)}><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Nom *</label><input value={form.nom} onChange={e => f('nom', e.target.value)} required /></div>
              <div className="form-group"><label>Prénom *</label><input value={form.prenom} onChange={e => f('prenom', e.target.value)} required /></div>
            </div>
            <div className="form-group"><label>Filière *</label>
              <select value={form.filiere_id} onChange={e => f('filiere_id', e.target.value)} required>
                <option value="">-- Sélectionner une filière --</option>
                {filieres.map(fi => <option key={fi.id} value={fi.id}>{fi.libelle_filiere}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Email étudiant</label><input type="email" value={form.email} onChange={e => f('email', e.target.value)} /></div>
              <div className="form-group"><label>Téléphone</label><input value={form.telephone} onChange={e => f('telephone', e.target.value)} /></div>
            </div>
            <div className="form-group">
              <label>📧 Email du parent / tuteur</label>
              <input
                type="email"
                value={form.email_parent}
                onChange={e => f('email_parent', e.target.value)}
                placeholder="parent@email.com"
              />
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Un email automatique sera envoyé au parent à chaque absence enregistrée.
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
