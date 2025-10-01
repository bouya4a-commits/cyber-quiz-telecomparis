require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS_FILE = path.join(__dirname, 'results.csv');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Questions Cybersécurité (20)
const CYBER_QUESTIONS = [
  { q: "Quelle est la meilleure pratique pour un mot de passe ?", a: ["Utiliser le même partout", "Ajouter des chiffres aléatoires", "Utiliser une phrase secrète longue et unique", "Écrire sur un post-it"], correct: 2 },
  { q: "Que faire si vous recevez un email suspect ?", a: ["L’ouvrir", "Le transférer", "Le supprimer sans l’ouvrir", "Répondre"], correct: 2 },
  { q: "Qu’est-ce que le phishing ?", a: ["Un virus", "Une pêche numérique", "Une tentative de vol d’identifiants", "Un logiciel de sauvegarde"], correct: 2 },
  { q: "Faut-il mettre à jour ses logiciels ?", a: ["Non", "Seulement les payants", "Oui, pour corriger les failles", "Uniquement si l’IT le demande"], correct: 2 },
  { q: "Que faire en quittant votre poste ?", a: ["Verrouiller l’écran", "Laisser allumé", "Débrancher le câble", "Rien"], correct: 0 },
  { q: "Qu’est-ce qu’un VPN ?", a: ["Un antivirus", "Un réseau privé virtuel sécurisé", "Un type de mot de passe", "Un outil de piratage"], correct: 1 },
  { q: "Est-il sécurisé d’utiliser une clé USB trouvée ?", a: ["Oui, si propre", "Non, risque de malware", "Oui, après formatage", "Seulement si petite"], correct: 1 },
  { q: "Quel est le risque principal du Wi-Fi public ?", a: ["Connexion lente", "Vol de données en clair", "Perte de batterie", "Publicité"], correct: 1 },
  { q: "Que signifie 2FA ?", a: ["Deux fichiers", "Authentification à deux facteurs", "Format sécurisé", "Double antivirus"], correct: 1 },
  { q: "Qui contacter en cas de cyberattaque ?", a: ["Personne", "Un ami", "Le service informatique", "Google"], correct: 2 },
  { q: "Qu’est-ce qu’un ransomware ?", a: ["Un virus qui chiffre vos fichiers", "Un logiciel de sauvegarde", "Un pare-feu", "Un outil de cryptomonnaie"], correct: 0 },
  { q: "Pourquoi utiliser un gestionnaire de mots de passe ?", a: ["Pour se souvenir de tous ses mots de passe", "Pour générer des mots de passe forts", "Pour stocker ses mots de passe de façon sécurisée", "Toutes ces réponses"], correct: 3 },
  { q: "Qu’est-ce qu’une sauvegarde ?", a: ["Une copie de sécurité de vos données", "Un antivirus", "Un disque dur externe", "Un logiciel de nettoyage"], correct: 0 },
  { q: "Que faire si votre ordinateur est lent et affiche des pubs ?", a: ["Ignorer", "Installer un antivirus", "Contacter le service IT", "Redémarrer"], correct: 2 },
  { q: "Qu’est-ce qu’un pare-feu ?", a: ["Un antivirus", "Un mur physique", "Un système qui filtre le trafic réseau", "Un mot de passe"], correct: 2 },
  { q: "Pourquoi ne pas cliquer sur les liens dans les SMS inconnus ?", a: ["C'est illégal", "Risque de phishing", "Ça coûte cher", "C'est interdit par l'école"], correct: 1 },
  { q: "Qu’est-ce qu’une authentification biométrique ?", a: ["Mot de passe complexe", "Reconnaissance par empreinte digitale", "Carte d'accès", "Code SMS"], correct: 1 },
  { q: "Que faire si vous perdez votre badge d’accès ?", a: ["Rien", "En informer le service sécurité", "En fabriquer un nouveau", "Utiliser celui d'un collègue"], correct: 1 },
  { q: "Pourquoi chiffrer ses données ?", a: ["Pour les rendre plus rapides", "Pour les protéger contre les accès non autorisés", "Pour économiser de l'espace", "Pour les partager facilement"], correct: 1 },
  { q: "Qu’est-ce qu’une politique de sécurité ?", a: ["Un document qui définit les règles de sécurité", "Un logiciel antivirus", "Une formation obligatoire", "Un mot de passe"], correct: 0 }
];

