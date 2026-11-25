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