<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function requireMethod(string $expected): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $expected) {
        header('Allow: ' . $expected);
        respond(405, ['error' => 'Méthode HTTP non autorisée.']);
    }
}

function requestBody(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $payload = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($payload) || array_is_list($payload)) {
        respond(400, ['error' => 'Le corps doit être un objet JSON.']);
    }
    return $payload;
}

function textField(array $payload, string $key, int $maxLength, bool $required = false): ?string
{
    $value = trim((string) ($payload[$key] ?? ''));
    if ($required && $value === '') {
        respond(400, ['error' => 'Le champ « ' . $key . ' » est obligatoire.']);
    }
    if (function_exists('mb_strlen') && mb_strlen($value) > $maxLength) {
        respond(400, ['error' => 'Le champ « ' . $key . ' » est trop long.']);
    }
    return $value === '' ? null : $value;
}

function positiveInt(mixed $value, string $label): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) {
        respond(400, ['error' => 'Identifiant invalide pour ' . $label . '.']);
    }
    return (int) $id;
}

function nullableDatetime(mixed $value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_string($value)) {
        respond(400, ['error' => 'La date limite est invalide.']);
    }
    $value = str_replace('T', ' ', $value);
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        $value .= ' 00:00:00';
    }
    $date = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $value);
    if ($date === false || $date->format('Y-m-d H:i:s') !== $value) {
        respond(400, ['error' => 'La date limite doit être au format AAAA-MM-JJ.']);
    }
    return $value;
}

