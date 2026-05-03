const router = require('express').Router()
const auth = require('../middleware/auth')

// Justifications d'une filière — une ligne par absence
router.get('/', auth, async (req, res) => {
  const { filiere_id } = req.query
  let q = `
    SELECT j.id, j.motif, j.statut, j.date_soumission,
      et.id as etudiant_id, et.nom as etud_nom, et.prenom as etud_prenom, et.matricule,
      m.nom_matiere, m.code_matiere,
      s.date_seance, s.heure_debut, s.heure_fin, s.duree_heures,
      p.id as presence_id, p.statut as presence_statut,
      a.filiere_id
    FROM justification j
    JOIN presence p ON j.presence_id = p.id
    JOIN etudiant et ON p.etudiant_id = et.id
    JOIN seance s ON p.seance_id = s.id
    JOIN affectation a ON s.affectation_id = a.id
    JOIN matiere m ON a.matiere_id = m.id
    WHERE 1=1`
  const params = []
  if (filiere_id) { params.push(filiere_id); q += ` AND a.filiere_id=$${params.length}` }
  q += ' ORDER BY s.date_seance DESC, et.nom'
  try {
    const result = await req.app.locals.pool.query(q, params)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Mettre à jour le statut + motif d'une justification
// Si validée → les heures d'absence restent à 0 (non comptées)
router.patch('/:id/statut', auth, async (req, res) => {
  const { statut, motif } = req.body
  try {
    const result = await req.app.locals.pool.query(
      `UPDATE justification SET statut=$1, motif=COALESCE($2, motif), date_traitement=NOW()
       WHERE id=$3 RETURNING *`,
      [statut, motif || null, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
