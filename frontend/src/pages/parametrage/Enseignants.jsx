import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Modal, EmptyState, Spinner } from '../../components/ui'

const empty = { id_enseignant: '', nom: '', prenom: '', mail: '', specialite: '', diplome: '', sexe: 'M', password: '' }

export default function Enseignants() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = () => api.get('/enseignants').then(r => setData(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal(true) }
  const openEdit = row => {
    setForm({ id_enseignant: row.id_enseignant, nom: row.nom, prenom: row.prenom, mail: row.mail, specialite: row.specialite || '', diplome: row.diplome || '', sexe: row.sexe || 'M', password: '' })
    setEditing(row.id); setError(''); setModal(true)
  }

  const save = async e => {
    e.preventDefault(); setError('')
    try {
      if (editing) await api.put(`/enseignants/${editing}`, form)
      else await api.post('/enseignants', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }

  const del = async id => {
    if (!confirm('Supprimer cet enseignant ?')) return
    await api.delete(`/enseignants/${id}`).then(load).catch(err => alert(err.response?.data?.error))
  }

  const f = (k, v) => setForm(x => ({ ...x, [k]: v }))

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Enseignants</div><div className="page-subtitle">Gestion du corps enseignant</div></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nouvel enseignant</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          {loading ? <Spinner /> : data.length === 0 ? <EmptyState message="Aucun enseignant" /> : (
            <table>
              <thead><tr><th>ID</th><th>Nom & Prénom</th><th>Email</th><th>Spécialité</th><th>Diplôme</th><th>Actions</th></tr></thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id}>
                    <td><span className="badge badge-gray">{row.id_enseignant}</span></td>
                    <td><div style={{ fontWeight: 500 }}>{row.nom} {row.prenom}</div><div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{row.sexe === 'F' ? '♀ Femme' : '♂ Homme'}</div></td>
                    <td style={{ color: 'var(--primary)' }}>{row.mail}</td>
                    <td>{row.specialite || '-'}</td>
                    <td>{row.diplome || '-'}</td>
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
        <Modal title={editing ? 'Modifier l\'enseignant' : 'Nouvel enseignant'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary" form="ens-form" type="submit">Enregistrer</button></>}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form id="ens-form" onSubmit={save}>
            <div className="form-grid">
              <div className="form-group"><label>ID enseignant *</label><input value={form.id_enseignant} onChange={e => f('id_enseignant', e.target.value)} required placeholder="ENS001" /></div>
              <div className="form-group"><label>Sexe</label><select value={form.sexe} onChange={e => f('sexe', e.target.value)}><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Nom *</label><input value={form.nom} onChange={e => f('nom', e.target.value)} required /></div>
              <div className="form-group"><label>Prénom *</label><input value={form.prenom} onChange={e => f('prenom', e.target.value)} required /></div>
            </div>
            <div className="form-group"><label>Email *</label><input type="email" value={form.mail} onChange={e => f('mail', e.target.value)} required /></div>
            <div className="form-grid">
              <div className="form-group"><label>Spécialité</label><input value={form.specialite} onChange={e => f('specialite', e.target.value)} /></div>
              <div className="form-group"><label>Diplôme</label><input value={form.diplome} onChange={e => f('diplome', e.target.value)} /></div>
            </div>
            {!editing && <div className="form-group"><label>Mot de passe *</label><input type="password" value={form.password} onChange={e => f('password', e.target.value)} required={!editing} placeholder="Minimum 6 caractères" /></div>}
          </form>
        </Modal>
      )}
    </div>
  )
}
