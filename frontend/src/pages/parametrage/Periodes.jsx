import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Modal, EmptyState, Spinner } from '../../components/ui'

const empty = { id_periode: '', libelle: '', date_debut: '', date_fin: '' }

export default function Periodes() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = () => api.get('/periodes').then(r => setData(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal(true) }
  const openEdit = row => {
    setForm({ id_periode: row.id_periode, libelle: row.libelle, date_debut: row.date_debut?.split('T')[0], date_fin: row.date_fin?.split('T')[0] })
    setEditing(row.id); setError(''); setModal(true)
  }

  const save = async e => {
    e.preventDefault(); setError('')
    try {
      if (editing) await api.put(`/periodes/${editing}`, form)
      else await api.post('/periodes', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }

  const del = async id => {
    if (!confirm('Supprimer cette période ?')) return
    await api.delete(`/periodes/${id}`).then(load).catch(err => alert(err.response?.data?.error))
  }

  const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Périodes d'évaluation</div><div className="page-subtitle">Définir les périodes semestrielles</div></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nouvelle période</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          {loading ? <Spinner /> : data.length === 0 ? <EmptyState message="Aucune période" /> : (
            <table>
              <thead><tr><th>ID</th><th>Libellé</th><th>Début</th><th>Fin</th><th>Actions</th></tr></thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id}>
                    <td><span className="badge badge-gray">{row.id_periode}</span></td>
                    <td style={{ fontWeight: 500 }}>{row.libelle}</td>
                    <td>{fmt(row.date_debut)}</td>
                    <td>{fmt(row.date_fin)}</td>
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
        <Modal title={editing ? 'Modifier la période' : 'Nouvelle période'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary" form="periode-form" type="submit">Enregistrer</button></>}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form id="periode-form" onSubmit={save}>
            <div className="form-group"><label>Code *</label><input value={form.id_periode} onChange={e => setForm(f => ({ ...f, id_periode: e.target.value }))} required placeholder="ex: S1-2024" /></div>
            <div className="form-group"><label>Libellé *</label><input value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} required placeholder="ex: Semestre 1 - 2024" /></div>
            <div className="form-grid">
              <div className="form-group"><label>Date début *</label><input type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} required /></div>
              <div className="form-group"><label>Date fin *</label><input type="date" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} required /></div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
