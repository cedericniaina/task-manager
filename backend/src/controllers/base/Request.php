<?php
class Request {
    protected Database $db;
    public function __construct(Database $database) {
        $this->db = $database;
    }
    public function input(){
        // HERE THE INPUT SEND IN THE BODY
        $body = json_decode(file_get_contents("php://input"), true);
        return $body;
    }
}