function idList(mixed $value): array
{
    if ($value === null) {
        return [];
    }
    if (!is_array($value)) {
        respond(400, ['error' => 'La liste des personnes est invalide.']);
    }
    $ids = [];
    foreach ($value as $item) {
        $id = filter_var($item, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($id !== false) {
            $ids[(int) $id] = (int) $id;
        }
    }
    return array_values($ids);
}

function fetchRow(PDO $pdo, string $sql, array $parameters = []): ?array
{
    $statement = $pdo->prepare($sql);
    $statement->execute($parameters);
    $row = $statement->fetch();
    return $row === false ? null : $row;
}

function ensureIndividual(PDO $pdo, int $userId): int
{
    $individual = fetchRow($pdo, 'SELECT id_individue FROM Individu WHERE id_utilisateur = :id LIMIT 1', [':id' => $userId]);
    if ($individual !== null) {
        return (int) $individual['id_individue'];
    }
    $user = fetchRow($pdo, 'SELECT nom FROM Utilisateur WHERE id_utilisateur = :id', [':id' => $userId]);
    $statement = $pdo->prepare('INSERT INTO Individu (nom, id_utilisateur) VALUES (:nom, :id)');
    $statement->execute([':nom' => $user['nom'] ?? 'Utilisateur', ':id' => $userId]);
    return (int) $pdo->lastInsertId();
}

function projectRow(PDO $pdo, int $projectId): ?array
{
    return fetchRow($pdo, 'SELECT * FROM Projet WHERE id_projet = :id', [':id' => $projectId]);
}

function canAccessProject(PDO $pdo, int $userId, int $individualId, int $projectId): bool
{
    $project = projectRow($pdo, $projectId);
    if ($project === null) {
        return false;
    }
    if ((int) $project['id_utilisateur'] === $userId) {
        return true;
    }
    $membership = fetchRow(
        $pdo,
        'SELECT 1 FROM Membre WHERE id_projet = :project AND id_individue = :individual',
        [':project' => $projectId, ':individual' => $individualId]
    );
    return $membership !== null;
}

function requireProjectOwner(PDO $pdo, int $userId, int $projectId): array
{
    $project = fetchRow(
        $pdo,
        'SELECT * FROM Projet WHERE id_projet = :id AND id_utilisateur = :owner',
        [':id' => $projectId, ':owner' => $userId]
    );
    if ($project === null) {
        respond(404, ['error' => 'Projet introuvable ou accès refusé.']);
    }
    return $project;
}

function requireProjectAccess(PDO $pdo, int $userId, int $individualId, int $projectId): array
{
    if (!canAccessProject($pdo, $userId, $individualId, $projectId)) {
        respond(404, ['error' => 'Projet introuvable ou accès refusé.']);
    }
    return projectRow($pdo, $projectId) ?? [];
}

function taskRow(PDO $pdo, int $taskId): ?array
{
    return fetchRow($pdo, 'SELECT * FROM Tache WHERE id_tache = :id', [':id' => $taskId]);
}

function requireTaskAccess(PDO $pdo, int $userId, int $individualId, int $taskId): array
{
    $task = taskRow($pdo, $taskId);
    if ($task === null || !canAccessProject($pdo, $userId, $individualId, (int) $task['id_projet'])) {
        respond(404, ['error' => 'Tâche introuvable ou accès refusé.']);
    }
    return $task;
}

function statusExists(PDO $pdo, int $statusId): bool
{
    return fetchRow($pdo, 'SELECT 1 FROM Status_projet WHERE id_status = :id', [':id' => $statusId]) !== null;
}

function defaultStatusId(PDO $pdo): int
{
    $status = fetchRow($pdo, "SELECT id_status FROM Status_projet WHERE code = 'todo' ORDER BY id_status LIMIT 1");
    if ($status === null) {
        respond(500, ['error' => 'Les statuts par défaut sont absents. Importez database/schema.sql.']);
    }
    return (int) $status['id_status'];
}

function projectScope(): string
{
    return '(id_utilisateur = :scope_user OR id_projet IN '
        . '(SELECT id_projet FROM Membre WHERE id_individue = :scope_individual))';
}

function taskScope(): string
{
    return 'id_projet IN (SELECT id_projet FROM Projet WHERE '
        . projectScope() . ')';
}

$resources = [
    'durations' => [
        'table' => 'Durree_projet',
        'keys' => ['id_durre'],
        'fields' => ['creation', 'limite'],
    ],
    'individuals' => [
        'table' => 'Individu',
        'keys' => ['id_individue'],
        'fields' => ['nom', 'photo_profil', 'id_utilisateur'],
    ],
    'competencies' => [
        'table' => 'Competence',
        'keys' => ['id_competenece'],
        'fields' => ['nom_competence'],
    ],
    'statuses' => [
        'table' => 'Status_projet',
        'keys' => ['id_status'],
        'fields' => ['code', 'status'],
    ],
    'projects' => [
        'table' => 'Projet',
        'keys' => ['id_projet'],
        'fields' => ['nom', 'description', 'id_status', 'id_durre', 'id_utilisateur'],
    ],
    'tasks' => [
        'table' => 'Tache',
        'keys' => ['id_tache'],
        'fields' => ['nom', 'description', 'id_projet', 'id_status', 'importance'],
    ],
    'functions' => [
        'table' => 'Fonction',
        'keys' => ['id_tache', 'id_individue'],
        'fields' => ['role'],
    ],
    'masteries' => [
        'table' => 'Maitrise',
        'keys' => ['id_individue', 'id_competenece'],
        'fields' => [],
    ],
    'members' => [
        'table' => 'Membre',
        'keys' => ['id_projet', 'id_individue'],
        'fields' => ['role'],
    ],
];

try {
    $getEnvironmentValue = static function (string $name): string|false {
        $value = getenv($name);
        if ($value !== false) {
            return $value;
        }
        return $_ENV[$name] ?? $_SERVER[$name] ?? false;
    };
    $host = $getEnvironmentValue('DB_HOST') ?: '127.0.0.1';
    $port = $getEnvironmentValue('DB_PORT') ?: '3306';
    $database = $getEnvironmentValue('DB_NAME') ?: 'TaskManager-Project-MPD';
    $username = $getEnvironmentValue('DB_USER') ?: 'root';
    $password = $getEnvironmentValue('DB_PASSWORD') ?: '';

    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    session_name('task_manager_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();

    $userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
    $accountCount = (int) $pdo->query('SELECT COUNT(*) FROM Utilisateur')->fetchColumn();

    // ------------------------------------------------------------ Authentification
    $authAction = $_GET['auth'] ?? null;
    if ($authAction !== null) {
        if ($authAction === 'status') {
            $user = null;
            if ($userId !== null) {
                $user = fetchRow(
                    $pdo,
                    'SELECT id_utilisateur, nom, email FROM Utilisateur WHERE id_utilisateur = :id',
                    [':id' => $userId]
                );
                if ($user === null) {
                    session_destroy();
                    $userId = null;
                }
            }
            respond(200, ['data' => [
                'authenticated' => $user !== null,
                'setupRequired' => $accountCount === 0,
                'user' => $user,
            ]]);
        }

        if ($authAction === 'history') {
            requireMethod('GET');
            if ($userId === null) {
                respond(401, ['error' => 'Connexion requise.']);
            }
            $statement = $pdo->prepare(
                'SELECT action, date_action FROM Historique_authentification '
                . 'WHERE id_utilisateur = :id ORDER BY date_action DESC LIMIT 20'
            );
            $statement->execute([':id' => $userId]);
            respond(200, ['data' => $statement->fetchAll()]);
        }

        if ($authAction === 'logout') {
            requireMethod('POST');
            if ($userId !== null) {
                $statement = $pdo->prepare(
                    'INSERT INTO Historique_authentification (id_utilisateur, action) VALUES (:id, :action)'
                );
                $statement->execute([':id' => $userId, ':action' => 'logout']);
            }
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                setcookie(session_name(), '', [
                    'expires' => time() - 42000,
                    'path' => '/',
                    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
                    'httponly' => true,
                    'samesite' => 'Strict',
                ]);
            }
            session_destroy();
            respond(200, ['message' => 'Session fermée.']);
        }

        if (!in_array($authAction, ['login', 'register'], true)) {
            respond(404, ['error' => 'Action d’authentification inconnue.']);
        }
        requireMethod('POST');
        $payload = requestBody();
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $passwordInput = (string) ($payload['password'] ?? '');

        if ($authAction === 'register') {
            if ($accountCount > 0) {
                respond(403, ['error' => 'Les inscriptions sont fermées. Contactez l’administrateur du projet.']);
            }
            $name = trim((string) ($payload['name'] ?? ''));
            if ($name === '' || strlen($name) > 50 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                respond(400, ['error' => 'Saisissez un nom et une adresse e-mail valides.']);
            }
            if (strlen($passwordInput) < 10 || strlen($passwordInput) > 1024) {
                respond(400, ['error' => 'Le mot de passe doit contenir au moins 10 caractères.']);
            }
            $pdo->beginTransaction();
            $statement = $pdo->prepare(
                'INSERT INTO Utilisateur (nom, email, mot_de_passe) VALUES (:nom, :email, :mot_de_passe)'
            );
            $statement->execute([
                ':nom' => $name,
                ':email' => $email,
                ':mot_de_passe' => password_hash($passwordInput, PASSWORD_DEFAULT),
            ]);
            $newUserId = (int) $pdo->lastInsertId();
            $pdo->prepare('INSERT INTO Individu (nom, id_utilisateur) VALUES (:nom, :id)')
                ->execute([':nom' => $name, ':id' => $newUserId]);
            $pdo->prepare(
                'INSERT INTO Historique_authentification (id_utilisateur, action) VALUES (:id, :action)'
            )->execute([':id' => $newUserId, ':action' => 'account_created']);
            $pdo->commit();

            session_regenerate_id(true);
            $_SESSION['user_id'] = $newUserId;
            respond(201, ['data' => ['id_utilisateur' => $newUserId, 'nom' => $name, 'email' => $email]]);
        }

        $statement = $pdo->prepare(
            'SELECT id_utilisateur, nom, email, mot_de_passe FROM Utilisateur WHERE email = :email'
        );
        $statement->execute([':email' => $email]);
        $user = $statement->fetch();
        if ($user === false || !password_verify($passwordInput, (string) $user['mot_de_passe'])) {
            respond(401, ['error' => 'Adresse e-mail ou mot de passe incorrect.']);
        }
        $loggedUserId = (int) $user['id_utilisateur'];
        ensureIndividual($pdo, $loggedUserId);
        $pdo->prepare(
            'INSERT INTO Historique_authentification (id_utilisateur, action) VALUES (:id, :action)'
        )->execute([':id' => $loggedUserId, ':action' => 'login']);
        session_regenerate_id(true);
        $_SESSION['user_id'] = $loggedUserId;
        unset($user['mot_de_passe']);
        respond(200, ['data' => $user]);
    }

    if ($userId === null) {
        respond(401, ['error' => 'Connexion requise.']);
    }
    $individualId = ensureIndividual($pdo, $userId);

    // ------------------------------------------------------ Enregistrements composites
    $action = $_GET['action'] ?? null;
    if ($action !== null) {
        requireMethod('POST');
        $payload = requestBody();

        if ($action === 'project.save') {
            $name = textField($payload, 'nom', 100, true) ?? '';
            $description = textField($payload, 'description', 5000);
            $statusId = positiveInt($payload['id_status'] ?? null, 'du statut');
            if (!statusExists($pdo, $statusId)) {
                respond(400, ['error' => 'Le statut sélectionné n’existe pas.']);
            }
            $limite = nullableDatetime($payload['limite'] ?? null);
            $memberIds = idList($payload['membres'] ?? []);
            $projectId = isset($payload['id_projet']) && $payload['id_projet'] !== ''
                ? positiveInt($payload['id_projet'], 'du projet')
                : null;
            $isUpdate = $projectId !== null;

            $pdo->beginTransaction();
            if ($projectId !== null) {
                $project = requireProjectOwner($pdo, $userId, $projectId);
                $durationId = $project['id_durre'] !== null ? (int) $project['id_durre'] : null;
                if ($durationId === null) {
                    $pdo->prepare('INSERT INTO Durree_projet (creation, limite) VALUES (NOW(), :limite)')
                        ->execute([':limite' => $limite]);
                    $durationId = (int) $pdo->lastInsertId();
                } else {
                    $pdo->prepare('UPDATE Durree_projet SET limite = :limite WHERE id_durre = :id')
                        ->execute([':limite' => $limite, ':id' => $durationId]);
                }
                $pdo->prepare(
                    'UPDATE Projet SET nom = :nom, description = :description, id_status = :status, '
                    . 'id_durre = :duree WHERE id_projet = :id'
                )->execute([
                    ':nom' => $name,
                    ':description' => $description,
                    ':status' => $statusId,
                    ':duree' => $durationId,
                    ':id' => $projectId,
                ]);
                $pdo->prepare(
                    'DELETE FROM Membre WHERE id_projet = :project AND id_individue <> :owner'
                )->execute([':project' => $projectId, ':owner' => $individualId]);
            } else {
                $pdo->prepare('INSERT INTO Durree_projet (creation, limite) VALUES (NOW(), :limite)')
                    ->execute([':limite' => $limite]);
                $durationId = (int) $pdo->lastInsertId();
                $pdo->prepare(
                    'INSERT INTO Projet (nom, description, id_status, id_durre, id_utilisateur) '
                    . 'VALUES (:nom, :description, :status, :duree, :owner)'
                )->execute([
                    ':nom' => $name,
                    ':description' => $description,
                    ':status' => $statusId,
                    ':duree' => $durationId,
                    ':owner' => $userId,
                ]);
                $projectId = (int) $pdo->lastInsertId();
                $pdo->prepare(
                    'INSERT INTO Membre (id_projet, id_individue, role) VALUES (:project, :individual, :role)'
                )->execute([':project' => $projectId, ':individual' => $individualId, ':role' => 'chef']);
            }

            $insertMember = $pdo->prepare(
                'INSERT IGNORE INTO Membre (id_projet, id_individue, role) VALUES (:project, :individual, :role)'
            );
            foreach ($memberIds as $memberId) {
                if ($memberId === $individualId) {
                    continue;
                }
                $exists = fetchRow($pdo, 'SELECT 1 FROM Individu WHERE id_individue = :id', [':id' => $memberId]);
                if ($exists !== null) {
                    $insertMember->execute([
                        ':project' => $projectId,
                        ':individual' => $memberId,
                        ':role' => 'membre',
                    ]);
                }
            }
            $pdo->commit();
            respond($isUpdate ? 200 : 201, ['data' => ['id_projet' => $projectId]]);
        }

        if ($action === 'task.save') {
            $name = textField($payload, 'nom', 100, true) ?? '';
            $description = textField($payload, 'description', 5000);
            $projectId = positiveInt($payload['id_projet'] ?? null, 'du projet');
            requireProjectAccess($pdo, $userId, $individualId, $projectId);
            $statusId = isset($payload['id_status'])
                ? positiveInt($payload['id_status'], 'du statut')
                : defaultStatusId($pdo);
            if (!statusExists($pdo, $statusId)) {
                respond(400, ['error' => 'Le statut sélectionné n’existe pas.']);
            }
            $importance = (string) ($payload['importance'] ?? 'Non importante');
            if (!in_array($importance, ['Urgente', 'Importante', 'Non importante'], true)) {
                respond(400, ['error' => 'Importance invalide.']);
            }
            $assigneeIds = idList($payload['assignes'] ?? []);
            $taskId = isset($payload['id_tache']) && $payload['id_tache'] !== ''
                ? positiveInt($payload['id_tache'], 'de la tâche')
                : null;
            $isUpdate = $taskId !== null;

            $pdo->beginTransaction();
            if ($taskId !== null) {
                requireTaskAccess($pdo, $userId, $individualId, $taskId);
                $pdo->prepare(
                    'UPDATE Tache SET nom = :nom, description = :description, id_projet = :project, '
                    . 'id_status = :status, importance = :importance WHERE id_tache = :id'
                )->execute([
                    ':nom' => $name,
                    ':description' => $description,
                    ':project' => $projectId,
                    ':status' => $statusId,
                    ':importance' => $importance,
                    ':id' => $taskId,
                ]);
                $pdo->prepare('DELETE FROM Fonction WHERE id_tache = :task')->execute([':task' => $taskId]);
            } else {
                $pdo->prepare(
                    'INSERT INTO Tache (nom, description, id_projet, id_status, importance) '
                    . 'VALUES (:nom, :description, :project, :status, :importance)'
                )->execute([
                    ':nom' => $name,
                    ':description' => $description,
                    ':project' => $projectId,
                    ':status' => $statusId,
                    ':importance' => $importance,
                ]);
                $taskId = (int) $pdo->lastInsertId();
            }

            $insertAssignment = $pdo->prepare(
                'INSERT IGNORE INTO Fonction (id_tache, id_individue, role) VALUES (:task, :individual, :role)'
            );
            foreach ($assigneeIds as $assigneeId) {
                $exists = fetchRow($pdo, 'SELECT 1 FROM Individu WHERE id_individue = :id', [':id' => $assigneeId]);
                if ($exists !== null) {
                    $insertAssignment->execute([
                        ':task' => $taskId,
                        ':individual' => $assigneeId,
                        ':role' => 'Responsable',
                    ]);
                }
            }
            $pdo->commit();
            respond($isUpdate ? 200 : 201, ['data' => ['id_tache' => $taskId]]);
        }

        respond(404, ['error' => 'Action inconnue.']);
    }

    // -------------------------------------------------------------- API générique
    $resourceName = $_GET['resource'] ?? '';
    if (!isset($resources[$resourceName])) {
        respond(404, ['error' => 'Ressource inconnue.']);
    }

    $resource = $resources[$resourceName];
    $table = $resource['table'];
    $keys = $resource['keys'];
    $allowedFields = array_merge($keys, $resource['fields']);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    $where = [];
    $parameters = [];
    foreach ($keys as $key) {
        if (isset($_GET[$key])) {
            $where[] = "`{$key}` = :where_{$key}";
            $parameters[":where_{$key}"] = $_GET[$key];
        }
    }
    $hasKey = count($where) === count($keys);

    if ($method === 'GET') {
        if ($where !== [] && !$hasKey) {
            respond(400, ['error' => 'Tous les identifiants de la ressource sont requis.']);
        }

        $conditions = $where;
        $scopeParameters = [':scope_user' => $userId, ':scope_individual' => $individualId];
        if ($resourceName === 'projects') {
            $conditions[] = projectScope();
        } elseif ($resourceName === 'tasks') {
            $conditions[] = taskScope();
        } elseif ($resourceName === 'members') {
            $conditions[] = 'id_projet IN (SELECT id_projet FROM Projet WHERE ' . projectScope() . ')';
        } elseif ($resourceName === 'functions') {
            $conditions[] = 'id_tache IN (SELECT id_tache FROM Tache WHERE ' . taskScope() . ')';
        }
        if ($conditions !== []) {
            $parameters = array_merge($parameters, $scopeParameters);
        }

        $sql = "SELECT * FROM `{$table}`";
        if ($conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $statement = $pdo->prepare($sql);
        $statement->execute($parameters);
        $rows = $statement->fetchAll();

        if ($resourceName === 'individuals') {
            foreach ($rows as &$row) {
                if ($row['photo_profil'] !== null) {
                    $row['photo_profil'] = base64_encode((string) $row['photo_profil']);
                }
            }
            unset($row);
        }

        if ($hasKey) {
            if ($rows === []) {
                respond(404, ['error' => 'Enregistrement introuvable.']);
            }
            respond(200, ['data' => $rows[0]]);
        }
        respond(200, ['data' => $rows]);
    }

    $payload = [];
    if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
        $payload = requestBody();
        $unknownFields = array_diff(array_keys($payload), $allowedFields);
        if ($unknownFields !== []) {
            respond(400, ['error' => 'Un ou plusieurs champs ne sont pas autorisés.']);
        }
        if ($resourceName === 'individuals') {
            unset($payload['id_utilisateur']);
            if (isset($payload['photo_profil'])) {
                $photo = base64_decode((string) $payload['photo_profil'], true);
                if ($photo === false || strlen($photo) > 2_000_000) {
                    respond(400, ['error' => 'photo_profil doit être une image Base64 de moins de 2 Mo.']);
                }
                $payload['photo_profil'] = $photo;
            }
        }
    }

    if ($method === 'POST') {
        if ($payload === []) {
            respond(400, ['error' => 'Le corps JSON ne peut pas être vide.']);
        }
        if ($resourceName === 'projects') {
            $payload['id_utilisateur'] = $userId;
            if (!isset($payload['id_durre'])) {
                $pdo->prepare('INSERT INTO Durree_projet (creation) VALUES (NOW())')->execute();
                $payload['id_durre'] = (int) $pdo->lastInsertId();
            }
            if (!isset($payload['id_status'])) {
                $payload['id_status'] = defaultStatusId($pdo);
            }
        } elseif ($resourceName === 'tasks') {
            $projectId = positiveInt($payload['id_projet'] ?? null, 'du projet');
            requireProjectAccess($pdo, $userId, $individualId, $projectId);
            $payload['id_projet'] = $projectId;
            if (!isset($payload['id_status'])) {
                $payload['id_status'] = defaultStatusId($pdo);
            }
        } elseif ($resourceName === 'members') {
            $projectId = positiveInt($payload['id_projet'] ?? null, 'du projet');
            requireProjectOwner($pdo, $userId, $projectId);
            $payload['id_projet'] = $projectId;
        } elseif ($resourceName === 'functions') {
            $taskId = positiveInt($payload['id_tache'] ?? null, 'de la tâche');
            requireTaskAccess($pdo, $userId, $individualId, $taskId);
            $payload['id_tache'] = $taskId;
        }

        $columns = array_keys($payload);
        $placeholders = array_map(static fn (string $field): string => ":{$field}", $columns);
        $sql = "INSERT INTO `{$table}` (" . implode(', ', array_map(static fn (string $field): string => "`{$field}`", $columns)) . ')'
            . ' VALUES (' . implode(', ', $placeholders) . ')';
        $statement = $pdo->prepare($sql);
        $statement->execute($payload);
        respond(201, ['message' => 'Enregistrement créé.', 'id' => $pdo->lastInsertId()]);
    }

    if (in_array($method, ['PUT', 'PATCH', 'DELETE'], true)) {
        if (!$hasKey) {
            respond(400, ['error' => 'Tous les identifiants sont requis dans les paramètres de l’URL.']);
        }

        $keyValues = [];
        foreach ($keys as $key) {
            $keyValues[$key] = (int) ($_GET[$key] ?? 0);
        }

        if ($resourceName === 'projects') {
            requireProjectOwner($pdo, $userId, (int) $keyValues['id_projet']);
            unset($payload['id_utilisateur']);
        } elseif ($resourceName === 'tasks') {
            $currentTask = requireTaskAccess($pdo, $userId, $individualId, (int) $keyValues['id_tache']);
            if (isset($payload['id_projet'])) {
                requireProjectAccess($pdo, $userId, $individualId, positiveInt($payload['id_projet'], 'du projet'));
            }
        } elseif ($resourceName === 'members') {
            requireProjectOwner($pdo, $userId, (int) $keyValues['id_projet']);
        } elseif ($resourceName === 'functions') {
            requireTaskAccess($pdo, $userId, $individualId, (int) $keyValues['id_tache']);
        } elseif ($resourceName === 'individuals') {
            unset($payload['id_utilisateur']);
            if (isset($payload['photo_profil'])) {
                $photo = base64_decode((string) $payload['photo_profil'], true);
                if ($photo === false || strlen($photo) > 2_000_000) {
                    respond(400, ['error' => 'photo_profil doit être une image Base64 de moins de 2 Mo.']);
                }
                $payload['photo_profil'] = $photo;
            }
        }

        if ($method === 'DELETE') {
            $durationId = null;
            if ($resourceName === 'projects') {
                $project = projectRow($pdo, (int) $keyValues['id_projet']);
                $durationId = $project['id_durre'] ?? null;
            }
            $pdo->beginTransaction();
            $statement = $pdo->prepare("DELETE FROM `{$table}` WHERE " . implode(' AND ', $where));
            $statement->execute($parameters);
            if ($statement->rowCount() === 0) {
                $pdo->rollBack();
                respond(404, ['error' => 'Enregistrement introuvable.']);
            }
            if ($durationId !== null) {
                $pdo->prepare('DELETE FROM Durree_projet WHERE id_durre = :id')->execute([':id' => $durationId]);
            }
            $pdo->commit();
            respond(200, ['message' => 'Enregistrement supprimé.']);
        }

        if ($payload === []) {
            respond(400, ['error' => 'Le corps JSON ne peut pas être vide.']);
        }
        $statement = $pdo->prepare("SELECT 1 FROM `{$table}` WHERE " . implode(' AND ', $where));
        $statement->execute($parameters);
        if ($statement->fetchColumn() === false) {
            respond(404, ['error' => 'Enregistrement introuvable.']);
        }

        $sets = [];
        foreach (array_keys($payload) as $field) {
            $sets[] = "`{$field}` = :set_{$field}";
        }
        $updateParameters = [];
        foreach ($payload as $field => $value) {
            $updateParameters[":set_{$field}"] = $value;
        }
        $statement = $pdo->prepare(
            "UPDATE `{$table}` SET " . implode(', ', $sets) . ' WHERE ' . implode(' AND ', $where)
        );
        $statement->execute(array_merge($updateParameters, $parameters));
        respond(200, ['message' => 'Enregistrement modifié.']);
    }

    header('Allow: GET, POST, PUT, PATCH, DELETE');
    respond(405, ['error' => 'Méthode HTTP non autorisée.']);
} catch (JsonException) {
    respond(400, ['error' => 'Le corps de la requête doit être un JSON valide.']);
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($exception->getMessage());
    if ($exception->getCode() === '42S02') {
        respond(500, ['error' => 'Le schéma de la base est incomplet. Importez backend/database/schema.sql.']);
    }
    if ($exception->getCode() === '23000') {
        $driverCode = (int) ($exception->errorInfo[1] ?? 0);
        if ($driverCode === 1062) {
            $message = ($_GET['auth'] ?? null) === 'register'
                ? 'Cette adresse e-mail est déjà utilisée.'
                : 'Une valeur identique existe déjà.';
            respond(409, ['error' => $message]);
        }
        if ($driverCode === 1451) {
            respond(409, ['error' => 'Cette ressource est encore utilisée par d’autres éléments.']);
        }
        if ($driverCode === 1452) {
            respond(409, ['error' => 'Une référence liée à cette ressource est introuvable.']);
        }
        respond(409, ['error' => 'Cette opération entre en conflit avec des données existantes.']);
    }
    respond(500, ['error' => 'Erreur lors de la communication avec la base de données.']);
}
