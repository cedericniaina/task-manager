<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
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
        'fields' => ['nom', 'photo_profil'],
    ],
    'competencies' => [
        'table' => 'Competence',
        'keys' => ['id_competenece'],
        'fields' => ['nom_competence'],
    ],
    'statuses' => [
        'table' => 'Status_projet',
        'keys' => ['id_status'],
        'fields' => ['status', 'id_durre'],
    ],
    'projects' => [
        'table' => 'Projet',
        'keys' => ['id_projet'],
        'fields' => ['nom', 'id_status'],
    ],
    'tasks' => [
        'table' => 'Tache',
        'keys' => ['id_tache'],
        'fields' => ['nom', 'id_projet'],
    ],
    'functions' => [
        'table' => 'Fonction',
        'keys' => ['id_tache', 'id_individue'],
        'fields' => ['status'],
    ],
    'masteries' => [
        'table' => 'Maitrise',
        'keys' => ['id_individue', 'id_competenece'],
        'fields' => [],
    ],
    'members' => [
        'table' => 'Membre',
        'keys' => ['id_projet', 'id_individue'],
        'fields' => [],
    ],
];

try {
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $database = getenv('DB_NAME') ?: 'TaskManager-Project-MPD';
    $username = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASSWORD') ?: '';

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

    $authAction = $_GET['auth'] ?? null;
    if ($authAction !== null) {
        if ($authAction === 'status') {
            $accountCount = (int) $pdo->query('SELECT COUNT(*) FROM Utilisateur')->fetchColumn();
            $user = null;
            if (isset($_SESSION['user_id'])) {
                $statement = $pdo->prepare('SELECT id_utilisateur, nom, email FROM Utilisateur WHERE id_utilisateur = :id');
                $statement->execute([':id' => $_SESSION['user_id']]);
                $user = $statement->fetch() ?: null;
                if ($user === null) {
                    session_destroy();
                }
            }
            respond(200, ['data' => [
                'authenticated' => $user !== null,
                'setupRequired' => $accountCount === 0,
                'user' => $user,
            ]]);
        }

        if ($authAction === 'logout') {
            if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
                header('Allow: POST');
                respond(405, ['error' => 'Méthode HTTP non autorisée.']);
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
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            header('Allow: POST');
            respond(405, ['error' => 'Méthode HTTP non autorisée.']);
        }

        $authPayload = json_decode(file_get_contents('php://input') ?: '{}', true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($authPayload) || array_is_list($authPayload)) {
            respond(400, ['error' => 'Le corps doit être un objet JSON.']);
        }
        $email = strtolower(trim((string) ($authPayload['email'] ?? '')));
        $password = (string) ($authPayload['password'] ?? '');

        if ($authAction === 'register') {
            $name = trim((string) ($authPayload['name'] ?? ''));
            if ($name === '' || strlen($name) > 50 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                respond(400, ['error' => 'Saisissez un nom et une adresse e-mail valides.']);
            }
            if (strlen($password) < 10 || strlen($password) > 1024) {
                respond(400, ['error' => 'Le mot de passe doit contenir au moins 10 caractères.']);
            }
            $statement = $pdo->prepare('INSERT INTO Utilisateur (nom, email, mot_de_passe) VALUES (:nom, :email, :mot_de_passe)');
            $statement->execute([
                ':nom' => $name,
                ':email' => $email,
                ':mot_de_passe' => password_hash($password, PASSWORD_DEFAULT),
            ]);
            $userId = (int) $pdo->lastInsertId();
            session_regenerate_id(true);
            $_SESSION['user_id'] = $userId;
            respond(201, ['data' => ['id_utilisateur' => $userId, 'nom' => $name, 'email' => $email]]);
        }

        $statement = $pdo->prepare('SELECT id_utilisateur, nom, email, mot_de_passe FROM Utilisateur WHERE email = :email');
        $statement->execute([':email' => $email]);
        $user = $statement->fetch();
        if ($user === false || !password_verify($password, $user['mot_de_passe'])) {
            respond(401, ['error' => 'Adresse e-mail ou mot de passe incorrect.']);
        }
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $user['id_utilisateur'];
        unset($user['mot_de_passe']);
        respond(200, ['data' => $user]);
    }

    if (!isset($_SESSION['user_id'])) {
        respond(401, ['error' => 'Connexion requise.']);
    }

    $resourceName = $_GET['resource'] ?? '';
    if (!isset($resources[$resourceName])) {
        respond(404, ['error' => 'Ressource inconnue.']);
    }

    $resource = $resources[$resourceName];
    $table = $resource['table'];
    $keys = $resource['keys'];
    $allowedFields = array_merge($keys, $resource['fields']);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $payload = [];

    if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
        $rawBody = file_get_contents('php://input');
        $payload = json_decode($rawBody ?: '{}', true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($payload) || array_is_list($payload)) {
            respond(400, ['error' => 'Le corps doit être un objet JSON.']);
        }

        $unknownFields = array_diff(array_keys($payload), $allowedFields);
        if ($unknownFields !== []) {
            respond(400, ['error' => 'Un ou plusieurs champs ne sont pas autorisés.']);
        }

        if ($resourceName === 'individuals' && isset($payload['photo_profil'])) {
            $photo = base64_decode((string) $payload['photo_profil'], true);
            if ($photo === false) {
                respond(400, ['error' => 'photo_profil doit être encodée en Base64.']);
            }
            $payload['photo_profil'] = $photo;
        }
    }

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

        $sql = "SELECT * FROM `{$table}`";
        if ($hasKey) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $statement = $pdo->prepare($sql);
        $statement->execute($parameters);
        $rows = $statement->fetchAll();

        if ($hasKey) {
            if ($rows === []) {
                respond(404, ['error' => 'Enregistrement introuvable.']);
            }
            $rows = $rows[0];
            if ($resourceName === 'individuals' && $rows['photo_profil'] !== null) {
                $rows['photo_profil'] = base64_encode($rows['photo_profil']);
            }
            respond(200, ['data' => $rows]);
        }

        if ($resourceName === 'individuals') {
            foreach ($rows as &$row) {
                if ($row['photo_profil'] !== null) {
                    $row['photo_profil'] = base64_encode($row['photo_profil']);
                }
            }
            unset($row);
        }
        respond(200, ['data' => $rows]);
    }

    if ($method === 'POST') {
        if ($payload === []) {
            respond(400, ['error' => 'Le corps JSON ne peut pas être vide.']);
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

        if ($method === 'DELETE') {
            $statement = $pdo->prepare("DELETE FROM `{$table}` WHERE " . implode(' AND ', $where));
            $statement->execute($parameters);
            if ($statement->rowCount() === 0) {
                respond(404, ['error' => 'Enregistrement introuvable.']);
            }
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
        $statement = $pdo->prepare("UPDATE `{$table}` SET " . implode(', ', $sets) . ' WHERE ' . implode(' AND ', $where));
        $statement->execute(array_merge($updateParameters, $parameters));
        respond(200, ['message' => 'Enregistrement modifié.']);
    }

    header('Allow: GET, POST, PUT, PATCH, DELETE');
    respond(405, ['error' => 'Méthode HTTP non autorisée.']);
} catch (JsonException) {
    respond(400, ['error' => 'Le corps de la requête doit être un JSON valide.']);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    if ($exception->getCode() === '23000') {
        respond(409, ['error' => 'Cette adresse e-mail est déjà utilisée.']);
    }
    respond(500, ['error' => 'Erreur lors de la communication avec la base de données.']);
}