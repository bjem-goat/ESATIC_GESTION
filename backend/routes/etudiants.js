const router = require('express').Router();
const auth = require('../middleware/auth');

// Liste globale
router.get('/', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      `SELECT e.*, f.libelle_filiere, f.code_filiere FROM etudiant e 
       LEFT JOIN filiere f ON e.filiere_id = f.id ORDER BY e.nom`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Etudiants d'une filière avec heures d'absence totales (non justifiées)
router.get('/filiere/:id/absences', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      `SELECT e.*,
        f.libelle_filiere, f.code_filiere,
        COALESCE(SUM(
          CASE WHEN p.statut = 'absent' AND (j.id IS NULL OR j.statut != 'validee')
          THEN s.duree_heures ELSE 0 END
        ), 0) as heures_absence
       FROM etudiant e
       LEFT JOIN filiere f ON e.filiere_id = f.id
       LEFT JOIN presence p ON p.etudiant_id = e.id
       LEFT JOIN seance s ON p.seance_id = s.id
       LEFT JOIN justification j ON j.presence_id = p.id
       WHERE e.filiere_id = $1
       GROUP BY e.id, f.libelle_filiere, f.code_filiere
       ORDER BY e.nom`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
});

router.post('/', auth, async (req, res) => {
  const { matricule, nom, prenom, sexe, email, telephone, email_parent, filiere_id } = req.body;
  try {
    const result = await req.app.locals.pool.query(
      'INSERT INTO etudiant (matricule, nom, prenom, sexe, email, telephone, email_parent, filiere_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [matricule, nom, prenom, sexe, email, telephone, email_parent || null, filiere_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  const { matricule, nom, prenom, sexe, email, telephone, email_parent, filiere_id } = req.body;
  try {
    const result = await req.app.locals.pool.query(
      'UPDATE etudiant SET matricule=$1, nom=$2, prenom=$3, sexe=$4, email=$5, telephone=$6, email_parent=$7, filiere_id=$8 WHERE id=$9 RETURNING *',
      [matricule, nom, prenom, sexe, email, telephone, email_parent || null, filiere_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.app.locals.pool.query('DELETE FROM etudiant WHERE id=$1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
