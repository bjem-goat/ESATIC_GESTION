import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { Modal, Spinner, EmptyState } from '../../components/ui'

const emptyForm = { enseignant_id: '', matiere_id: '', periode_id: '', volume_horaire: '' }
const emptySeance = { date_seance: '', heure_debut: '', heure_fin: '', duree_heures: 2 }

export default function ClasseAffectations() {
  const { filiereId } = useParams()
  const [filiere, setFiliere] = useState(null)
  const [affectations, setAffectations] = useState([])
  const [enseignants, setEnseignants] = useState([])
  const [matieres, setMatieres] = useState([])
  const [periodes, setPeriodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [seances, setSeances] = useState([emptySeance]) // liste des séances à planifier
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    Promise.all([
      api.get('/filieres'),
      api.get(`/affectations?filiere_id=${filiereId}`),
      api.get('/enseignants'),
      api.get('/matieres'),
      api.get('/periodes')
    ]).then(([fr, ar, er, mr, pr]) => {
      setFiliere(fr.data.find(x => x.id == filiereId))
      setAffectations(ar.data)
      setEnseignants(er.data)
      setMatieres(mr.data)
      setPeriodes(pr.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filiereId])

  const openAdd = () => { setForm(emptyForm); setSeances([emptySeance]); setEditing(null); setError(''); setModal(true) }
  const openEdit = async row => {
    setForm({ enseignant_id: row.enseignant_id, matiere_id: row.matiere_id, periode_id: row.periode_id, volume_horaire: row.volume_horaire })
    // Charger les séances existantes de cette affectation
    const r = await api.get(`/seances/affectation/${row.id}`)
    const existing = r.data.map(s => ({
      id: s.id,
      date_seance: s.date_seance?.split('T')[0] || '',
      heure_debut: s.heure_debut || '',
      heure_fin: s.heure_fin || '',
      duree_heures: s.duree_heures || 2,
      demarre: s.demarre || false
    }))
    setSeances(existing.length > 0 ? existing : [emptySeance])
    setEditing(row.id); setError(''); setModal(true)
  }

  const addSeanceRow = () => setSeances(s => [...s, { ...emptySeance }])
  const removeSeanceRow = async i => {
    const s = seances[i]
    if (s.id) {
      if (s.demarre) { alert('Impossible de supprimer une séance déjà effectuée.'); return }
      if (!confirm('Supprimer cette séance ?')) return
      await api.delete(`/seances/${s.id}`)
    }
    setSeances(prev => prev.filter((_, idx) => idx !== i))
  }
  const updateSeance = (i, k, v) => setSeances(s => s.map((row, idx) => idx === i ? { ...row, [k]: v } : row))

  const save = async e => {
    e.preventDefault(); setError('')
    try {
      const seancesValides = seances.filter(s => s.date_seance && s.heure_debut && s.heure_fin)
      const payload = { ...form, filiere_id: parseInt(filiereId), seances: seancesValides }
      if (editing) {
        await api.put(`/affectations/${editing}`, payload)
        // Synchroniser les séances : supprimer celles retirées, ajouter les nouvelles
        const existantes = seances.filter(s => s.id)
        const nouvelles = seances.filter(s => !s.id && s.date_seance && s.heure_debut && s.heure_fin)
        for (const s of nouvelles) {
          await api.post('/seances', { affectation_id: editing, ...s })
        }
      } else {
        await api.post('/affectations', payload)
      }
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur — cette affectation existe peut-être déjà') }
  }

  const del = async id => {
    if (!confirm('Supprimer cette affectation ? Les séances et présences associées seront supprimées.')) return
    await api.delete(`/affectations/${id}`).then(load).catch(err => alert(err.response?.data?.error))
  }

  const f = (k, v) => setForm(x => ({ ...x, [k]: v }))

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/classes">Classes</Link><span>›</span>
        <Link to={`/classes/${filiereId}`}>{filiere?.libelle_filiere || '...'}</Link><span>›</span>
        <span className="current">Affectations</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">📌 Affectations — {filiere?.code_filiere}</div>
          <div className="page-subtitle">Affecter les enseignants et planifier leurs séances dès le début d'année</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nouvelle affectation</button>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 18 }}>
        💡 Lors de l'affectation, saisissez <strong>toutes les séances prévues</strong> pour ce cours. Le prof n'aura qu'à <strong>démarrer</strong> la séance du jour quand il arrive.
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Affectations ({affectations.length})</span>
        </div>
        <div className="table-wrap">
          {loading ? <Spinner /> : affectations.length === 0 ? (
            <EmptyState message="Aucune affectation. Commencez par affecter des enseignants à cette classe." />
          ) : (
            <table>
              <thead>
                <tr><th>Enseignant</th><th>Matière</th><th>Période</th><th>Volume horaire</th><th>Heures restantes</th><th>Séances planifiées</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {affectations.map(row => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.ens_nom} {row.ens_prenom}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{row.id_enseignant}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{row.code_matiere}</span>
                      <div style={{ fontSize: 12, marginTop: 2 }}>{row.nom_matiere}</div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{row.id_periode}</span>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{row.periode_libelle}</div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary-darker)', fontSize: 16 }}>{row.volume_horaire}h</span></td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 15, color: row.heures_restantes === 0 ? '#dc2626' : '#059669' }}>
                        {row.heures_restantes}h
                      </span>
                    </td>
                    <td><span className="badge badge-success">{row.nb_seances} séance(s)</span></td>
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
        <Modal
          title={editing ? "Modifier l'affectation" : "Nouvelle affectation"}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn btn-primary" form="affect-form" type="submit">Enregistrer</button>
            </>
          }
        >
          {error && <div className="alert alert-danger">{error}</div>}
          <form id="affect-form" onSubmit={save}>
            <div className="form-group">
              <label>Enseignant *</label>
              <select value={form.enseignant_id} onChange={e => f('enseignant_id', e.target.value)} required>
                <option value="">-- Choisir un enseignant --</option>
                {enseignants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom} ({e.id_enseignant})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Matière *</label>
              <select value={form.matiere_id} onChange={e => f('matiere_id', e.target.value)} required>
                <option value="">-- Choisir une matière --</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom_matiere} ({m.code_matiere})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Période *</label>
              <select value={form.periode_id} onChange={e => f('periode_id', e.target.value)} required>
                <option value="">-- Choisir une période --</option>
                {periodes.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Volume horaire total (heures) *</label>
              <input type="number" min="1" value={form.volume_horaire} onChange={e => f('volume_horaire', e.target.value)} placeholder="ex: 45" required />
            </div>

            {(
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--gray-700)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📅 Planifier les séances</span>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addSeanceRow}>+ Ajouter une séance</button>
                </div>
                <div className="alert alert-info" style={{ marginBottom: 12, fontSize: 12 }}>
                  Ajoutez toutes les dates de cours prévues. Le prof les verra directement et n'aura qu'à démarrer celle du jour.
                </div>
                {seances.map((s, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>{s.id ? (s.demarre ? '✓ Effectuée' : '📅 Planifiée') : `Nouvelle séance ${i + 1}`}</span>
                      {seances.length > 1 && <button type="button" onClick={() => removeSeanceRow(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>}
                    </div>
                    <div className="form-grid">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 11 }}>Date</label>
                        <input type="date" value={s.date_seance} onChange={e => updateSeance(i, 'date_seance', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 11 }}>Durée (h)</label>
                        <input type="number" min="1" max="8" value={s.duree_heures} onChange={e => updateSeance(i, 'duree_heures', parseInt(e.target.value))} />
                      </div>
                    </div>
                    <div className="form-grid" style={{ marginTop: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 11 }}>Heure début</label>
                        <input type="time" value={s.heure_debut} onChange={e => updateSeance(i, 'heure_debut', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 11 }}>Heure fin</label>
                        <input type="time" value={s.heure_fin} onChange={e => updateSeance(i, 'heure_fin', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  )
}
