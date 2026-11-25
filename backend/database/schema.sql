-- Schéma complet pour une installation neuve.
-- Il peut être importé avant ou après auth.sql : les tables d'authentification
-- sont reprises ici avec CREATE TABLE IF NOT EXISTS pour éviter tout conflit.

CREATE TABLE IF NOT EXISTS Utilisateur (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Historique_authentification (
    id_historique BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    action ENUM('account_created', 'login', 'logout') NOT NULL,
    date_action TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_historique_authentification_utilisateur_date (id_utilisateur, date_action),
    CONSTRAINT fk_historique_authentification_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur (id_utilisateur)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Durree_projet (
    id_durre INT NOT NULL AUTO_INCREMENT,
    creation DATETIME NULL,
    limite DATETIME NULL,
    PRIMARY KEY (id_durre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Individu (
    id_individue INT NOT NULL AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL,
    photo_profil BLOB NULL,
    id_utilisateur INT NULL,
    PRIMARY KEY (id_individue),
    UNIQUE KEY uq_individu_utilisateur (id_utilisateur),
    CONSTRAINT fk_individu_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur (id_utilisateur)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les trois statuts sont partagés par les projets et les tâches.
CREATE TABLE IF NOT EXISTS Status_projet (
    id_status INT NOT NULL AUTO_INCREMENT,
    code VARCHAR(30) NOT NULL,
    status VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_status),
    UNIQUE KEY uq_status_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Projet (
    id_projet INT NOT NULL AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT NULL,
    id_status INT NOT NULL,
    id_durre INT NULL,
    id_utilisateur INT NOT NULL,
    PRIMARY KEY (id_projet),
    CONSTRAINT fk_projet_status
        FOREIGN KEY (id_status) REFERENCES Status_projet (id_status),
    CONSTRAINT fk_projet_duree
        FOREIGN KEY (id_durre) REFERENCES Durree_projet (id_durre) ON DELETE SET NULL,
    CONSTRAINT fk_projet_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur (id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Tache (
    id_tache INT NOT NULL AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT NULL,
    id_projet INT NOT NULL,
    id_status INT NOT NULL,
    importance ENUM('Urgente', 'Importante', 'Non importante') NOT NULL DEFAULT 'Non importante',
    PRIMARY KEY (id_tache),
    CONSTRAINT fk_tache_projet
        FOREIGN KEY (id_projet) REFERENCES Projet (id_projet) ON DELETE CASCADE,
    CONSTRAINT fk_tache_status
        FOREIGN KEY (id_status) REFERENCES Status_projet (id_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Une fonction est l'affectation d'une tâche à une personne.
CREATE TABLE IF NOT EXISTS Fonction (
    id_tache INT NOT NULL,
    id_individue INT NOT NULL,
    role VARCHAR(50) NULL,
    PRIMARY KEY (id_tache, id_individue),
    CONSTRAINT fk_fonction_tache
        FOREIGN KEY (id_tache) REFERENCES Tache (id_tache) ON DELETE CASCADE,
    CONSTRAINT fk_fonction_individu
        FOREIGN KEY (id_individue) REFERENCES Individu (id_individue) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Competence (
    id_competenece INT NOT NULL AUTO_INCREMENT,
    nom_competence VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_competenece)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Maitrise (
    id_individue INT NOT NULL,
    id_competenece INT NOT NULL,
    PRIMARY KEY (id_individue, id_competenece),
    CONSTRAINT fk_maitrise_individu
        FOREIGN KEY (id_individue) REFERENCES Individu (id_individue) ON DELETE CASCADE,
    CONSTRAINT fk_maitrise_competence
        FOREIGN KEY (id_competenece) REFERENCES Competence (id_competenece) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Membre (
    id_projet INT NOT NULL,
    id_individue INT NOT NULL,
    role ENUM('chef', 'membre') NOT NULL DEFAULT 'membre',
    PRIMARY KEY (id_projet, id_individue),
    CONSTRAINT fk_membre_projet
        FOREIGN KEY (id_projet) REFERENCES Projet (id_projet) ON DELETE CASCADE,
    CONSTRAINT fk_membre_individu
        FOREIGN KEY (id_individue) REFERENCES Individu (id_individue) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO Status_projet (code, status) VALUES
    ('todo', 'Pas encore commencé'),
    ('in_progress', 'En cours'),
    ('done', 'Fini')
ON DUPLICATE KEY UPDATE status = VALUES(status);
