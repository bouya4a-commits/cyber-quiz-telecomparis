const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS_FILE = path.join(__dirname, 'results.csv');

// Même ordre que dans index.html
const QUESTIONS = [
  "Quelle est la meilleure pratique pour un mot de passe ?",
  "Que faire si vous recevez un email suspect ?",
  "Qu’est-ce que le phishing ?",
  "Faut-il mettre à jour ses logiciels ?",
  "Que faire en quittant votre poste ?"
];

if (!fs.existsSync(RESULTS_FILE)) {
  // Nouvel en-tête avec les réponses par question
  const header = ['date', 'score', 'total', 'level', 'department', 'email_partial', ...QUESTIONS.map((_, i) => `q${i}`)];
  fs.writeFileSync(RESULTS_FILE, header.join(',') + '\n');
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/submit-quiz', (req, res) => {
  const { email, department, score, total, answers } = req.body;

  if (!email || !department || typeof score !== 'number' || typeof total !== 'number' || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Données invalides' });
  }

  // Anonymisation
  const [local, domain] = email.split('@');
  const anonymized = local.length > 6 
    ? `${local.substring(0, 3)}***${local.substring(local.length - 3)}@${domain}`
    : `${local.substring(0, 1)}***@${domain}`;

  // Niveau
  const percent = (score / total) * 100;
  let level = 'Débutant';
  if (percent >= 90) level = 'Expert';
  else if (percent >= 70) level = 'Avancé';
  else if (percent >= 50) level = 'Intermédiaire';

  // Convertir les réponses en 1 (correct) / 0 (incorrect) / -1 (non répondu)
  const answerValues = answers.map((ans, i) => {
    if (ans === -1) return -1;
    return ans === QUESTIONS[i].correct ? 1 : 0;
  });

  // Sauvegarde
  const logEntry = [
    new Date().toISOString(),
    score,
    total,
    level,
    department,
    anonymized,
    ...answerValues
  ].join(',') + '\n';

  fs.appendFileSync(RESULTS_FILE, logEntry);
  res.json({ success: true, level, percent: Math.round(percent) });
});

// Nouvelle API pour les stats avancées
app.get('/api/stats', (req, res) => {
  try {
    if (!fs.existsSync(RESULTS_FILE)) {
      return res.json({ participants: [], questionStats: [], deptStats: {} });
    }

    const lines = fs.readFileSync(RESULTS_FILE, 'utf8').trim().split('\n');
    if (lines.length <= 1) {
      return res.json({ participants: [], questionStats: [], deptStats: {} });
    }

    const header = lines[0].split(',');
    const questionIndices = [];
    for (let i = 6; i < header.length; i++) {
      questionIndices.push(i);
    }

    const participants = [];
    const questionTotals = new Array(questionIndices.length).fill(0);
    const questionCorrect = new Array(questionIndices.length).fill(0);
    const deptStats = {};

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 6) continue;

      const date = parts[0];
      const score = parseInt(parts[1]);
      const total = parseInt(parts[2]);
      const level = parts[3];
      const department = parts[4];
      const email = parts[5];

      // Stats par département
      if (!deptStats[department]) {
        deptStats[department] = { count: 0, totalScore: 0 };
      }
      deptStats[department].count++;
      deptStats[department].totalScore += (score / total);

      // Réponses par question
      const answers = [];
      questionIndices.forEach((idx, qIdx) => {
        const val = parseInt(parts[idx]);
        answers.push(val);
        if (val === 0) {
          questionTotals[qIdx]++;
        } else if (val === 1) {
          questionCorrect[qIdx]++;
          questionTotals[qIdx]++;
        }
      });

      participants.push({
        date,
        score,
        total,
        level,
        department,
        email,
        answers
      });
    }

    // Stats par question (taux d'erreur)
    const questionStats = questionIndices.map((_, i) => {
      const totalAttempts = questionTotals[i];
      const errors = totalAttempts - questionCorrect[i];
      const errorRate = totalAttempts > 0 ? (errors / totalAttempts) * 100 : 0;
      return {
        question: QUESTIONS[i],
        errorRate: parseFloat(errorRate.toFixed(1)),
        errors,
        total: totalAttempts
      };
    }).sort((a, b) => b.errorRate - a.errorRate).slice(0, 5);

    res.json({ participants, questionStats, deptStats });
  } catch (err) {
    console.error('Erreur stats:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Quiz lancé sur http://localhost:${PORT}`);
});
