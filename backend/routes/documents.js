const router = require('express').Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const uploadDir = '/app/uploads'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }) // 20MB max

// Lister les documents d'un enseignant (ou tous pour admin)
router.get('/', auth, async (req, res) => {
  const { enseignant_id, affectation_id } = req.query
  let q = `
    SELECT d.*, e.nom as ens_nom, e.prenom as ens_prenom,
      m.nom_matiere, f.libelle_filiere, f.code_filiere
    FROM document d
    JOIN enseignant e ON d.enseignant_id = e.id
    LEFT JOIN affectation a ON d.affectation_id = a.id
    LEFT JOIN matiere m ON a.matiere_id = m.id
    LEFT JOIN filiere f ON a.filiere_id = f.id
    WHERE 1=1`
  const params = []
  if (enseignant_id) { params.push(enseignant_id); q += ` AND d.enseignant_id=$${params.length}` }
  if (affectation_id) { params.push(affectation_id); q += ` AND d.affectation_id=$${params.length}` }
  q += ' ORDER BY d.created_at DESC'
  try {
    const result = await req.app.locals.pool.query(q, params)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Upload un document
router.post('/', auth, upload.single('fichier'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
  const { affectation_id, description } = req.body
  const enseignant_id = req.user?.id
  try {
    const result = await req.app.locals.pool.query(
      `INSERT INTO document (enseignant_id, affectation_id, nom_fichier, nom_original, taille, type_mime, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [enseignant_id, affectation_id || null, req.file.filename, req.file.originalname,
       req.file.size, req.file.mimetype, description || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    fs.unlink(req.file.path, () => {})
    res.status(500).json({ error: err.message })
  }
})

// Télécharger un document
router.get('/:id/download', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query('SELECT * FROM document WHERE id=$1', [req.params.id])
    const doc = result.rows[0]
    if (!doc) return res.status(404).json({ error: 'Document introuvable' })
    const filePath = path.join(uploadDir, doc.nom_fichier)
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fichier introuvable sur le serveur' })
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.nom_original)}"`)
    res.setHeader('Content-Type', doc.type_mime || 'application/octet-stream')
    res.sendFile(filePath)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Supprimer un document
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query('SELECT * FROM document WHERE id=$1', [req.params.id])
    const doc = result.rows[0]
    if (!doc) return res.status(404).json({ error: 'Document introuvable' })
    const filePath = path.join(uploadDir, doc.nom_fichier)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    await req.app.locals.pool.query('DELETE FROM document WHERE id=$1', [req.params.id])
    res.json({ message: 'Supprimé' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
