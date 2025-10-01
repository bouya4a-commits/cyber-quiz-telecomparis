// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS_FILE = path.join(__dirname, 'results.csv');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Créer results.csv si absent
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, 'date,score,total,level,department,email_partial\n');
}

// Charger la config (si elle existe)
let config = { admin: null, schoolName: "École d'ingénieurs", logo: 'logo.png' };
if (fs.existsSync(CONFIG_FILE)) {
  const loaded = JSON.parse(fs.readFileSync(CONFIG_FILE));
  config = { ...config, ...loaded };
  // Sauvegarde pour uniformiser
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// ========== ROUTE UTILISATEURS ==========
app.post('/api/submit-quiz', (req, res) => {
  const { email, department, score, total } = req.body;

  if (
    !email || !department || typeof score !== 'number' || typeof total !== 'number' ||
    !/@([a-z0-9-]+\.)?(telecom-paris\.fr|imt\.fr)$/i.test(email)
  ) {
    return res.status(400).json({ error: 'Données invalides.' });
  }

  // Anonymisation partielle
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

// ========== AUTH ADMIN ==========
app.post('/api/admin/login', async (req, res) => {
  if (!config.admin) {
    return res.status(500).json({ error: 'Admin non configuré. Exécutez setup-admin.js.' });
  }

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

const requireAdmin = (req, res, next) => {
  if (!config.admin) return res.status(500).json({ error: 'Admin non configuré.' });
  
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
  res.json({
    totalParticipants: 3,
    avgScore: "75.0",
    byDept: { "IT / DSI": 2, "Recherche - LTCI": 1 },
    raw: [
      { date: "2025-04-05T10:00:00.000Z", score: 8, total: 10, level: "Avancé", department: "IT / DSI", email: "user***@telecom-paris.fr" },
      { date: "2025-04-05T11:00:00.000Z", score: 10, total: 10, level: "Expert", department: "IT / DSI", email: "admin***@telecom-paris.fr" },
      { date: "2025-04-05T12:00:00.000Z", score: 5, total: 10, level: "Intermédiaire", department: "Recherche - LTCI", email: "chercheur***@telecom-paris.fr" }
    ]
  });
});

app.get('/api/admin/config', requireAdmin, (req, res) => {
  res.json({ 
    schoolName: config.schoolName || "École d'ingénieurs",
    logo: config.logo 
  });
});

app.post('/api/admin/config', requireAdmin, (req, res) => {
  const { schoolName } = req.body;
  if (schoolName && schoolName.trim() !== '') {
    config.schoolName = schoolName.trim();
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  res.json({ 
    success: true, 
    schoolName: config.schoolName,
    logo: config.logo 
  });
});

app.get('/api/admin/logo', (req, res) => {
  const logoPath = path.join(__dirname, 'assets', config.logo);
  if (fs.existsSync(logoPath)) {
    res.sendFile(logoPath);
  } else {
    res.status(404).end();
  }
});

// ========== BADGE AVEC LOGO ET NOM ÉTABLISSEMENT ==========
app.get('/api/badge/:level', (req, res) => {
  const { level } = req.params;
  const levels = { 'Expert': '🥇', 'Avancé': '🥈', 'Intermédiaire': '🥉', 'Débutant': '📚' };
  const emoji = levels[level] || '🏅';
  const school = config.schoolName || "École d'ingénieurs";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Badge Cybersécurité</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 40px; 
          background: #f9f9f9; 
          max-width: 800px; 
          margin: 0 auto;
        }
        .header { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 20px; 
          margin-bottom: 30px; 
        }
        .logo { 
          height: 80px; 
          border-radius: 12px; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .badge { 
          font-size: 100px; 
          margin: 20px 0; 
        }
        .school { 
          font-size: 20px; 
          color: #2c3e50; 
          margin-top: 10px;
        }
        .btn { 
          padding: 12px 24px; 
          background: #3498db; 
          color: white; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 18px;
          margin-top: 20px;
        }
        @media print {
          .btn { display: none; }
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img class="logo" src="/assets/logo.png" alt="Logo">
        <div>
          <h1>🏆 Badge Cybersécurité</h1>
          <div class="school">${school}</div>
        </div>
      </div>
      <div class="badge">${emoji}</div>
      <h2>Niveau : ${level}</h2>
      <p>Ce badge atteste de votre engagement en faveur de la cybersécurité.</p>
      <button class="btn" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
    </body>
    </html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
  console.log(`🎯 Quiz : http://localhost:${PORT}/`);
  console.log(`🔐 Admin : http://localhost:${PORT}/admin-login.html`);
});