// Questions RGPD (20)
const RGPD_QUESTIONS = [
  { q: "Qu’est-ce que le RGPD ?", a: ["Un règlement européen sur la protection des données", "Une loi française", "Un logiciel de sécurité", "Un type de contrat"], correct: 0 },
  { q: "Qui est le Délégué à la Protection des Données (DPO) ?", a: ["Un avocat", "Une personne chargée de veiller au respect du RGPD", "Le directeur informatique", "Un consultant externe"], correct: 1 },
  { q: "Quand faut-il obtenir le consentement ?", a: ["Toujours", "Quand on traite des données sensibles", "Quand la loi l'exige", "Dans la plupart des cas de traitement"], correct: 3 },
  { q: "Que faire en cas de fuite de données ?", a: ["Rien", "Avertir la CNIL sous 72h", "Supprimer les données", "Changer de mot de passe"], correct: 1 },
  { q: "Combien de temps conserver les données ?", a: ["À vie", "Le temps nécessaire à la finalité", "5 ans", "10 ans"], correct: 1 },
  { q: "Qu’est-ce qu’une donnée à caractère personnel ?", a: ["Nom, prénom, email", "Adresse IP", "Photo", "Toutes ces réponses"], correct: 3 },
  { q: "Peut-on transférer des données hors UE ?", a: ["Jamais", "Oui, avec des garanties", "Seulement vers les USA", "Oui, librement"], correct: 1 },
  { q: "Quels sont les droits des personnes ?", a: ["Accès, rectification, effacement", "Portabilité", "Opposition", "Tous ces droits"], correct: 3 },
  { q: "Qu’est-ce qu’un registre des traitements ?", a: ["Un document obligatoire listant les traitements", "Un logiciel de gestion", "Un registre papier", "Un fichier Excel"], correct: 0 },
  { q: "Qui est responsable du traitement ?", a: ["Le sous-traitant", "Le DPO", "Le responsable du traitement", "La CNIL"], correct: 2 },
  { q: "Qu’est-ce qu’une analyse d’impact (AIPD) ?", a: ["Une étude des risques liés au traitement", "Un audit financier", "Une formation", "Un logiciel"], correct: 0 },
  { q: "Faut-il informer les personnes ?", a: ["Non", "Oui, sur la finalité du traitement", "Seulement si elles le demandent", "Oui, mais pas toujours"], correct: 1 },
  { q: "Peut-on photographier des étudiants ?", a: ["Oui, librement", "Non, jamais", "Oui, avec leur consentement", "Oui, pour des raisons pédagogiques"], correct: 2 },
  { q: "Que faire avec les CV reçus ?", a: ["Les conserver indéfiniment", "Les détruire après 2 ans", "Les partager avec d'autres services", "Les archiver sans limite"], correct: 1 },
  { q: "Peut-on partager des listes de diffusion ?", a: ["Oui, librement", "Non, sans consentement", "Oui, si c'est interne", "Oui, pour les anciens élèves"], correct: 1 },
  { q: "Qu’est-ce qu’une sous-traitance ?", a: ["Un prestataire qui traite des données", "Un contrat de travail", "Une formation externe", "Un logiciel cloud"], correct: 0 },
  { q: "Faut-il former les personnels ?", a: ["Non", "Oui, c'est obligatoire", "Seulement l'IT", "Oui, fortement recommandé"], correct: 1 },
  { q: "Que faire des anciens dossiers papier ?", a: ["Les jeter", "Les numériser et détruire", "Les conserver selon la durée légale", "Les donner aux archives"], correct: 2 },
  { q: "Peut-on publier des photos d’événements ?", a: ["Oui, toujours", "Non, jamais", "Oui, avec autorisation", "Oui, si floutées"], correct: 2 },
  { q: "Qu’est-ce qu’une violation de données ?", a: ["Perte, altération, divulgation non autorisée", "Un virus", "Une panne informatique", "Une erreur de saisie"], correct: 0 }
];

// Configuration par défaut
const DEFAULT_CONFIG = {
  emailDomains: ['telecom-paris.fr', 'imt.fr'],
  departments: ['Administration', 'Recherche', 'Enseignement', 'IT', 'Autre']
};

