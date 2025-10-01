## 📁 Structure du projet

```markdown


cyber-quiz-telecomparis/
├── public/
│   ├── index.html             ← Quiz utilisateur
│   ├── admin-login.html       ← Login admin
│   └── admin-dashboard.html   ← Interface admin (statistiques)
├── assets/
│   └── logo.png               ← Logo personnalisable
├── server.js                  ← Backend avec routes sécurisées
├── config.json                ← Config: logo, credentials admin
├── results.csv                ← Résultats (email partiellement anonymisé)
├── package.json               ← Dépendances et scripts
├── .gitignore                 ← Fichiers exclus de Git
├── .env.example               ← Exemple de variables d'environnement
└── README.md                  ← Ce fichier

```



# 🔐 Quiz Cybersécurité - Télécom Paris

Pour sensibiliser Télécom Paris avec un quiz interactif, sécurisé et ludique.

## 🚀 Déploiement

### En local
1. `git clone https://github.com/votre-organisation/cyber-quiz-telecomparis.git`
2. `cd cyber-quiz-telecomparis`
3. `npm install`
4. Copier `.env.example` en `.env.mail`et l'adapter au besoin
5. `npm install nodemailer`
6. `npm install dotenv`
7. `npm start`
8. Ouvrir :
   - Quiz : http://localhost:3000
   - Admin : http://localhost:3000/admin.html

### En production (Render, Railway, etc.)
- Ajouter les variables d’environnement (`PORT` est souvent défini automatiquement)
- Le fichier `results.csv` est persisté (sauf sur certains services gratuits → à sauvegarder via backup ou DB)

> 💡 Si besoin, activer le **disk persistence** pour conserver `results.csv`.

## 🔒 Sécurité
- Les emails ne sont **pas stockés**
- Seuls score, date et niveau sont enregistrés
- Validation côté serveur de l’email (doit finir par `@xxxx.fr`)

## 📈 Admin
Accédez à `/admin.html` pour visualiser :
- Répartition des niveaux
- Distribution des scores
- Liste chronologique des participations

## ajout crypt

npm install bcrypt


---

Développé avec ❤️ pour la cybersécurité pour TP/IMT.
