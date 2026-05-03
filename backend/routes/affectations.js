const router = require('express').Router()
const auth = require('../middleware/auth')

// Toutes les affectations
router.get('/', auth, async (req, res) => {
  const { filiere_id, enseignant_id, periode_id } = req.query
  let q = `
    SELECT a.*,
      e.nom as ens_nom, e.prenom as ens_prenom, e.id_enseignant,
      m.nom_matiere, m.code_matiere,
      f.libelle_filiere, f.code_filiere,
      p.libelle as periode_libelle, p.id_periode,
      (SELECT COUNT(*) FROM seance s WHERE s.affectation_id = a.id) as nb_seances
    FROM affectation a
    JOIN enseignant e ON a.enseignant_id = e.id
    JOIN matiere m ON a.matiere_id = m.id
    JOIN filiere f ON a.filiere_id = f.id
    JOIN periode p ON a.periode_id = p.id
    WHERE 1=1`
  const params = []
  if (filiere_id)    { params.push(filiere_id);    q += ` AND a.filiere_id=$${params.length}` }
  if (enseignant_id) { params.push(enseignant_id); q += ` AND a.enseignant_id=$${params.length}` }
  if (periode_id)    { params.push(periode_id);    q += ` AND a.periode_id=$${params.length}` }
  q += ' ORDER BY f.libelle_filiere, m.nom_matiere'
  try {
    const result = await req.app.locals.pool.query(q, params)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Créer une affectation + ses séances planifiées
router.post('/', auth, async (req, res) => {
  const { enseignant_id, matiere_id, filiere_id, periode_id, volume_horaire, seances } = req.body
  const pool = req.app.locals.pool
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Créer l'affectation
    const result = await client.query(
      `INSERT INTO affectation (enseignant_id, matiere_id, filiere_id, periode_id, volume_horaire, heures_restantes)
       VALUES ($1,$2,$3,$4,$5,$5) RETURNING *`,
      [enseignant_id, matiere_id, filiere_id, periode_id, volume_horaire || 0]
    )
    const affectation = result.rows[0]

    // Créer les séances planifiées si fournies
    if (seances && seances.length > 0) {
      for (const s of seances) {
        await client.query(
          `INSERT INTO seance (affectation_id, date_seance, heure_debut, heure_fin, duree_heures)
           VALUES ($1,$2,$3,$4,$5)`,
          [affectation.id, s.date_seance, s.heure_debut, s.heure_fin, s.duree_heures || 2]
        )
      }
      // Recalculer heures_restantes = volume_horaire - total heures séances planifiées
      // On ne décrémente pas à la planification, seulement quand le prof "démarre" la séance
    }

    await client.query('COMMIT')
    res.status(201).json(affectation)
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally { client.release() }
})

// Modifier
router.put('/:id', auth, async (req, res) => {
  const { enseignant_id, matiere_id, filiere_id, periode_id, volume_horaire } = req.body
  try {
    const result = await req.app.locals.pool.query(
      `UPDATE affectation SET enseignant_id=$1, matiere_id=$2, filiere_id=$3, periode_id=$4, volume_horaire=$5
       WHERE id=$6 RETURNING *`,
      [enseignant_id, matiere_id, filiere_id, periode_id, volume_horaire, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Supprimer
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.app.locals.pool.query('DELETE FROM affectation WHERE id=$1', [req.params.id])
    res.json({ message: 'Supprimé' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
