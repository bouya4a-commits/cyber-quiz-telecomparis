// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS_FILE = path.join(__dirname, 'results.csv');

// Créer le fichier results.csv s'il n'existe pas
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, 'date,score,total,level\n');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Route : soumission du quiz
app.post('/api/submit-quiz', (req, res) => {
  const { email, score, total } = req.body;

  // Validation des données
  if (
    !email ||
    typeof email !== 'string' ||
    !/@telecom-paris\.fr$/.test(email) || // Accepte : xxx@telecom-paris.fr (y compris sous-domaines comme etud.telecom-paris.fr)
    typeof score !== 'number' ||
    typeof total !== 'number' ||
    score < 0 ||
    total <= 0 ||
    score > total
  ) {
    return res.status(400).json({ error: 'Données invalides ou email non autorisé.' });
  }

  // Calcul du niveau
  const percent = (score / total) * 100;
  let level = 'Débutant';
  if (percent >= 90) level = 'Expert';
  else if (percent >= 70) level = 'Avancé';
  else if (percent >= 50) level = 'Intermédiaire';

  // Sauvegarde anonymisée (aucun email stocké)
  const logEntry = `${new Date().toISOString()},${score},${total},${level}\n`;
  fs.appendFileSync(RESULTS_FILE, logEntry);

  // Réponse au frontend
  res.json({ success: true, level, score: percent });
});

// Route : données pour le tableau de bord admin
app.get('/api/results', (req, res) => {
  try {
    const content = fs.readFileSync(RESULTS_FILE, 'utf8');
    const lines = content.trim().split('\n').slice(1); // Ignore l'en-tête

    const data = lines
      .filter(line => line.trim() !== '') // Ignore les lignes vides
      .map(line => {
        const [date, score, total, level] = line.split(',');
        return {
          date,
          score: parseInt(score, 10),
          total: parseInt(total, 10),
          level
        };
      });

    res.json(data);
  } catch (err) {
    console.error('Erreur lecture results.csv:', err);
    res.status(500).json({ error: 'Impossible de charger les résultats.' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
  console.log(`🎯 Quiz : http://localhost:${PORT}/`);
  console.log(`📊 Admin : http://localhost:${PORT}/admin.html`);
});
