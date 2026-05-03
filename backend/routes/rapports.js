const router = require('express').Router()
const auth = require('../middleware/auth')

// Stats globales
router.get('/stats', auth, async (req, res) => {
  try {
    const [etuds, ens, abs, justif] = await Promise.all([
      req.app.locals.pool.query('SELECT COUNT(*) FROM etudiant'),
      req.app.locals.pool.query('SELECT COUNT(*) FROM enseignant'),
      req.app.locals.pool.query("SELECT COUNT(*) FROM presence WHERE statut='absent'"),
      req.app.locals.pool.query("SELECT COUNT(*) FROM justification WHERE statut='en_attente'")
    ])
    res.json({
      nb_etudiants: parseInt(etuds.rows[0].count),
      nb_enseignants: parseInt(ens.rows[0].count),
      nb_absences: parseInt(abs.rows[0].count),
      nb_justif_attente: parseInt(justif.rows[0].count)
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Stats par filiere
router.get('/stats-filiere/:id', auth, async (req, res) => {
  const fid = req.params.id
  try {
    const [etuds, abs, justif, seances, affectations] = await Promise.all([
      req.app.locals.pool.query('SELECT COUNT(*) FROM etudiant WHERE filiere_id=$1', [fid]),
      req.app.locals.pool.query(`SELECT COUNT(*) FROM presence p JOIN seance s ON p.seance_id=s.id JOIN affectation a ON s.affectation_id=a.id WHERE a.filiere_id=$1 AND p.statut='absent'`, [fid]),
      req.app.locals.pool.query(`SELECT COUNT(*) FROM justification j JOIN presence p ON j.presence_id=p.id JOIN seance s ON p.seance_id=s.id JOIN affectation a ON s.affectation_id=a.id WHERE a.filiere_id=$1 AND j.statut='en_attente'`, [fid]),
      req.app.locals.pool.query(`SELECT COUNT(*) FROM seance s JOIN affectation a ON s.affectation_id=a.id WHERE a.filiere_id=$1`, [fid]),
      req.app.locals.pool.query('SELECT COUNT(*) FROM affectation WHERE filiere_id=$1', [fid])
    ])
    res.json({
      nb_etudiants: parseInt(etuds.rows[0].count),
      nb_absences: parseInt(abs.rows[0].count),
      nb_justif_attente: parseInt(justif.rows[0].count),
      nb_seances: parseInt(seances.rows[0].count),
      nb_affectations: parseInt(affectations.rows[0].count)
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Absences par filiere et periode
router.get('/absences-filiere', auth, async (req, res) => {
  const { filiere_id, periode_id } = req.query
  let q = `
    SELECT et.matricule, et.nom, et.prenom,
      f.libelle_filiere, m.nom_matiere,
      s.date_seance, s.heure_debut, s.heure_fin,
      p.statut, p.id as presence_id,
      j.motif as justif_motif, j.statut as justif_statut
    FROM presence p
    JOIN etudiant et ON p.etudiant_id=et.id
    JOIN filiere f ON et.filiere_id=f.id
    JOIN seance s ON p.seance_id=s.id
    JOIN affectation a ON s.affectation_id=a.id
    JOIN matiere m ON a.matiere_id=m.id
    LEFT JOIN justification j ON j.presence_id=p.id
    WHERE p.statut='absent'`
  const params = []
  if (filiere_id) { params.push(filiere_id); q += ` AND a.filiere_id=$${params.length}` }
  if (periode_id) { params.push(periode_id); q += ` AND a.periode_id=$${params.length}` }
  q += ' ORDER BY et.nom, s.date_seance'
  try {
    const result = await req.app.locals.pool.query(q, params)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Absences par etudiant
router.get('/absences-etudiant/:id', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      `SELECT m.nom_matiere, s.date_seance, s.heure_debut, s.heure_fin,
         p.statut, p.id as presence_id,
         j.motif, j.statut as justif_statut
       FROM presence p
       JOIN seance s ON p.seance_id=s.id
       JOIN affectation a ON s.affectation_id=a.id
       JOIN matiere m ON a.matiere_id=m.id
       LEFT JOIN justification j ON j.presence_id=p.id
       WHERE p.etudiant_id=$1 AND p.statut='absent'
       ORDER BY s.date_seance DESC`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Matieres par filiere
router.get('/matieres-filiere', auth, async (req, res) => {
  const { filiere_id } = req.query
  let q = `
    SELECT m.code_matiere, m.nom_matiere,
      f.libelle_filiere, f.code_filiere,
      e.nom as ens_nom, e.prenom as ens_prenom,
      p.libelle as periode_libelle,
      a.volume_horaire,
      COUNT(s.id) as nb_seances
    FROM affectation a
    JOIN matiere m ON a.matiere_id=m.id
    JOIN filiere f ON a.filiere_id=f.id
    JOIN enseignant e ON a.enseignant_id=e.id
    JOIN periode p ON a.periode_id=p.id
    LEFT JOIN seance s ON s.affectation_id=a.id
    ${filiere_id ? 'WHERE f.id=$1' : ''}
    GROUP BY m.code_matiere, m.nom_matiere, f.libelle_filiere, f.code_filiere,
      e.nom, e.prenom, p.libelle, a.volume_horaire
    ORDER BY f.libelle_filiere, m.nom_matiere`
  try {
    const result = await req.app.locals.pool.query(q, filiere_id ? [filiere_id] : [])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
