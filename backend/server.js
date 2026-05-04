const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { Pool } = require('pg')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*' }))
app.use(express.json())

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
})

async function initDB() {
  try {
    const check = await pool.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'filiere')`)
    if (check.rows[0].exists) { console.log('✅ Tables déjà existantes'); return }
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8')
    await pool.query(sql)
    console.log('✅ Base de données initialisée')
  } catch (err) { console.error('Erreur init DB:', err.message) }
}

pool.connect(async (err) => {
  if (err) console.error('DB error:', err)
  else { console.log('✅ Connected to PostgreSQL'); await initDB() }
})
app.locals.pool = pool

app.use('/api/auth',           require('./routes/auth'))
app.use('/api/filieres',       require('./routes/filieres'))
app.use('/api/periodes',       require('./routes/periodes'))
app.use('/api/matieres',       require('./routes/matieres'))
app.use('/api/enseignants',    require('./routes/enseignants'))
app.use('/api/etudiants',      require('./routes/etudiants'))
app.use('/api/affectations',   require('./routes/affectations'))
app.use('/api/seances',        require('./routes/seances'))
app.use('/api/presences',      require('./routes/presences'))
app.use('/api/justifications', require('./routes/justifications'))
app.use('/api/rapports',       require('./routes/rapports'))
app.use('/api/documents',      require('./routes/documents'))

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.listen(PORT, () => console.log(`🚀 Backend on port ${PORT}`))