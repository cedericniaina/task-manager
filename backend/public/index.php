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
// ========================================= AUTH
$route->get("/auth/login", function () use ($auth) {
    return $auth->login();
});
$route->post("/auth/login", function () use ($auth) {
    return $auth->postLogin();
});

$dispatcher = new Dispatcher($route->getData());
$response = $dispatcher->dispatch($_SERVER["REQUEST_METHOD"], $path);
echo $response;