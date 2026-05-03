const router = require('express').Router();
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      `SELECT en.*, 
        e.nom as ens_nom, e.prenom as ens_prenom,
        m.nom_matiere, m.code_matiere,
        f.libelle_filiere, f.code_filiere,
        p.libelle as periode_libelle, p.id_periode
       FROM enseignement en
       JOIN enseignant e ON en.enseignant_id = e.id
       JOIN matiere m ON en.matiere_id = m.id
       JOIN filiere f ON en.filiere_id = f.id
       JOIN periode p ON en.periode_id = p.id
       ORDER BY en.date_enseignement DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { id_enseignement, enseignant_id, matiere_id, filiere_id, periode_id, date_enseignement, horaire } = req.body;
  try {
    const result = await req.app.locals.pool.query(
      'INSERT INTO enseignement (id_enseignement, enseignant_id, matiere_id, filiere_id, periode_id, date_enseignement, horaire) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [id_enseignement, enseignant_id, matiere_id, filiere_id, periode_id, date_enseignement, horaire]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.app.locals.pool.query('DELETE FROM enseignement WHERE id=$1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
