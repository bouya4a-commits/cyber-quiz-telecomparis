const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Chemin du fichier de résultats
const RESULTS_FILE = path.join(__dirname, 'results.csv');

// Créer le fichier s'il n'existe pas
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, 'date,score,total,level\n');
}

// Endpoint : soumission du quiz
app.post('/api/submit-quiz', async (req, res) => {
  const { email, score, total } = req.body;

  // Validation basique
  if (!email || !email.endsWith('@ecole.fr') || typeof score !== 'number' || typeof total !== 'number') {
    return res.status(400).json({ error: 'Données invalides' });
  }

  const percent = (score / total) * 100;
  let level = 'Débutant';
  if (percent >= 90) level = 'Expert';
  else if (percent >= 70) level = 'Avancé';
  else if (percent >= 50) level = 'Intermédiaire';

  // ⚠️ ICI : vous pouvez ajouter l'envoi d'email (optionnel pour le MVP)
  // Voir plus bas pour l'intégration SendGrid ou SMTP

  // Sauvegarde anonymisée
  const logEntry = `${new Date().toISOString()},${score},${total},${level}\n`;
  fs.appendFileSync(RESULTS_FILE, logEntry);

  res.json({ success: true, level });
});

// Endpoint : données pour l'admin (sans email)
app.get('/api/results', (req, res) => {
  try {
    const content = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const lines = content.trim().split('\n').slice(1); // skip header
    const data = lines.map(line => {
      const [date, score, total, level] = line.split(',');
      return { date, score: parseInt(score), total: parseInt(total), level };
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de lire les résultats' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
  console.log(`📊 Tableau de bord : http://localhost:${PORT}/admin.html`);
});
