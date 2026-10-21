<?php
declare(strict_types=1);
require_once __DIR__ . "/../vendor/autoload.php";

use Phroute\Phroute\RouteCollector;
use Phroute\Phroute\Dispatcher;

require __DIR__ . "/../src/controllers/auth.php";
require __DIR__ . "/../src/controllers/info.php";
require __DIR__ . "/../src/controllers/delete.php";
require __DIR__ . "/../src/controllers/update.php";
require __DIR__ . "/../src/controllers/upload.php";

require_once __DIR__ . "/../src/config/Database.php";

// $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

// ====================================== REQUEST AND DATABASE
$db = new Database($_ENV["DB_HOST"], $_ENV["DB_NAME"], $_ENV["DB_USER"], $_ENV["DB_PASSWORD"]);
$info = new Info($db);
$auth = new Auth($db);
$delete = new Delete($db);
$update = new Update($db);
$upload = new Upload($db);
// ====================================== REQUEST AND DATABASE

$route = new RouteCollector;
// =================== POUR CHAQUE REQUETE LE USER ID DOIT ETRE ENVOYER
// ========================================= AUTH
$route->post("/auth/signup", function () use ($auth) {
    // =========================== CREATE ACCOUNT
    return $auth->authSignup();
});
$route->post("/auth/login", function () use ($auth) {
    return $auth->authLogin();
});
// ========================================== INFO
$route->get("/info/:userId", function () use ($info) {
    return $info->getInfo();
});
$route->get("/info/tag", function () use ($info) {
    return $info->getTag();
});
$route->get("/info/activite", function () use ($info) {
    return $info->getActivite();
});
$route->get("/info/individu", function () use ($info) {
    return $info->getIndividu();
});
$route->get("/info/competence", function () use ($info) {
    return $info->getCompetence();
});
// ============================================ UPLOAD
$route->post("/upload/project", function () use ($upload) {
    /*
        Receive :
        {
        nom,description,deadline,tag,membre
        }
    */
    return $upload->addProject();
});
$route->post("/upload/individu", function () use ($upload) {
    /*
        Receive :
        {
        nom,competence,tache
        }
    */
    return $upload->addIndividu();
});
$route->post("/upload/tache", function () use ($upload) {
    /*
        Receive :
        {
        nom,importance,status,tag
        }
    */
    return $upload->addTache();
});
$route->post("/upload/tag", function () use ($upload) {
    /*
        Receive :
        {
        nom,importance,status,tag
        }
    */
    return $upload->addTag();
});
// ============================================= Modification
$route->patch("/update/project", function () use ($update) {
    /*
        Param query example :
        ?nom=""description=""deadline=""membre=""tag=""
    */
    return $update->updateProject();
});
$route->patch("/update/individu", function () use ($update) {
    /*
        Param query example :
        ?nom=""competence=""tache="'
    */
    return $update->updateIndividu();
});
$route->patch("/update/tache", function () use ($update) {
    return $update->updateTache();
});
$route->patch("/upload/tag", function () use ($update) {
    /*
        Param qup$update->e :
        ?nom=""
    */
    return $update->updateTag();
});
$route->patch("/upload/competence", function () use ($update) {
    /*
        Param query example :
        ?nom=""
    */
    return $update->updateCompetence();
});
// ============================================== Delete
$route->delete("/delete/project", function () use ($delete) {
    return $delete->deleteProject();
});
$route->delete("/delete/tache", function () use ($delete) {
    return $delete->deleteTache();
});
$route->delete("/delete/tag", function () use ($delete) {
    return $delete->deleteTag();
});
$route->patch("/delete/competence", function () use ($delete) {
    return $delete->deleteCompetence();
});

// =============================================== TEST
$route->get("/", function () {
    header('Content-Type: application/json');
    $data = ["message"=>"Hello"];
    return json_encode($data);
});

$dispatcher = new Dispatcher($route->getData());
$response = $dispatcher->dispatch($_SERVER["REQUEST_METHOD"], $path);
echo $response;