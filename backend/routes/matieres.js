const router = require('express').Router();
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query('SELECT * FROM matiere ORDER BY nom_matiere');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { code_matiere, nom_matiere } = req.body;
  try {
    const result = await req.app.locals.pool.query(
      'INSERT INTO matiere (code_matiere, nom_matiere) VALUES ($1, $2) RETURNING *',
      [code_matiere, nom_matiere]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  const { code_matiere, nom_matiere } = req.body;
  try {
    const result = await req.app.locals.pool.query(
      'UPDATE matiere SET code_matiere=$1, nom_matiere=$2 WHERE id=$3 RETURNING *',
      [code_matiere, nom_matiere, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.app.locals.pool.query('DELETE FROM matiere WHERE id=$1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
