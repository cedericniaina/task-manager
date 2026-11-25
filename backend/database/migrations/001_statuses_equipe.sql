-- Migration idempotente : statuts partagés, tâches statutées, projets personnels,
-- affectations et équipes. Peut être exécutée plusieurs fois sans risque.

SET @db := DATABASE();

-- Exécute un DDL en ignorant les erreurs « déjà appliqué » afin que cette
-- migration reste idempotente même quand information_schema masque certaines
-- contraintes à l'utilisateur MySQL.
DROP PROCEDURE IF EXISTS tm_exec_ignore;
DELIMITER //
CREATE PROCEDURE tm_exec_ignore(IN ddl TEXT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    SET @tm_sql = ddl;
    PREPARE tm_stmt FROM @tm_sql;
    EXECUTE tm_stmt;
    DEALLOCATE PREPARE tm_stmt;
END//
DELIMITER ;

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
        FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur (id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- Individu
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Individu ADD COLUMN id_utilisateur INT NULL AFTER photo_profil',
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Individu' AND COLUMN_NAME = 'id_utilisateur');
CALL tm_exec_ignore(@sql);

SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Individu ADD UNIQUE KEY uq_individu_utilisateur (id_utilisateur)',
    'SELECT 1')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Individu' AND INDEX_NAME = 'uq_individu_utilisateur');
CALL tm_exec_ignore(@sql);

SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Individu ADD CONSTRAINT fk_individu_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur (id_utilisateur) ON DELETE SET NULL',
    'SELECT 1')
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Individu' AND CONSTRAINT_NAME = 'fk_individu_utilisateur');
CALL tm_exec_ignore(@sql);

-- ------------------------------------------------------------------ Statuts
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Status_projet ADD COLUMN code VARCHAR(30) NULL AFTER id_status',
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Status_projet' AND COLUMN_NAME = 'code');
CALL tm_exec_ignore(@sql);

UPDATE Status_projet
SET code = CASE
    WHEN status IN ('À faire', 'A faire', 'Pas encore commencé', 'Pas encore commencee', 'todo') THEN 'todo'
    WHEN status IN ('En cours', 'en cours', 'in_progress', 'encours') THEN 'in_progress'
    WHEN status IN ('Fini', 'Terminé', 'Termine', 'Fait', 'done') THEN 'done'
    ELSE LOWER(REPLACE(TRIM(status), ' ', '_'))
END
WHERE code IS NULL OR code = '';

UPDATE Status_projet
SET status = CASE code
    WHEN 'todo' THEN 'Pas encore commencé'
    WHEN 'in_progress' THEN 'En cours'
    WHEN 'done' THEN 'Fini'
    ELSE status
END;

-- Fusionne d'éventuels doublons de statuts en conservant le plus ancien.
UPDATE Projet p
JOIN Status_projet old ON old.id_status = p.id_status
JOIN Status_projet kept ON kept.code = old.code AND kept.id_status < old.id_status
SET p.id_status = kept.id_status;

DELETE old FROM Status_projet old
JOIN Status_projet kept ON kept.code = old.code AND kept.id_status < old.id_status;

-- ----------------------------------------------------- Durée propre au projet
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Projet ADD COLUMN id_durre INT NULL AFTER id_status',
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Projet' AND COLUMN_NAME = 'id_durre');
CALL tm_exec_ignore(@sql);

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Status_projet' AND COLUMN_NAME = 'id_durre') > 0,
    'UPDATE Projet p JOIN Status_projet s ON s.id_status = p.id_status SET p.id_durre = s.id_durre WHERE p.id_durre IS NULL AND s.id_durre IS NOT NULL',
    'SELECT 1');
CALL tm_exec_ignore(@sql);

SET @sql = 'ALTER TABLE Status_projet DROP FOREIGN KEY fk_status_projet_duree';
CALL tm_exec_ignore(@sql);
SET @sql = 'ALTER TABLE Status_projet DROP KEY fk_status_projet_duree';
CALL tm_exec_ignore(@sql);

