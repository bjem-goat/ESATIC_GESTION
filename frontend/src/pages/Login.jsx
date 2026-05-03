import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <h1>MBDS</h1>
          <p>Système de Gestion des Absences</p>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Adresse email</label>
            <input type="email" placeholder="email@mbds.ci" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter →'}
          </button>
        </form>
        <div style={{ marginTop: 20, padding: '14px', background: 'var(--primary-lighter)', borderRadius: 8, fontSize: 12, color: 'var(--gray-600)', border: '1px solid var(--primary-light)' }}>
          <strong style={{ color: 'var(--primary-darker)' }}>Comptes de test :</strong><br />
          Admin : admin@mbds.ci / password<br />
          Enseignant : j.kouassi@mbds.ci / password
        </div>
      </div>
    </div>
  )
}
