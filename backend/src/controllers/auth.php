<?php
// require_once(dirname(__FILE__) ."../config/Database.php");
require __DIR__ . "/base/Request.php";
require_once(dirname(__FILE__) . "/../config/Database.php");

class Auth extends Request
{
    public function authLogin()
    {
        header('Content-Type: application/json');
        session_start();
        $body = $this->input();
        $responce = $this->db->checkUser($body["email"], $body['mot_de_passe']);
        if ($responce['connection'] == 1) {
            // setcookie('username', "TEST", time() + (86400 * 2),"/");
            $_SESSION['utilisateur'] = ['userId' => $responce['data']['userId']];
            $content = [
                "data" => $_SESSION['utilisateur'],
                'message' => $responce['message']
            ];
        } else {
            $content = ['message' => $responce['message']];
        }
        return json_encode($content);
    }

    public function authSignup()
    {
        header('Content-Type: application/json');
        $body = $this->input();
        $this->db->addUser($body["nom_utilisateur"], $body["email"], $body["mot_de_passe"]);
        return json_encode($body);
    }
}