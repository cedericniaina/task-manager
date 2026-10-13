<?php
declare(strict_types=1);
require_once __DIR__ . "/../vendor/autoload.php";

use Phroute\Phroute\RouteCollector;
use Phroute\Phroute\Dispatcher;

require __DIR__ . "/../src/controllers/auth.php";
require_once __DIR__ . "/../src/config/Database.php";

// $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

$db = new Database($_ENV["DB_HOST"], $_ENV["DB_NAME"], $_ENV["DB_USER"], $_ENV["DB_PASSWORD"]);
$auth = new Auth($db);
$route = new RouteCollector;
// =================== POUR CHAQUE REQUETE LE USER ID DOIT ETRE ENVOYER
// ========================================= AUTH
$route->get("/auth/login", function () use ($auth) {
    return $auth->login();
});
$route->post("/auth/login", function () use ($auth) {
    return $auth->postLogin();
});
// ========================================== INFO
$route->get("/info/:userId", function () use ($auth) {
    return $auth->login();
});
$route->get("/info/tag", function () use ($auth) {
    return $auth->login();
});
$route->get("/info/activite", function () use ($auth) {
    return $auth->login();
});
$route->get("/info/individu", function () use ($auth) {
    return $auth->login();
});
$route->get("/info/competence", function () use ($auth) {
    return $auth->login();
});
// ============================================ UPLOAD
$route->post("/upload/project", function () use ($auth) {
    /*
        Receive :
        {
        nom,description,deadline,tag,membre
        }
    */
    return $auth->login();
});
$route->post("/upload/individu", function () use ($auth) {
    /*
        Receive :
        {
        nom,competence,tache
        }
    */
    return $auth->login();
});
$route->post("/upload/tache", function () use ($auth) {
    /*
        Receive :
        {
        nom,importance,status,tag
        }
    */
    return $auth->login();
});
// ============================================= Modification
$route->patch("/update/project", function () use ($auth) {
    /*
        Param query example :
        ?nom=""description=""deadline=""membre=""tag=""
    */
    return $auth->login();
});
$route->patch("/update/individu", function () use ($auth) {
    /*
        Param query example :
        ?nom=""competence=""tache="'
    */
    return $auth->login();
});
$route->patch("/update/tache", function () use ($auth) {
    return $auth->login();
});
$route->patch("/upload/tag", function () use ($auth) {
    /*
        Param query example :
        ?nom=""
    */
    return $auth->login();
});
$route->patch("/upload/competence", function () use ($auth) {
    /*
        Param query example :
        ?nom=""
    */
    return $auth->login();
});
// ============================================== Delete
$route->delete("/delete/project", function () use ($auth) {
    return $auth->login();
});
$route->delete("/delete/tache", function () use ($auth) {
    return $auth->login();
});
$route->delete("/delete/tag", function () use ($auth) {
    return $auth->login();
});
$route->patch("/upload/competence", function () use ($auth) {
    return $auth->login();
});


$dispatcher = new Dispatcher($route->getData());
$response = $dispatcher->dispatch($_SERVER["REQUEST_METHOD"], $path);
echo $response;