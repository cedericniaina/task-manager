<?php
// require_once(dirname(__FILE__) ."../config/Database.php");
require_once(dirname(__FILE__) . "/../config/Database.php");

class Auth {
    public function __construct(private Database $database){}

    public function postLogin() {
        $body = json_decode(file_get_contents("php://input"), true);
        header('Content-Type: application/json');

        $this->database->addUser($body["nom"], $body["email"], $body["password"]);
        return json_encode($body);
    }

    public function login(): string {
        return "Login";
    }
}