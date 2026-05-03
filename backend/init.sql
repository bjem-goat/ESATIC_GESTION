-- =============================================
-- MBDS - Gestion des Absences v3
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE filiere (
    id SERIAL PRIMARY KEY,
    code_filiere VARCHAR(20) UNIQUE NOT NULL,
    libelle_filiere VARCHAR(100) NOT NULL,
    nbre_etud INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE periode (
    id SERIAL PRIMARY KEY,
    id_periode VARCHAR(20) UNIQUE NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE matiere (
    id SERIAL PRIMARY KEY,
    code_matiere VARCHAR(20) UNIQUE NOT NULL,
    nom_matiere VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE enseignant (
    id SERIAL PRIMARY KEY,
    id_enseignant VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    mail VARCHAR(150) UNIQUE NOT NULL,
    specialite VARCHAR(100),
    diplome VARCHAR(100),
    sexe CHAR(1) CHECK (sexe IN ('M', 'F')),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'enseignant',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE etudiant (
    id SERIAL PRIMARY KEY,
    matricule VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    sexe CHAR(1) CHECK (sexe IN ('M', 'F')),
    email VARCHAR(150),
    telephone VARCHAR(20),
    email_parent VARCHAR(150),
    filiere_id INT REFERENCES filiere(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- heures_restantes = volume_horaire au départ, décrémenté à chaque séance créée
CREATE TABLE affectation (
    id SERIAL PRIMARY KEY,
    enseignant_id INT REFERENCES enseignant(id) ON DELETE CASCADE,
    matiere_id INT REFERENCES matiere(id) ON DELETE CASCADE,
    filiere_id INT REFERENCES filiere(id) ON DELETE CASCADE,
    periode_id INT REFERENCES periode(id) ON DELETE CASCADE,
    volume_horaire INT DEFAULT 0,
    heures_restantes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(enseignant_id, matiere_id, filiere_id, periode_id)
);

CREATE TABLE seance (
    id SERIAL PRIMARY KEY,
    affectation_id INT REFERENCES affectation(id) ON DELETE CASCADE,
    date_seance DATE NOT NULL,
    heure_debut VARCHAR(10),
    heure_fin VARCHAR(10),
    duree_heures INT DEFAULT 2,
    demarre BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- heures_absence = nb heures ratées cumulées par cet étudiant (calculé)
CREATE TABLE presence (
    id SERIAL PRIMARY KEY,
    seance_id INT REFERENCES seance(id) ON DELETE CASCADE,
    etudiant_id INT REFERENCES etudiant(id) ON DELETE CASCADE,
    statut VARCHAR(20) CHECK (statut IN ('present', 'absent', 'retard')) DEFAULT 'present',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(seance_id, etudiant_id)
);

CREATE TABLE justification (
    id SERIAL PRIMARY KEY,
    presence_id INT REFERENCES presence(id) ON DELETE CASCADE UNIQUE,
    motif TEXT,
    statut VARCHAR(20) CHECK (statut IN ('en_attente', 'validee', 'rejetee')) DEFAULT 'en_attente',
    date_soumission TIMESTAMP DEFAULT NOW(),
    date_traitement TIMESTAMP
);

-- Table documents pour les profs
CREATE TABLE document (
    id SERIAL PRIMARY KEY,
    enseignant_id INT REFERENCES enseignant(id) ON DELETE CASCADE,
    affectation_id INT REFERENCES affectation(id) ON DELETE SET NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    nom_original VARCHAR(255) NOT NULL,
    taille INT,
    type_mime VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Données de test
INSERT INTO filiere (code_filiere, libelle_filiere, nbre_etud) VALUES
('MBDS','Master Big Data Sciences',30),
('INFO','Informatique Generale',45),
('RESEAU','Reseaux et Telecommunications',25),
('IA','Intelligence Artificielle',20);

INSERT INTO periode (id_periode, libelle, date_debut, date_fin) VALUES
('S1-2024','Semestre 1 - 2024/2025','2024-09-01','2025-01-31'),
('S2-2025','Semestre 2 - 2024/2025','2025-02-01','2025-06-30'),
('S1-2025','Semestre 1 - 2025/2026','2025-09-01','2026-01-31');

INSERT INTO matiere (code_matiere, nom_matiere) VALUES
('BD001','Base de Donnees Avancees'),
('ALGO002','Algorithmique et Complexite'),
('WEB003','Developpement Web'),
('NET004','Reseaux Informatiques'),
('ML005','Machine Learning'),
('SEC006','Securite Informatique'),
('PROJET007','Gestion de Projet');

INSERT INTO admin (nom, prenom, email, password_hash, role) VALUES
('Admin','Systeme','admin@mbds.ci','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin');

INSERT INTO enseignant (id_enseignant, nom, prenom, mail, specialite, diplome, sexe, password_hash) VALUES
('ENS001','KOUASSI','Jean','j.kouassi@mbds.ci','Base de donnees','Doctorat','M','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('ENS002','DIALLO','Aminata','a.diallo@mbds.ci','Intelligence Artificielle','Master','F','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('ENS003','BAMBA','Moussa','m.bamba@mbds.ci','Reseaux','Doctorat','M','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('ENS004','TRAORE','Fatoumata','f.traore@mbds.ci','Web et Mobile','Master','F','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT INTO etudiant (matricule, nom, prenom, sexe, email, telephone, filiere_id) VALUES
('ETU001','COULIBALY','Ibrahim','M','i.coulibaly@etud.mbds.ci','0707070001',1),
('ETU002','NGUESSAN','Marie','F','m.nguessan@etud.mbds.ci','0707070002',1),
('ETU003','KONE','Seydou','M','s.kone@etud.mbds.ci','0707070003',1),
('ETU004','YAPI','Ange','F','a.yapi@etud.mbds.ci','0707070004',1),
('ETU005','DOSSO','Lamine','M','l.dosso@etud.mbds.ci','0707070005',1),
('ETU006','OUATTARA','Chantal','F','c.ouattara@etud.mbds.ci','0707070006',2),
('ETU007','BROU','Patrick','M','p.brou@etud.mbds.ci','0707070007',2),
('ETU008','ZADI','Nathalie','F','n.zadi@etud.mbds.ci','0707070008',2);

-- Affectations avec heures_restantes = volume_horaire
INSERT INTO affectation (enseignant_id, matiere_id, filiere_id, periode_id, volume_horaire, heures_restantes) VALUES
(1,1,1,1,45,45),(1,2,1,1,30,30),(1,1,2,1,45,45),
(2,5,1,1,40,40),(2,5,4,1,40,40),
(3,4,2,1,35,35),(3,4,3,1,35,35),
(4,3,1,1,30,30),(4,3,2,1,30,30);

INSERT INTO seance (affectation_id, date_seance, heure_debut, heure_fin, duree_heures) VALUES
(1,'2024-09-10','08:00','10:00',2),
(1,'2024-09-17','08:00','10:00',2),
(1,'2024-09-24','08:00','10:00',2);

INSERT INTO presence (seance_id, etudiant_id, statut) VALUES
(1,1,'present'),(1,2,'absent'),(1,3,'present'),(1,4,'retard'),(1,5,'absent'),
(2,1,'present'),(2,2,'present'),(2,3,'absent'),(2,4,'present'),(2,5,'absent'),
(3,1,'absent'),(3,2,'present'),(3,3,'present'),(3,4,'present'),(3,5,'retard');

-- Justifications auto pour les absences (en_attente par défaut)
INSERT INTO justification (presence_id, motif, statut) VALUES
(2,'',  'en_attente'),
(5,'',  'en_attente'),
(8,'',  'en_attente'),
(10,'', 'en_attente'),
(11,'', 'en_attente');
