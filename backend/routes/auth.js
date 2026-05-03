const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const pool = req.app.locals.pool;
  try {
    // Check admin
    let result = await pool.query('SELECT * FROM admin WHERE email = $1', [email]);
    let user = result.rows[0];
    if (!user) {
      result = await pool.query('SELECT * FROM enseignant WHERE mail = $1', [email]);
      user = result.rows[0];
    }
    if (!user) return res.status(401).json({ error: 'Utilisateur non trouvé' });
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { id: user.id, email: user.email || user.mail, role: user.role, nom: user.nom, prenom: user.prenom },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, nom: user.nom, prenom: user.prenom, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
