# Task Manager

Application web de gestion de projets et de tâches, en groupe ou en solo. Les projets et les tâches ont chacun l’un des statuts suivants : **Pas encore commencé**, **En cours**, **Fini**.

- `frontend/` : interface React + Vite + Tailwind
- `backend/` : API PHP, schéma MySQL et migration

## Démarrage rapide

1. Créez la base `TaskManager-Project-MPD`, puis importez `backend/database/schema.sql` et `backend/database/auth.sql`.
2. Créez `backend/.env` avec `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` et `DB_PASSWORD`.
3. Lancez l’API depuis la racine du projet :

   ```sh
   php -S 127.0.0.1:8000 -t backend/public backend/public/index.php
   ```

4. Lancez l’interface dans un second terminal :

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

5. Ouvrez l’URL indiquée par Vite (en général `http://localhost:5173`) et créez le compte initial.

Si vous mettez à jour une base déjà utilisée, importez `backend/database/migrations/001_statuses_equipe.sql` après l’avoir sauvegardée. La migration est idempotente.

Voir [`backend/README`](backend/README) pour le modèle de données, les endpoints et les commandes de vérification.
