# 🔐 Quiz Cybersécurité - École d'Ingénieurs

Sensibilisez votre personnel avec ce quiz interactif, sécurisé et ludique.

## 🚀 Déploiement

### En local
1. `git clone https://github.com/votre-organisation/cyber-quiz-ecole.git`
2. `cd cyber-quiz-ecole`
3. `npm install`
4. Copiez `.env.example` en `.env` et adaptez si besoin
5. `npm start`
6. Ouvrez :
   - Quiz : http://localhost:3000
   - Admin : http://localhost:3000/admin.html

### En production (Render, Railway, etc.)
- Ajoutez les variables d’environnement (`PORT` est souvent défini automatiquement)
- Le fichier `results.csv` est persisté (sauf sur certains services gratuits → à sauvegarder via backup ou DB)

> 💡 Astuce : sur Render, activez le **disk persistence** pour conserver `results.csv`.

## 🔒 Sécurité
- Les emails ne sont **pas stockés**
- Seuls score, date et niveau sont enregistrés
- Validation côté serveur de l’email (doit finir par `@ecole.fr`)

## 📈 Admin
Accédez à `/admin.html` pour visualiser :
- Répartition des niveaux
- Distribution des scores
- Liste chronologique des participations

---

Développé avec ❤️ pour la cybersécurité dans l’enseignement supérieur.
