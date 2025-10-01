require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS_FILE = path.join(__dirname, 'results.csv');

// Questions Cybersécurité (20)
const CYBER_QUESTIONS = [
  "Quelle est la meilleure pratique pour un mot de passe ?",
  "Que faire si vous recevez un email suspect ?",
  "Qu’est-ce que le phishing ?",
  "Faut-il mettre à jour ses logiciels ?",
  "Que faire en quittant votre poste ?",
  "Qu’est-ce qu’un VPN ?",
  "Est-il sécurisé d’utiliser une clé USB trouvée ?",
  "Quel est le risque principal du Wi-Fi public ?",
  "Que signifie 2FA ?",
  "Qui contacter en cas de cyberattaque ?",
  "Qu’est-ce qu’un ransomware ?",
  "Pourquoi utiliser un gestionnaire de mots de passe ?",
  "Qu’est-ce qu’une sauvegarde ?",
  "Que faire si votre ordinateur est lent et affiche des pubs ?",
  "Qu’est-ce qu’un pare-feu ?",
  "Pourquoi ne pas cliquer sur les liens dans les MAILS/SMS inconnus ?",
  "Qu’est-ce qu’une authentification biométrique ?",
  "Que faire si vous perdez votre badge d’accès ?",
  "Pourquoi chiffrer ses données ?",
  "Qu’est-ce qu’une politique de sécurité (PSSI) ?"
];

// Questions RGPD (20)
const RGPD_QUESTIONS = [
  "Qu’est-ce que le RGPD ?",
  "Qui est le/la Délégué(e) à la Protection des Données (DPO) ?",
  "Quand faut-il obtenir le consentement ?",
  "Que faire en cas de fuite de données ?",
  "Combien de temps conserver les données ?",
  "Qu’est-ce qu’une donnée à caractère personnel ?",
  "Peut-on transférer des données hors UE ?",
  "Quels sont les droits des personnes ?",
  "Qu’est-ce qu’un registre des traitements ?",
  "Qui est responsable du traitement ?",
  "Qu’est-ce qu’une analyse d’impact (AIPD) ?",
  "Faut-il informer les personnes ?",
  "Peut-on photographier des étudiants ?",
  "Que faire avec les CV reçus ?",
  "Peut-on partager des listes de diffusion ?",
  "Qu’est-ce qu’une sous-traitance ?",
  "Faut-il former les personnels ?",
  "Que faire des anciens dossiers papier ?",
  "Peut-on publier des photos d’événements ?",
  "Qu’est-ce qu’une violation de données ?"
];

if (!fs.existsSync(RESULTS_FILE)) {
  const header = [
    'date', 'quiz_type', 'score', 'total', 'level', 'department', 'email_partial',
    ...Array.from({length: 20}, (_, i) => `q${i}`)
  ].join(',') + '\n';
  fs.writeFileSync(RESULTS_FILE, header);
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
// Servir les assets (logo, etc.)
app.use('/assets', express.static('assets'));

// Soumission quiz
app.post('/api/submit-quiz', (req, res) => {
  const { email, department, score, total, answers, quizType } = req.body;

  if (!email || !department || !quizType || typeof score !== 'number' || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Données invalides' });
  }

  const [local, domain] = email.split('@');
  const anonymized = local.length > 6 
    ? `${local.substring(0, 3)}***${local.substring(local.length - 3)}@${domain}`
    : `${local.substring(0, 1)}***@${domain}`;

  const percent = (score / total) * 100;
  let level = 'Débutant';
  if (percent >= 90) level = 'Expert';
  else if (percent >= 70) level = 'Avancé';
  else if (percent >= 50) level = 'Intermédiaire';

  const answerValues = answers.map(a => a === -1 ? -1 : (a === 1 ? 1 : 0));
  // Compléter à 20 réponses
  while (answerValues.length < 20) answerValues.push(-1);

  const logEntry = [
    new Date().toISOString(),
    quizType,
    score,
    total,
    level,
    department,
    anonymized,
    ...answerValues
  ].join(',') + '\n';

  fs.appendFileSync(RESULTS_FILE, logEntry);
  res.json({ success: true, level });
});

// Stats avancées
app.get('/api/stats', (req, res) => {
  try {
    if (!fs.existsSync(RESULTS_FILE)) {
      return res.json({ cyber: [], rgpd: [], cyberStats: {}, rgpdStats: {} });
    }

    const lines = fs.readFileSync(RESULTS_FILE, 'utf8').trim().split('\n');
    if (lines.length <= 1) {
      return res.json({ cyber: [], rgpd: [], cyberStats: {}, rgpdStats: {} });
    }

    const cyber = [], rgpd = [];
    const cyberDepts = {}, rgpdDepts = {};
    const cyberQErrors = new Array(20).fill(0), cyberQTotal = new Array(20).fill(0);
    const rgpdQErrors = new Array(20).fill(0), rgpdQTotal = new Array(20).fill(0);

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 7) continue;

      const participant = {
        date: parts[0],
        quizType: parts[1],
        score: parseInt(parts[2]),
        total: parseInt(parts[3]),
        level: parts[4],
        department: parts[5],
        email: parts[6],
        answers: parts.slice(7, 27).map(p => parseInt(p))
      };

      if (participant.quizType === 'cyber') {
        cyber.push(participant);
        cyberDepts[participant.department] = (cyberDepts[participant.department] || 0) + 1;
        participant.answers.forEach((ans, idx) => {
          if (ans !== -1) {
            cyberQTotal[idx]++;
            if (ans === 0) cyberQErrors[idx]++;
          }
        });
      } else if (participant.quizType === 'rgpd') {
        rgpd.push(participant);
        rgpdDepts[participant.department] = (rgpdDepts[participant.department] || 0) + 1;
        participant.answers.forEach((ans, idx) => {
          if (ans !== -1) {
            rgpdQTotal[idx]++;
            if (ans === 0) rgpdQErrors[idx]++;
          }
        });
      }
    }

    // Top 5 questions ratées
    const getTopQuestions = (errors, totals, questions) => {
      return errors.map((err, i) => ({
        question: questions[i],
        errorRate: totals[i] > 0 ? parseFloat(((err / totals[i]) * 100).toFixed(1)) : 0,
        errors: err,
        total: totals[i]
      })).sort((a, b) => b.errorRate - a.errorRate).slice(0, 5);
    };

    res.json({
      cyber,
      rgpd,
      cyberStats: {
        count: cyber.length,
        deptStats: cyberDepts,
        topQuestions: getTopQuestions(cyberQErrors, cyberQTotal, CYBER_QUESTIONS)
      },
      rgpdStats: {
        count: rgpd.length,
        deptStats: rgpdDepts,
        topQuestions: getTopQuestions(rgpdQErrors, rgpdQTotal, RGPD_QUESTIONS)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Export CSV
app.get('/api/export-csv', (req, res) => {
  try {
    const data = fs.readFileSync(RESULTS_FILE, 'utf8');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=quiz-results.csv');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur export' });
  }
});

// Auth admin sécurisée
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Mot de passe incorrect' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
