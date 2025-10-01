const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS_FILE = path.join(__dirname, 'results.csv');

// Créer results.csv si absent
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, 'date,score,total,level,department,email_partial\n');
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Soumission du quiz
app.post('/api/submit-quiz', (req, res) => {
  const { email, department, score, total } = req.body;

  // Validation basique
  if (!email || !department || typeof score !== 'number' || typeof total !== 'number') {
    return res.status(400).json({ error: 'Données invalides' });
  }

  // Anonymisation partielle de l'email
  const [local, domain] = email.split('@');
  const anonymized = local.length > 6 
    ? `${local.substring(0, 3)}***${local.substring(local.length - 3)}@${domain}`
    : `${local.substring(0, 1)}***@${domain}`;

  // Calcul du niveau
  const percent = (score / total) * 100;
  let level = 'Débutant';
  if (percent >= 90) level = 'Expert';
  else if (percent >= 70) level = 'Avancé';
  else if (percent >= 50) level = 'Intermédiaire';

  // Sauvegarde
  const logEntry = `${new Date().toISOString()},${score},${total},${level},${department},${anonymized}\n`;
  fs.appendFileSync(RESULTS_FILE, logEntry);

  res.json({ success: true, level, percent: Math.round(percent) });
});

// Données pour l'admin
app.get('/api/results', (req, res) => {
  try {
    const content = fs.readFileSync(RESULTS_FILE, 'utf8');
    const lines = content.trim().split('\n').slice(1);
    const data = lines
      .filter(line => line.trim() !== '')
      .map(line => {
        const [date, score, total, level, department, email] = line.split(',');
        return { date, score: +score, total: +total, level, department, email };
      });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lecture résultats' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Quiz lancé sur http://localhost:${PORT}`);
});
