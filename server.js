// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS_FILE = path.join(__dirname, 'results.csv');

// Créer results.csv avec en-tête si absent
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, 'date,score,total,level,department\n');
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Soumission du quiz
app.post('/api/submit-quiz', (req, res) => {
  const { email, department, score, total } = req.body;

  // Validation stricte
  if (
    !email ||
    typeof email !== 'string' ||
    !/@([a-z0-9-]+\.)?(telecom-paris\.fr|imt\.fr)$/i.test(email) ||
    !department ||
    typeof department !== 'string' ||
    department.trim() === '' ||
    typeof score !== 'number' ||
    typeof total !== 'number' ||
    score < 0 ||
    total <= 0 ||
    score > total
  ) {
    return res.status(400).json({ error: 'Données invalides.' });
  }

  const percent = (score / total) * 100;
  let level = 'Débutant';
  if (percent >= 90) level = 'Expert';
  else if (percent >= 70) level = 'Avancé';
  else if (percent >= 50) level = 'Intermédiaire';

  // Sauvegarde anonymisée (email non stocké)
  const logEntry = `${new Date().toISOString()},${score},${total},${level},${department}\n`;
  fs.appendFileSync(RESULTS_FILE, logEntry);

  res.json({ success: true, level });
});

// Données pour l'admin
app.get('/api/results', (req, res) => {
  try {
    const content = fs.readFileSync(RESULTS_FILE, 'utf8');
    const lines = content.trim().split('\n').slice(1);
    const data = lines
      .filter(line => line.trim() !== '')
      .map(line => {
        const [date, score, total, level, department] = line.split(',');
        return {
          date,
          score: parseInt(score, 10),
          total: parseInt(total, 10),
          level,
          department
        };
      });
    res.json(data);
  } catch (err) {
    console.error('Erreur lecture results.csv:', err);
    res.status(500).json({ error: 'Impossible de charger les résultats.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
  console.log(`🎯 Quiz : http://localhost:${PORT}/`);
  console.log(`📊 Admin : http://localhost:${PORT}/admin.html`);
});
