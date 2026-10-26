INSERT INTO tag (nom_tag) VALUES
('Urgent'),
('Développement'),
('Design'),
('Correctif'),
('Optimisation');

INSERT INTO utilisateur (nom_utilisateur, email, pdp_utilisateur_url, mot_de_passe) VALUES
('test', 'test@gmail.com', NULL, '0000');

INSERT INTO individu (nom_individu, pdp_individu_url) VALUES
('Jean Dupont', NULL),
('Alice Martin', NULL),
('Thomas Durand', NULL);

INSERT INTO competence (nom_competence) VALUES
('Développement Web'),
('Design UI/UX');

INSERT INTO Projet (nom_projet, status_projet, deadline, description_projet, id_utilisateur) VALUES
('Refonte Site Web V2', 'En cours', '2026-12-31', 'Projet test de migration.', 1);

INSERT INTO activite (nom_activite, importance_activite, id_projet) VALUES
('Maquettage Figma', 'Haute', 1),
('Développement Backend API', 'Critique', 1);

INSERT INTO membre (id_projet, id_individu) VALUES
(1, 1), 
(1, 2); 

INSERT INTO maitrise (id_individu, id_competenece) VALUES
(1, 1), 
(2, 2); 

INSERT INTO tache (id_activite, id_individu, status_tache) VALUES
(1, 2, 'Terminé'),    
(2, 1, 'En cours');   

INSERT INTO projectTag (id_projet, id_tag) VALUES
(1, 2), 
(1, 3);

INSERT INTO activiteTag (id_activite, id_tag) VALUES
(1, 3), 
(2, 2), 
(2, 1); 
