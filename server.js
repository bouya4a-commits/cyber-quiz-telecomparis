// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { createCanvas } = require('canvas'); // Pour le PDF

const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS_FILE = path.join(__dirname, 'results.csv');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Créer results.csv si absent
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, 'date,score,total,level,department,email_partial\n');
}

// Charger la config
let config = JSON.parse(fs.readFileSync(CONFIG_FILE));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// ========== ROUTES UTILISATEURS ==========
app.post('/api/submit-quiz', (req, res) => {
  const { email, department, score, total } = req.body;

  if (
    !email || !department || typeof score !== 'number' || typeof total !== 'number' ||
    !/@([a-z0-9-]+\.)?(telecom-paris\.fr|imt\.fr)$/i.test(email)
  ) {
    return res.status(400).json({ error: 'Données invalides.' });
  }

  // Anonymisation partielle de l'email : laurent***@telecom-paris.fr
  const [local, domain] = email.split('@');
  const anonymized = local.length > 6 
    ? `${local.substring(0, 3)}***${local.substring(local.length - 3)}@${domain}`
    : `${local.substring(0, 1)}***@${domain}`;

  const percent = (score / total) * 100;
  let level = 'Débutant';
  if (percent >= 90) level = 'Expert';
  else if (percent >= 70) level = 'Avancé';
  else if (percent >= 50) level = 'Intermédiaire';

  const logEntry = `${new Date().toISOString()},${score},${total},${level},${department},${anonymized}\n`;
  fs.appendFileSync(RESULTS_FILE, logEntry);

  res.json({ success: true, level });
});

// ========== AUTHENTIFICATION ADMIN ==========
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === config.admin.username) {
    const isValid = await bcrypt.compare(password, config.admin.passwordHash);
    if (isValid) {
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      return res.json({ token });
    }
  }
  res.status(401).json({ error: 'Identifiants invalides' });
});

// Middleware de vérification admin
const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const payload = Buffer.from(auth.slice(7), 'base64').toString();
      const [user] = payload.split(':');
      if (user === config.admin.username) return next();
    } catch (e) {}
  }
  res.status(403).json({ error: 'Accès refusé' });
};

// ========== ROUTES ADMIN ==========
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  try {
    const content = fs.readFileSync(RESULTS_FILE, 'utf8');
    const lines = content.trim().split('\n').slice(1);
    const data = lines.map(line => {
      const [date, score, total, level, department, email] = line.split(',');
      return { date, score: +score, total: +total, level, department, email };
    });

    // Statistiques globales
    const totalParticipants = data.length;
    const avgScore = data.reduce((sum, r) => sum + (r.score / r.total), 0) / totalParticipants * 100 || 0;

    // Par département
    const byDept = data.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + 1;
      return acc;
    }, {});

    res.json({ totalParticipants, avgScore: avgScore.toFixed(1), byDept, raw: data });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lecture' });
  }
});

app.get('/api/admin/logo', (req, res) => {
  const logoPath = path.join(__dirname, 'assets', config.logo);
  if (fs.existsSync(logoPath)) {
    res.sendFile(logoPath);
  } else {
    res.status(404).end();
  }
});

// ========== EXPORT BADGE PDF ==========
// Route temporaire pour le badge (sans PDF)
app.get('/api/badge/:level', (req, res) => {
  const { level } = req.params;
  const levels = { 'Expert': '🥇', 'Avancé': '🥈', 'Intermédiaire': '🥉', 'Débutant': '📚' };
  const emoji = levels[level] || '🏅';

  // Génère une page HTML simple (au lieu d’un PDF)
  const html = `
    <html>
    <head><title>Badge ${level}</title></head>
    <body style="font-family:Arial;text-align:center;padding:50px;">
      <h1>🏆 Badge Cybersécurité</h1>
      <div style="font-size:100px;margin:30px;">${emoji}</div>
      <h2>Niveau : ${level}</h2>
      <p>Ce badge est une preuve de votre engagement en cybersécurité.</p>
      <button onclick="window.print()">Imprimer ce badge</button>
    </body>
    </html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

  // Texte
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 36px Arial';
  ctx.fillText('Badge Cybersécurité', 200, 120);
  ctx.font = 'bold 80px Arial';
  ctx.fillText(emoji, 250, 240);
  ctx.font = '24px Arial';
  ctx.fillText(`Niveau : ${level}`, 220, 300);

  // Envoyer PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=badge-${level}.pdf`);
  const pdf = canvas.toBuffer('application/pdf');
  res.end(pdf);
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
