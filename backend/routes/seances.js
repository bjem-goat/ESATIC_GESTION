const router = require('express').Router()
const auth = require('../middleware/auth')

// Séances d'une affectation
router.get('/affectation/:id', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      `SELECT s.*,
        a.volume_horaire, a.heures_restantes,
        e.nom as ens_nom, e.prenom as ens_prenom,
        m.nom_matiere, m.code_matiere,
        f.libelle_filiere, f.code_filiere,
        p.libelle as periode_libelle,
        (SELECT COUNT(*) FROM presence pr WHERE pr.seance_id = s.id) as nb_etudiants,
        (SELECT COUNT(*) FROM presence pr WHERE pr.seance_id = s.id AND pr.statut='absent') as nb_absents
       FROM seance s
       JOIN affectation a ON s.affectation_id = a.id
       JOIN enseignant e ON a.enseignant_id = e.id
       JOIN matiere m ON a.matiere_id = m.id
       JOIN filiere f ON a.filiere_id = f.id
       JOIN periode p ON a.periode_id = p.id
       WHERE s.affectation_id=$1
       ORDER BY s.date_seance DESC`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Séances d'une filière (toutes affectations)
router.get('/filiere/:id', auth, async (req, res) => {
  const enseignant_id = req.query.enseignant_id
  let q = `
    SELECT s.*,
      e.nom as ens_nom, e.prenom as ens_prenom,
      m.nom_matiere, m.code_matiere,
      f.libelle_filiere,
      a.id as affectation_id,
      a.heures_restantes,
      (SELECT COUNT(*) FROM presence pr WHERE pr.seance_id = s.id AND pr.statut='absent') as nb_absents
    FROM seance s
    JOIN affectation a ON s.affectation_id = a.id
    JOIN enseignant e ON a.enseignant_id = e.id
    JOIN matiere m ON a.matiere_id = m.id
    JOIN filiere f ON a.filiere_id = f.id
    WHERE a.filiere_id=$1`
  const params = [req.params.id]
  if (enseignant_id) { params.push(enseignant_id); q += ` AND a.enseignant_id=$${params.length}` }
  q += ' ORDER BY s.date_seance DESC'
  try {
    const result = await req.app.locals.pool.query(q, params)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Créer une séance → décrémente heures_restantes de l'affectation
router.post('/', auth, async (req, res) => {
  const { affectation_id, date_seance, heure_debut, heure_fin, duree_heures } = req.body
  const duree = parseInt(duree_heures) || 2
  const pool = req.app.locals.pool
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Créer la séance
    const result = await client.query(
      `INSERT INTO seance (affectation_id, date_seance, heure_debut, heure_fin, duree_heures)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [affectation_id, date_seance, heure_debut, heure_fin, duree]
    )
    // Décrémenter heures_restantes (min 0)
    await client.query(
      `UPDATE affectation SET heures_restantes = GREATEST(0, heures_restantes - $1) WHERE id=$2`,
      [duree, affectation_id]
    )
    await client.query('COMMIT')
    res.status(201).json(result.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally { client.release() }
})

// Supprimer une séance → réincrémenter heures_restantes
router.delete('/:id', auth, async (req, res) => {
  const pool = req.app.locals.pool
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const s = await client.query('SELECT * FROM seance WHERE id=$1', [req.params.id])
    if (!s.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Séance introuvable' }) }
    const { affectation_id, duree_heures } = s.rows[0]
    await client.query('DELETE FROM seance WHERE id=$1', [req.params.id])
    await client.query(
      `UPDATE affectation SET heures_restantes = heures_restantes + $1 WHERE id=$2`,
      [duree_heures || 2, affectation_id]
    )
    await client.query('COMMIT')
    res.json({ message: 'Séance supprimée' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally { client.release() }
})

module.exports = router

// Démarrer une séance (prof confirme qu'il fait le cours) → décrémente heures_restantes
router.post('/:id/demarrer', auth, async (req, res) => {
  const pool = req.app.locals.pool
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const s = await client.query('SELECT * FROM seance WHERE id=$1', [req.params.id])
    if (!s.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Séance introuvable' }) }
    const { affectation_id, duree_heures, demarre } = s.rows[0]
    if (demarre) { await client.query('ROLLBACK'); return res.json({ message: 'Déjà démarrée' }) }
    // Marquer comme démarrée
    await client.query('UPDATE seance SET demarre=true WHERE id=$1', [req.params.id])
    // Décrémenter heures_restantes
    await client.query(
      `UPDATE affectation SET heures_restantes = GREATEST(0, heures_restantes - $1) WHERE id=$2`,
      [duree_heures || 2, affectation_id]
    )
    await client.query('COMMIT')
    res.json({ message: 'Séance démarrée' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally { client.release() }
})
