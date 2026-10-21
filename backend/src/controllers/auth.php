<?php
// require_once(dirname(__FILE__) ."../config/Database.php");
require __DIR__ . "/base/Request.php";
require_once(dirname(__FILE__) . "/../config/Database.php");

class Auth extends Request{
    public function authLogin() {
        header('Content-Type: application/json');
        $body = $this->input();
        // $this->db->addUser($body["nom"], $body["email"], $body["password"]);
        // return json_encode($body);
        //  NOT FINISHED
        return $body;
    }

    public function authSignup() {
        header('Content-Type: application/json');
        $body = $this->input();
        $this->db->addUser($body["nom_utilisateur"], $body["email"], $body["mot_de_passe"]);
        // // NOT FINISHED
        return json_encode($body);
    }
}