SET @sql = (SELECT IF(COUNT(*) > 0,
    'ALTER TABLE Status_projet DROP COLUMN id_durre',
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Status_projet' AND COLUMN_NAME = 'id_durre');
CALL tm_exec_ignore(@sql);

SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Projet ADD CONSTRAINT fk_projet_duree FOREIGN KEY (id_durre) REFERENCES Durree_projet (id_durre) ON DELETE SET NULL',
    'SELECT 1')
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Projet' AND CONSTRAINT_NAME = 'fk_projet_duree');
CALL tm_exec_ignore(@sql);

INSERT INTO Status_projet (code, status)
SELECT 'todo', 'Pas encore commencé'
WHERE NOT EXISTS (SELECT 1 FROM Status_projet WHERE code = 'todo');
INSERT INTO Status_projet (code, status)
SELECT 'in_progress', 'En cours'
WHERE NOT EXISTS (SELECT 1 FROM Status_projet WHERE code = 'in_progress');
INSERT INTO Status_projet (code, status)
SELECT 'done', 'Fini'
WHERE NOT EXISTS (SELECT 1 FROM Status_projet WHERE code = 'done');

SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Status_projet ADD UNIQUE KEY uq_status_code (code)',
    'SELECT 1')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Status_projet' AND INDEX_NAME = 'uq_status_code');
CALL tm_exec_ignore(@sql);

SET @sql = 'ALTER TABLE Status_projet MODIFY code VARCHAR(30) NOT NULL';
CALL tm_exec_ignore(@sql);

-- -------------------------------------------------------- Projet / propriétaire
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Projet ADD COLUMN description TEXT NULL AFTER nom',
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Projet' AND COLUMN_NAME = 'description');
CALL tm_exec_ignore(@sql);

SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Projet ADD COLUMN id_utilisateur INT NULL AFTER id_durre',
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Projet' AND COLUMN_NAME = 'id_utilisateur');
CALL tm_exec_ignore(@sql);

UPDATE Projet
SET id_utilisateur = (SELECT MIN(id_utilisateur) FROM Utilisateur)
WHERE id_utilisateur IS NULL;

SET @can_enforce_owner := (SELECT COUNT(*) FROM Projet WHERE id_utilisateur IS NULL) = 0;
SET @sql = IF(@can_enforce_owner, 'ALTER TABLE Projet MODIFY id_utilisateur INT NOT NULL', 'SELECT 1');
CALL tm_exec_ignore(@sql);

