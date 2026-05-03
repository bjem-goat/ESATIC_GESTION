import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Modal, EmptyState, Spinner } from '../../components/ui'

const empty = { code_filiere: '', libelle_filiere: '', nbre_etud: 0 }

export default function Filieres() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = () => api.get('/filieres').then(r => setData(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal(true) }
  const openEdit = row => { setForm({ code_filiere: row.code_filiere, libelle_filiere: row.libelle_filiere, nbre_etud: row.nbre_etud }); setEditing(row.id); setError(''); setModal(true) }

  const save = async e => {
    e.preventDefault(); setError('')
    try {
      if (editing) await api.put(`/filieres/${editing}`, form)
      else await api.post('/filieres', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }

  const del = async id => {
    if (!confirm('Supprimer cette filière ?')) return
    try { await api.delete(`/filieres/${id}`); load() }
    catch (err) { alert(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Filières</div>
          <div className="page-subtitle">Gestion des filières de formation</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nouvelle filière</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <Spinner /> : data.length === 0 ? <EmptyState message="Aucune filière enregistrée" /> : (
            <table>
              <thead><tr><th>Code</th><th>Libellé</th><th>Nb étudiants</th><th>Actions</th></tr></thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id}>
                    <td><span className="badge badge-primary">{row.code_filiere}</span></td>
                    <td style={{ fontWeight: 500 }}>{row.libelle_filiere}</td>
                    <td>{row.nbre_etud}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>✏️ Modifier</button>
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
        <Modal title={editing ? 'Modifier la filière' : 'Nouvelle filière'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary" form="filiere-form" type="submit">Enregistrer</button></>}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form id="filiere-form" onSubmit={save}>
            <div className="form-group">
              <label>Code filière *</label>
              <input value={form.code_filiere} onChange={e => setForm(f => ({ ...f, code_filiere: e.target.value }))} required placeholder="ex: MBDS" />
            </div>
            <div className="form-group">
              <label>Libellé *</label>
              <input value={form.libelle_filiere} onChange={e => setForm(f => ({ ...f, libelle_filiere: e.target.value }))} required placeholder="ex: Master Big Data Sciences" />
            </div>
            <div className="form-group">
              <label>Nombre d'étudiants</label>
              <input type="number" value={form.nbre_etud} onChange={e => setForm(f => ({ ...f, nbre_etud: e.target.value }))} min="0" />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
