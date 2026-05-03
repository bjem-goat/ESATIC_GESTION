import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Modal, Spinner, EmptyState } from '../../components/ui'

const empty = { code_filiere: '', libelle_filiere: '', nbre_etud: 0 }

export default function Classes() {
  const [filieres, setFilieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  const load = () => api.get('/filieres').then(r => setFilieres(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal(true) }
  const openEdit = (e, row) => {
    e.stopPropagation()
    setForm({ code_filiere: row.code_filiere, libelle_filiere: row.libelle_filiere, nbre_etud: row.nbre_etud })
    setEditing(row.id); setError(''); setModal(true)
  }
  const del = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Supprimer cette classe ? Toutes les données associées seront perdues.')) return
    await api.delete(`/filieres/${id}`).then(load).catch(err => alert(err.response?.data?.error))
  }

  const save = async ev => {
    ev.preventDefault(); setError('')
    try {
      if (editing) await api.put(`/filieres/${editing}`, form)
      else await api.post('/filieres', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }

  const colors = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#7dd3fc', '#bae6fd']

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📚 Classes</div>
          <div className="page-subtitle">
            {isAdmin ? 'Sélectionnez une classe pour la gérer' : 'Sélectionnez une classe pour saisir les présences'}
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>+ Nouvelle classe</button>
        )}
      </div>

      {loading && <Spinner />}

      {!loading && filieres.length === 0 && (
        <EmptyState message="Aucune classe enregistrée" />
      )}

      {!loading && filieres.length > 0 && (
        <div className="filiere-grid">
          {filieres.map((f, i) => (
            <div key={f.id} className="filiere-card" onClick={() => navigate(`/classes/${f.id}`)}>
              <div className="filiere-card-code">{f.code_filiere}</div>
              <div className="filiere-card-name">{f.libelle_filiere}</div>
              <div className="filiere-card-meta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {f.nbre_etud} étudiant(s) prévu(s)
              </div>
              {isAdmin && (
                <div className="filiere-card-actions">
                  <button className="btn btn-sky btn-sm" onClick={e => openEdit(e, f)}>✏️ Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={e => del(e, f.id)}>🗑️ Supprimer</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Modifier la classe' : 'Nouvelle classe'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary" form="filiere-form" type="submit">Enregistrer</button></>}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form id="filiere-form" onSubmit={save}>
            <div className="form-group">
              <label>Code de la classe *</label>
              <input value={form.code_filiere} onChange={e => setForm(f => ({ ...f, code_filiere: e.target.value }))} required placeholder="ex: MBDS" />
            </div>
            <div className="form-group">
              <label>Nom complet *</label>
              <input value={form.libelle_filiere} onChange={e => setForm(f => ({ ...f, libelle_filiere: e.target.value }))} required placeholder="ex: Master Big Data Sciences" />
            </div>
            <div className="form-group">
              <label>Nombre d'étudiants prévus</label>
              <input type="number" value={form.nbre_etud} onChange={e => setForm(f => ({ ...f, nbre_etud: e.target.value }))} min="0" />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