// Charger ou créer la config
let config = DEFAULT_CONFIG;
if (fs.existsSync(CONFIG_FILE)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE));
  } catch (e) {
    console.warn('Config invalide, utilisation des valeurs par défaut');
  }
} else {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Créer results.csv si absent
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
app.use('/assets', express.static('assets'));

// === ROUTES UTILISATEURS ===
app.post('/api/submit-quiz', (req, res) => {
  const { email, department, score, total, answers, quizType } = req.body;

  // Validation email
  const allowedDomains = config.emailDomains || ['telecom-paris.fr', 'imt.fr'];
  const emailDomain = email ? email.split('@')[1] : null;
  if (!emailDomain || !allowedDomains.some(d => 
    emailDomain === d || emailDomain.endsWith('.' + d)
  )) {
    return res.status(400).json({ error: 'Email non autorisé' });
  }

  if (!department || !quizType || typeof score !== 'number' || !Array.isArray(answers)) {
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

// === ROUTES ADMIN ===
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Mot de passe incorrect' });
  }
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
        topQuestions: getTopQuestions(cyberQErrors, cyberQTotal, CYBER_QUESTIONS.map(q => q.q))
      },
      rgpdStats: {
        count: rgpd.length,
        deptStats: rgpdDepts,
        topQuestions: getTopQuestions(rgpdQErrors, rgpdQTotal, RGPD_QUESTIONS.map(q => q.q))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Export CSV filtré
app.get('/api/export-csv', (req, res) => {
  try {
    const { quizType, filename = 'quiz-results.csv' } = req.query;
    const data = fs.readFileSync(RESULTS_FILE, 'utf8');
    const lines = data.split('\n');
    
    if (!quizType || quizType === 'all') {
      sendCsv(res, data, filename);
      return;
    }

    const header = lines[0];
    const filteredLines = [header];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith(quizType + ',')) {
        filteredLines.push(lines[i]);
      }
    }
    
    sendCsv(res, filteredLines.join('\n'), filename);
  } catch (err) {
    console.error('Erreur export CSV:', err);
    res.status(500).json({ error: 'Erreur export' });
  }
});

function sendCsv(res, csvData, filename) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvData);
}

// === API CONFIGURATION ===
app.get('/api/config', (req, res) => {
  res.json(config);
});

app.post('/api/config', (req, res) => {
  const { emailDomains } = req.body;
  if (Array.isArray(emailDomains)) {
    config.emailDomains = emailDomains.slice(0, 5).filter(d => d.trim());
    saveConfig();
  }
  res.json({ success: true });
});

app.get('/api/config/departments', (req, res) => {
  res.json(config.departments);
});

app.post('/api/config/departments', (req, res) => {
  const { department } = req.body;
  if (department && !config.departments.includes(department)) {
    config.departments.push(department);
    saveConfig();
  }
  res.json({ success: true });
});

app.delete('/api/config/departments', (req, res) => {
  const index = parseInt(req.query.index);
  if (!isNaN(index) && index >= 0 && index < config.departments.length) {
    config.departments.splice(index, 1);
    saveConfig();
  }
  res.json({ success: true });
});

app.get('/api/config/questions', (req, res) => {
  res.json({
    cyber: CYBER_QUESTIONS,
    rgpd: RGPD_QUESTIONS
  });
});

app.post('/api/config/questions', (req, res) => {
  const { quizType, question, answers, correct } = req.body;
  const newQuestion = { q: question, a: answers, correct };
  
  if (quizType === 'cyber') {
    CYBER_QUESTIONS.push(newQuestion);
  } else if (quizType === 'rgpd') {
    RGPD_QUESTIONS.push(newQuestion);
  }
  
  res.json({ success: true });
});

app.delete('/api/config/questions', (req, res) => {
  const { quizType, index } = req.query;
  const idx = parseInt(index);
  
  if (quizType === 'cyber' && idx >= 0 && idx < CYBER_QUESTIONS.length) {
    CYBER_QUESTIONS.splice(idx, 1);
  } else if (quizType === 'rgpd' && idx >= 0 && idx < RGPD_QUESTIONS.length) {
    RGPD_QUESTIONS.splice(idx, 1);
  }
  
  res.json({ success: true });
});

// Réinitialisation des stats
app.post('/api/reset-stats', (req, res) => {
  const header = fs.readFileSync(RESULTS_FILE, 'utf8').split('\n')[0];
  fs.writeFileSync(RESULTS_FILE, header + '\n');
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
