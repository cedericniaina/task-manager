CREATE TABLE individu(
   id_individu INT AUTO_INCREMENT,
   nom_individu VARCHAR(50) NOT NULL,
   pdp_individu_url VARCHAR(150),
   PRIMARY KEY(id_individu),
   UNIQUE(nom_individu)
);

CREATE TABLE competence(
   id_competenece INT AUTO_INCREMENT,
   nom_competence VARCHAR(50) NOT NULL,
   PRIMARY KEY(id_competenece)
);

-- id_utilisateur est maintenant un INT AUTO_INCREMENT
CREATE TABLE utilisateur(
   id_utilisateur INT AUTO_INCREMENT,
   nom_utilisateur VARCHAR(50) NOT NULL,
   email VARCHAR(50) NOT NULL,
   pdp_utilisateur_url VARCHAR(150),
   mot_de_passe VARCHAR(60) NOT NULL,
   PRIMARY KEY(id_utilisateur),
   UNIQUE(email)
);

CREATE TABLE tag(
   id_tag VARCHAR(50),
   nom_tag VARCHAR(50) NOT NULL,
   PRIMARY KEY(id_tag)
);

-- id_utilisateur a été modifié en INT pour correspondre à la table parent
CREATE TABLE Projet(
   id_projet INT AUTO_INCREMENT,
   nom_projet VARCHAR(50) NOT NULL,
   status_projet VARCHAR(50),
   time_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   deadline DATE,
   description_projet VARCHAR(300),
   id_utilisateur INT NOT NULL,
   PRIMARY KEY(id_projet),
   CONSTRAINT fk_projet_utilisateur FOREIGN KEY(id_utilisateur) REFERENCES utilisateur(id_utilisateur)
);

CREATE TABLE activite(
   id_activite INT AUTO_INCREMENT,
   nom_activite VARCHAR(50) NOT NULL,
   importance_activite VARCHAR(50),
   id_projet INT NOT NULL,
   PRIMARY KEY(id_activite),
   CONSTRAINT fk_activite_projet FOREIGN KEY(id_projet) REFERENCES Projet(id_projet)
);

CREATE TABLE tache(
   id_activite INT,
   id_individu INT,
   status_tache VARCHAR(50),
   PRIMARY KEY(id_activite, id_individu),
   CONSTRAINT fk_tache_activite FOREIGN KEY(id_activite) REFERENCES activite(id_activite),
   CONSTRAINT fk_tache_individu FOREIGN KEY(id_individu) REFERENCES individu(id_individu)
);

CREATE TABLE maitrise(
   id_individu INT,
   id_competenece INT,
   PRIMARY KEY(id_individu, id_competenece),
   CONSTRAINT fk_maitrise_individu FOREIGN KEY(id_individu) REFERENCES individu(id_individu),
   CONSTRAINT fk_maitrise_competence FOREIGN KEY(id_competenece) REFERENCES competence(id_competenece)
);

CREATE TABLE membre(
   id_projet INT,
   id_individu INT,
   PRIMARY KEY(id_projet, id_individu),
   CONSTRAINT fk_membre_projet FOREIGN KEY(id_projet) REFERENCES Projet(id_projet),
   CONSTRAINT fk_membre_individu FOREIGN KEY(id_individu) REFERENCES individu(id_individu)
);

CREATE TABLE projectTag(
   id_projet INT,
   id_tag VARCHAR(50),
   PRIMARY KEY(id_projet, id_tag),
   CONSTRAINT fk_ptag_projet FOREIGN KEY(id_projet) REFERENCES Projet(id_projet),
   CONSTRAINT fk_ptag_tag FOREIGN KEY(id_tag) REFERENCES tag(id_tag)
);

CREATE TABLE activiteTag(
   id_activite INT,
   id_tag VARCHAR(50),
   PRIMARY KEY(id_activite, id_tag),
   CONSTRAINT fk_atag_activite FOREIGN KEY(id_activite) REFERENCES activite(id_activite),
   CONSTRAINT fk_atag_tag FOREIGN KEY(id_tag) REFERENCES tag(id_tag)
);