SET @sql = IF(@can_enforce_owner AND (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Projet' AND CONSTRAINT_NAME = 'fk_projet_utilisateur') = 0,
    'ALTER TABLE Projet ADD CONSTRAINT fk_projet_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur (id_utilisateur) ON DELETE CASCADE',
    'SELECT 1');
CALL tm_exec_ignore(@sql);

-- ---------------------------------------------------------------- Personnes
INSERT INTO Individu (nom, id_utilisateur)
SELECT u.nom, u.id_utilisateur
FROM Utilisateur u
LEFT JOIN Individu i ON i.id_utilisateur = u.id_utilisateur
WHERE i.id_individue IS NULL;

-- --------------------------------------------------------------------- Tâches
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Tache ADD COLUMN description TEXT NULL AFTER nom',
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Tache' AND COLUMN_NAME = 'description');
CALL tm_exec_ignore(@sql);

SET @sql = (SELECT IF(COUNT(*) = 0,
    "ALTER TABLE Tache ADD COLUMN importance ENUM('Urgente', 'Importante', 'Non importante') NOT NULL DEFAULT 'Non importante' AFTER id_projet",
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Tache' AND COLUMN_NAME = 'importance');
CALL tm_exec_ignore(@sql);

UPDATE Tache SET importance = 'Non importante' WHERE importance IS NULL OR importance = '';

SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Tache ADD COLUMN id_status INT NULL AFTER importance',
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Tache' AND COLUMN_NAME = 'id_status');
CALL tm_exec_ignore(@sql);

SET @todo_status := (SELECT id_status FROM Status_projet WHERE code = 'todo' ORDER BY id_status LIMIT 1);
UPDATE Tache SET id_status = @todo_status WHERE id_status IS NULL;

SET @sql = 'ALTER TABLE Tache MODIFY id_status INT NOT NULL';
CALL tm_exec_ignore(@sql);

SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Tache ADD CONSTRAINT fk_tache_status FOREIGN KEY (id_status) REFERENCES Status_projet (id_status)',
    'SELECT 1')
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Tache' AND CONSTRAINT_NAME = 'fk_tache_status');
CALL tm_exec_ignore(@sql);

-- --------------------------------------------------------------- Affectations
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE Fonction ADD COLUMN role VARCHAR(50) NULL AFTER id_individue',
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Fonction' AND COLUMN_NAME = 'role');
CALL tm_exec_ignore(@sql);

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Fonction' AND COLUMN_NAME = 'status') > 0,
    'UPDATE Fonction SET role = status WHERE role IS NULL AND status IS NOT NULL',
    'SELECT 1');
CALL tm_exec_ignore(@sql);
UPDATE Fonction SET role = 'Membre' WHERE role IS NULL OR role = '';

SET @sql = (SELECT IF(COUNT(*) > 0, 'ALTER TABLE Fonction DROP COLUMN status', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Fonction' AND COLUMN_NAME = 'status');
CALL tm_exec_ignore(@sql);

-- --------------------------------------------------------------------- Équipe
SET @sql = (SELECT IF(COUNT(*) = 0,
    "ALTER TABLE Membre ADD COLUMN role ENUM('chef', 'membre') NOT NULL DEFAULT 'membre' AFTER id_individue",
    'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Membre' AND COLUMN_NAME = 'role');
CALL tm_exec_ignore(@sql);

INSERT INTO Membre (id_projet, id_individue, role)
SELECT p.id_projet, i.id_individue, 'chef'
FROM Projet p
JOIN Individu i ON i.id_utilisateur = p.id_utilisateur
WHERE NOT EXISTS (
    SELECT 1 FROM Membre m WHERE m.id_projet = p.id_projet AND m.id_individue = i.id_individue
);

-- -------------------------------------------------- Suppressions en cascade
-- Les anciennes contraintes bloquaient la suppression d'un projet ou d'une tâche.
SET @sql = 'ALTER TABLE Tache DROP FOREIGN KEY fk_tache_projet';
CALL tm_exec_ignore(@sql);
SET @sql = 'ALTER TABLE Tache ADD CONSTRAINT fk_tache_projet FOREIGN KEY (id_projet) REFERENCES Projet (id_projet) ON DELETE CASCADE';
CALL tm_exec_ignore(@sql);

SET @sql = 'ALTER TABLE Fonction DROP FOREIGN KEY fk_fonction_tache';
CALL tm_exec_ignore(@sql);
SET @sql = 'ALTER TABLE Fonction ADD CONSTRAINT fk_fonction_tache FOREIGN KEY (id_tache) REFERENCES Tache (id_tache) ON DELETE CASCADE';
CALL tm_exec_ignore(@sql);

SET @sql = 'ALTER TABLE Fonction DROP FOREIGN KEY fk_fonction_individu';
CALL tm_exec_ignore(@sql);
SET @sql = 'ALTER TABLE Fonction ADD CONSTRAINT fk_fonction_individu FOREIGN KEY (id_individue) REFERENCES Individu (id_individue) ON DELETE CASCADE';
CALL tm_exec_ignore(@sql);

SET @sql = 'ALTER TABLE Membre DROP FOREIGN KEY fk_membre_projet';
CALL tm_exec_ignore(@sql);
SET @sql = 'ALTER TABLE Membre ADD CONSTRAINT fk_membre_projet FOREIGN KEY (id_projet) REFERENCES Projet (id_projet) ON DELETE CASCADE';
CALL tm_exec_ignore(@sql);

SET @sql = 'ALTER TABLE Membre DROP FOREIGN KEY fk_membre_individu';
CALL tm_exec_ignore(@sql);
SET @sql = 'ALTER TABLE Membre ADD CONSTRAINT fk_membre_individu FOREIGN KEY (id_individue) REFERENCES Individu (id_individue) ON DELETE CASCADE';
CALL tm_exec_ignore(@sql);

SET @sql = 'ALTER TABLE Maitrise DROP FOREIGN KEY fk_maitrise_individu';
CALL tm_exec_ignore(@sql);
SET @sql = 'ALTER TABLE Maitrise ADD CONSTRAINT fk_maitrise_individu FOREIGN KEY (id_individue) REFERENCES Individu (id_individue) ON DELETE CASCADE';
CALL tm_exec_ignore(@sql);

SET @sql = 'ALTER TABLE Maitrise DROP FOREIGN KEY fk_maitrise_competence';
CALL tm_exec_ignore(@sql);
SET @sql = 'ALTER TABLE Maitrise ADD CONSTRAINT fk_maitrise_competence FOREIGN KEY (id_competenece) REFERENCES Competence (id_competenece) ON DELETE CASCADE';
CALL tm_exec_ignore(@sql);

DROP PROCEDURE IF EXISTS tm_exec_ignore;
