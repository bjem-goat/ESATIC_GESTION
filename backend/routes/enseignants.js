const router = require('express').Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      'SELECT id, id_enseignant, nom, prenom, mail, specialite, diplome, sexe, role FROM enseignant ORDER BY nom'
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { id_enseignant, nom, prenom, mail, specialite, diplome, sexe, password } = req.body;
  try {
    const hash = await bcrypt.hash(password || 'password123', 10);
    const result = await req.app.locals.pool.query(
      'INSERT INTO enseignant (id_enseignant, nom, prenom, mail, specialite, diplome, sexe, password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, id_enseignant, nom, prenom, mail, specialite, diplome, sexe',
      [id_enseignant, nom, prenom, mail, specialite, diplome, sexe, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  const { id_enseignant, nom, prenom, mail, specialite, diplome, sexe } = req.body;
  try {
    const result = await req.app.locals.pool.query(
      'UPDATE enseignant SET id_enseignant=$1, nom=$2, prenom=$3, mail=$4, specialite=$5, diplome=$6, sexe=$7 WHERE id=$8 RETURNING id, id_enseignant, nom, prenom, mail, specialite, diplome, sexe',
      [id_enseignant, nom, prenom, mail, specialite, diplome, sexe, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.app.locals.pool.query('DELETE FROM enseignant WHERE id=$1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
