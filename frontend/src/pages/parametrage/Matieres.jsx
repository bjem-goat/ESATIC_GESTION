import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Modal, EmptyState, Spinner } from '../../components/ui'

export default function Matieres() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ code_matiere: '', nom_matiere: '' })
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = () => api.get('/matieres').then(r => setData(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm({ code_matiere: '', nom_matiere: '' }); setEditing(null); setError(''); setModal(true) }
  const openEdit = row => { setForm({ code_matiere: row.code_matiere, nom_matiere: row.nom_matiere }); setEditing(row.id); setError(''); setModal(true) }

  const save = async e => {
    e.preventDefault(); setError('')
    try {
      if (editing) await api.put(`/matieres/${editing}`, form)
      else await api.post('/matieres', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }

  const del = async id => {
    if (!confirm('Supprimer ?')) return
    await api.delete(`/matieres/${id}`).then(load).catch(err => alert(err.response?.data?.error))
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Matières</div><div className="page-subtitle">Gestion des matières enseignées</div></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nouvelle matière</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          {loading ? <Spinner /> : data.length === 0 ? <EmptyState message="Aucune matière" /> : (
            <table>
              <thead><tr><th>Code</th><th>Nom de la matière</th><th>Actions</th></tr></thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id}>
                    <td><span className="badge badge-primary">{row.code_matiere}</span></td>
                    <td style={{ fontWeight: 500 }}>{row.nom_matiere}</td>
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
        <Modal title={editing ? 'Modifier la matière' : 'Nouvelle matière'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary" form="mat-form" type="submit">Enregistrer</button></>}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form id="mat-form" onSubmit={save}>
            <div className="form-group"><label>Code *</label><input value={form.code_matiere} onChange={e => setForm(f => ({ ...f, code_matiere: e.target.value }))} required placeholder="ex: BD001" /></div>
            <div className="form-group"><label>Nom de la matière *</label><input value={form.nom_matiere} onChange={e => setForm(f => ({ ...f, nom_matiere: e.target.value }))} required placeholder="ex: Base de Données Avancées" /></div>
          </form>
        </Modal>
      )}
    </div>
  )
}
