const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // pour servir le HTML

// Configuration email (à adapter)
const transporter = nodemailer.createTransporter({
  host: 'smtp.ecole.fr',
  port: 587,
  secure: false,
  auth: {
    user: 'cyberquiz@ecole.fr',
    pass: process.env.EMAIL_PASS
  }
});

// Endpoint pour recevoir les résultats
app.post('/api/submit-quiz', async (req, res) => {
  const { email, score, total } = req.body;

  if (!email || !email.endsWith('@ecole.fr')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const percent = Math.round((score / total) * 100);
  let level = 'Débutant';
  if (percent >= 90) level = 'Expert';
  else if (percent >= 70) level = 'Avancé';
  else if (percent >= 50) level = 'Intermédiaire';

  // 1. Envoi du résultat à l'utilisateur
  await transporter.sendMail({
    from: '"Quiz Cybersécurité" <cyberquiz@ecole.fr>',
    to: email,
    subject: `Votre résultat au quiz cybersécurité - ${percent}%`,
    html: `
      <h2>Votre résultat : ${percent}% (${level})</h2>
      <p>Merci d’avoir participé au quiz de sensibilisation à la cybersécurité !</p>
      <p>🏆 ${getBadge(percent)}</p>
    `
  });

  // 2. Sauvegarde anonymisée pour l'admin (sans email)
  const logEntry = `${new Date().toISOString()},${score},${total},${level}\n`;
  fs.appendFileSync(path.join(__dirname, 'results.csv'), logEntry);

  res.json({ success: true });
});

function getBadge(percent) {
  if (percent >= 90) return '🥇 Expert en cybersécurité !';
  if (percent >= 70) return '🥈 Très bon niveau !';
  if (percent >= 50) return '🥉 Bonnes bases !';
  return '📚 À renforcer !';
}

app.listen(3000, () => console.log('Serveur lancé sur http://localhost:3000'));
