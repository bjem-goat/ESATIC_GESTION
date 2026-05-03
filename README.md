# 🎓 MBDS — Système de Gestion des Absences

Application web complète pour la gestion des présences et absences étudiantes.

---

## 🚀 Lancement rapide (Docker)

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré

### Démarrer l'application

```bash
# Cloner / décompresser le projet, puis :
cd mbds-gestion-absences

# Lancer tous les services
docker-compose up --build
```

L'application sera disponible sur **http://localhost**

> ⏳ Le premier lancement peut prendre 2-3 minutes (téléchargement des images Docker)

### Arrêter l'application

```bash
docker-compose down
```

### Réinitialiser la base de données

```bash
docker-compose down -v   # supprime les volumes (données)
docker-compose up --build
```

---

## 🔐 Comptes de connexion

| Rôle       | Email                    | Mot de passe |
|------------|--------------------------|--------------|
| Admin      | admin@mbds.ci            | password     |
| Enseignant | j.kouassi@mbds.ci        | password     |
| Enseignant | a.diallo@mbds.ci         | password     |

---

## 📋 Fonctionnalités

### Module Paramétrage
- ✅ Gestion des **filières** (MBDS, INFO, RESEAU, IA...)
- ✅ Gestion des **périodes** d'évaluation (semestres)
- ✅ Gestion des **matières** enseignées
- ✅ Gestion des **enseignants**

### Module Saisie
- ✅ **Inscription des étudiants** avec affectation à une filière
- ✅ **Feuille de présence** par séance (présent / absent / retard)
- ✅ **Traitement des justifications** d'absence (valider / rejeter)

### Module Éditions
- ✅ **Absences par filière et période** avec export CSV
- ✅ **Matières par filière** avec enseignant responsable
- ✅ **Dossier individuel étudiant** avec historique complet

---

## 🏗️ Architecture technique

```
mbds-gestion-absences/
├── docker-compose.yml          # Orchestration des services
├── backend/                    # API REST Node.js + Express
│   ├── Dockerfile
│   ├── server.js               # Point d'entrée
│   ├── init.sql                # Schéma BDD + données de test
│   ├── middleware/auth.js      # JWT
│   └── routes/                 # Un fichier par ressource
│       ├── auth.js
│       ├── filieres.js
│       ├── periodes.js
│       ├── matieres.js
│       ├── enseignants.js
│       ├── etudiants.js
│       ├── enseignements.js
│       ├── presences.js
│       ├── justifications.js
│       └── rapports.js
└── frontend/                   # React + Vite
    ├── Dockerfile
    ├── nginx.conf              # Reverse proxy vers le backend
    └── src/
        ├── App.jsx             # Routing principal
        ├── components/         # Layout, composants UI
        └── pages/
            ├── Dashboard.jsx
            ├── parametrage/    # Filières, Périodes, Matières, Enseignants
            ├── saisie/         # Étudiants, Présences, Justifications
            └── rapports/       # 3 rapports avec export CSV
```

### Services Docker
| Service    | Port   | Description                  |
|------------|--------|------------------------------|
| frontend   | :80    | React (servi par Nginx)      |
| backend    | :3001  | API REST Node.js/Express     |
| postgres   | :5432  | Base de données PostgreSQL   |

---

## 🗄️ Modèle de données

Entités principales :
- **ETUDIANT** : matricule, nom, prénom, sexe, filière
- **ENSEIGNANT** : id, nom, prénom, mail, spécialité, diplôme
- **FILIERE** : code, libellé, nombre d'étudiants
- **MATIERE** : code, nom
- **PERIODE** : id, libellé, dates début/fin
- **ENSEIGNEMENT** : séance de cours (enseignant + matière + filière + période + date)
- **PRESENCE** : statut (présent/absent/retard) d'un étudiant à une séance
- **JUSTIFICATION** : motif + statut de traitement pour une absence

---

## 🛠️ Développement local (sans Docker)

### Backend
```bash
cd backend
npm install
# Créer un .env :
echo "DATABASE_URL=postgresql://mbds_user:mbds_password@localhost:5432/mbds_absences" > .env
echo "JWT_SECRET=mbds_jwt_secret_2024" >> .env
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```
