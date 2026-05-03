const router = require('express').Router()
const auth = require('../middleware/auth')
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' }
})

async function envoyerEmailParent(emailParent, nomEtudiant, matiere, date, heure) {
  if (!emailParent || !process.env.SMTP_USER) return
  try {
    await transporter.sendMail({
      from: `"MBDS - Gestion Absences" <${process.env.SMTP_USER}>`,
      to: emailParent,
      subject: `⚠️ Absence de ${nomEtudiant} — ${matiere}`,
      html: `<div style="font-family:Arial;max-width:500px">
        <div style="background:#0284c7;color:white;padding:20px;border-radius:8px 8px 0 0"><h2 style="margin:0">🎓 MBDS — Avis d'absence</h2></div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
          <p>Bonjour,</p>
          <p>Votre enfant <strong>${nomEtudiant}</strong> a été marqué <strong style="color:#dc2626">absent(e)</strong> :</p>
          <p><b>Matière :</b> ${matiere}<br><b>Date :</b> ${date}<br><b>Heure :</b> ${heure}</p>
          <p style="color:#64748b;font-size:13px">Si justifiée, merci de fournir un justificatif à l'administration.</p>
        </div></div>`
    })
  } catch (e) { console.error('Email non envoyé:', e.message) }
}

// Présences d'une séance (avec heures d'absence cumulées par étudiant)
router.get('/seance/:id', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      `SELECT p.*, et.nom, et.prenom, et.matricule, et.email_parent,
         j.motif as justif_motif, j.statut as justif_statut, j.id as justif_id,
         (SELECT COALESCE(SUM(s2.duree_heures),0)
          FROM presence p2
          JOIN seance s2 ON p2.seance_id = s2.id
          LEFT JOIN justification j2 ON j2.presence_id = p2.id
          WHERE p2.etudiant_id = p.etudiant_id
            AND p2.seance_id IN (
              SELECT s3.id FROM seance s3 WHERE s3.affectation_id = (
                SELECT affectation_id FROM seance WHERE id=$1
              )
            )
            AND p2.statut='absent'
            AND (j2.id IS NULL OR j2.statut != 'validee')
         ) as heures_absence
       FROM presence p
       JOIN etudiant et ON p.etudiant_id = et.id
       LEFT JOIN justification j ON j.presence_id = p.id
       WHERE p.seance_id=$1 ORDER BY et.nom`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Étudiants d'une filière avec leurs heures d'absence totales par affectation
router.get('/filiere/:filiereId/affectation/:affectationId', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      `SELECT et.*,
         COALESCE(SUM(CASE WHEN p.statut='absent' AND (j.id IS NULL OR j.statut != 'validee') THEN s.duree_heures ELSE 0 END), 0) as heures_absence
       FROM etudiant et
       LEFT JOIN presence p ON p.etudiant_id = et.id
       LEFT JOIN seance s ON p.seance_id = s.id AND s.affectation_id = $2
       LEFT JOIN justification j ON j.presence_id = p.id
       WHERE et.filiere_id = $1
       GROUP BY et.id
       ORDER BY et.nom`,
      [req.params.filiereId, req.params.affectationId]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Étudiants d'une filière (simple)
router.get('/filiere/:id', auth, async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      'SELECT * FROM etudiant WHERE filiere_id=$1 ORDER BY nom',
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Bulk upsert présences + création auto justification pour absents
router.post('/bulk', auth, async (req, res) => {
  const { seance_id, presences } = req.body
  const pool = req.app.locals.pool
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Infos séance pour email
    const seanceInfo = await client.query(
      `SELECT s.date_seance, s.heure_debut, s.heure_fin, m.nom_matiere
       FROM seance s
       JOIN affectation a ON s.affectation_id = a.id
       JOIN matiere m ON a.matiere_id = m.id
       WHERE s.id=$1`, [seance_id]
    )
    const si = seanceInfo.rows[0]

    for (const p of presences) {
      // Upsert présence
      const presResult = await client.query(
        `INSERT INTO presence (seance_id, etudiant_id, statut)
         VALUES ($1,$2,$3)
         ON CONFLICT (seance_id, etudiant_id) DO UPDATE SET statut=$3
         RETURNING *`,
        [seance_id, p.etudiant_id, p.statut]
      )
      const presenceId = presResult.rows[0].id

      if (p.statut === 'absent') {
        // Créer justification automatiquement si elle n'existe pas
        await client.query(
          `INSERT INTO justification (presence_id, motif, statut)
           VALUES ($1, '', 'en_attente')
           ON CONFLICT (presence_id) DO NOTHING`,
          [presenceId]
        )
        // Email parent
        const etud = await client.query(
          'SELECT nom, prenom, email_parent FROM etudiant WHERE id=$1', [p.etudiant_id]
        )
        if (etud.rows[0]?.email_parent && si) {
          const date = si.date_seance ? new Date(si.date_seance).toLocaleDateString('fr-FR') : '—'
          const heure = si.heure_debut && si.heure_fin ? `${si.heure_debut} – ${si.heure_fin}` : '—'
          envoyerEmailParent(etud.rows[0].email_parent, `${etud.rows[0].prenom} ${etud.rows[0].nom}`, si.nom_matiere, date, heure)
        }
      } else {
        // Si le statut change à présent/retard, supprimer la justification en_attente
        await client.query(
          `DELETE FROM justification WHERE presence_id=$1 AND statut='en_attente'`,
          [presenceId]
        )
      }
    }

    await client.query('COMMIT')
    res.json({ message: 'Presences enregistrées' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally { client.release() }
})

module.exports = router
