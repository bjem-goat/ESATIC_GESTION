const router = require('express').Router();
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query('SELECT * FROM periode ORDER BY date_debut DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { id_periode, libelle, date_debut, date_fin } = req.body;
  try {
    const result = await req.app.locals.pool.query(
      'INSERT INTO periode (id_periode, libelle, date_debut, date_fin) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_periode, libelle, date_debut, date_fin]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  const { id_periode, libelle, date_debut, date_fin } = req.body;
  try {
    const result = await req.app.locals.pool.query(
      'UPDATE periode SET id_periode=$1, libelle=$2, date_debut=$3, date_fin=$4 WHERE id=$5 RETURNING *',
      [id_periode, libelle, date_debut, date_fin, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.app.locals.pool.query('DELETE FROM periode WHERE id=$1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
