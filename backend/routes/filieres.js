const router = require('express').Router();
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(`
      SELECT f.*,
        COUNT(e.id) as nbre_etud
      FROM filiere f
      LEFT JOIN etudiant e ON e.filiere_id = f.id
      GROUP BY f.id
      ORDER BY f.libelle_filiere
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { code_filiere, libelle_filiere } = req.body;
  try {
    const result = await req.app.locals.pool.query(
      'INSERT INTO filiere (code_filiere, libelle_filiere) VALUES ($1, $2) RETURNING *',
      [code_filiere, libelle_filiere]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  const { code_filiere, libelle_filiere } = req.body;
  try {
    const result = await req.app.locals.pool.query(
      'UPDATE filiere SET code_filiere=$1, libelle_filiere=$2 WHERE id=$3 RETURNING *',
      [code_filiere, libelle_filiere, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.app.locals.pool.query('DELETE FROM filiere WHERE id=$1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
