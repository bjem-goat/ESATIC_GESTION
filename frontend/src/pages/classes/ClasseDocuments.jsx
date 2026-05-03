import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { Spinner, EmptyState } from '../../components/ui'

const ICONS = {
  'application/pdf': '📄',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
  'application/vnd.ms-powerpoint': '📊',
  'image/png': '🖼️', 'image/jpeg': '🖼️', 'image/gif': '🖼️',
  'text/plain': '📃', 'application/zip': '🗜️',
}
const fileIcon = mime => ICONS[mime] || '📎'
const fileSize = bytes => {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

export default function ClasseDocuments() {
  const { filiereId } = useParams()
  const [filiere, setFiliere] = useState(null)
  const [affectations, setAffectations] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ fichier: null, affectation_id: '', description: '' })
  const [error, setError] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  const load = () => {
    Promise.all([
      api.get('/filieres'),
      api.get(`/affectations?filiere_id=${filiereId}${!isAdmin ? `&enseignant_id=${user.id}` : ''}`),
      api.get(`/documents?${!isAdmin ? `enseignant_id=${user.id}` : ''}`)
    ]).then(([fr, ar, dr]) => {
      setFiliere(fr.data.find(x => x.id == filiereId))
      setAffectations(ar.data)
      // Filtrer les documents liés aux affectations de cette filière
      const affIds = ar.data.map(a => a.id)
      const filtered = dr.data.filter(d => !d.affectation_id || affIds.includes(d.affectation_id))
      setDocuments(filtered)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filiereId])

  const upload = async e => {
    e.preventDefault(); setError('')
    if (!form.fichier) { setError('Sélectionnez un fichier'); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('fichier', form.fichier)
    if (form.affectation_id) fd.append('affectation_id', form.affectation_id)
    if (form.description) fd.append('description', form.description)
    try {
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm({ fichier: null, affectation_id: '', description: '' })
      document.getElementById('file-input').value = ''
      load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur upload') }
    finally { setUploading(false) }
  }

  const download = id => { window.open(`/api/documents/${id}/download`, '_blank') }

  const del = async id => {
    if (!confirm('Supprimer ce document ?')) return
    await api.delete(`/documents/${id}`).then(load)
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/classes">Classes</Link><span>›</span>
        <Link to={`/classes/${filiereId}`}>{filiere?.libelle_filiere || '...'}</Link><span>›</span>
        <span className="current">Documents</span>
      </div>
      <div className="page-header">
        <div>
          <div className="page-title">📁 Documents — {filiere?.code_filiere}</div>
          <div className="page-subtitle">Déposez vos supports de cours, TD, examens...</div>
        </div>
      </div>

      {/* Zone upload */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">📤 Déposer un document</span></div>
        <div className="card-body">
          {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}
          <form onSubmit={upload}>
            <div className="form-group">
              <label>Fichier * (max 20 Mo)</label>
              <input id="file-input" type="file" onChange={e => setForm(f => ({ ...f, fichier: e.target.files[0] }))} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Cours associé (optionnel)</label>
                <select value={form.affectation_id} onChange={e => setForm(f => ({ ...f, affectation_id: e.target.value }))}>
                  <option value="">-- Général --</option>
                  {affectations.map(a => <option key={a.id} value={a.id}>{a.nom_matiere}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Description (optionnel)</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Cours chapitre 3, TD noté..." />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={uploading}>
              {uploading ? '⏳ Upload en cours...' : '📤 Déposer le fichier'}
            </button>
          </form>
        </div>
      </div>

      {/* Liste documents */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Documents ({documents.length})</span>
        </div>
        <div className="table-wrap">
          {loading ? <Spinner /> : documents.length === 0 ? (
            <EmptyState message="Aucun document déposé pour cette classe" />
          ) : (
            <table>
              <thead>
                <tr><th>Fichier</th><th>Cours</th><th>Description</th><th>Taille</th><th>Déposé le</th><th>Par</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{fileIcon(doc.type_mime)}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.nom_original}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{doc.type_mime?.split('/')[1]?.toUpperCase() || '?'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{doc.nom_matiere ? <span className="badge badge-primary">{doc.nom_matiere}</span> : <span style={{ color: '#94a3b8' }}>Général</span>}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{doc.description || '—'}</td>
                    <td style={{ fontSize: 12 }}>{fileSize(doc.taille)}</td>
                    <td style={{ fontSize: 12 }}>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</td>
                    <td style={{ fontSize: 12 }}>{doc.ens_nom} {doc.ens_prenom}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => download(doc.id)}>⬇️ Télécharger</button>
                      {(isAdmin || doc.enseignant_id === user.id) && (
                        <button className="btn btn-danger btn-sm" onClick={() => del(doc.id)}>🗑️</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
