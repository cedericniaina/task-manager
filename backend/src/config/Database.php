<?php
class Database
{
    private PDO $connection;
    public function __construct(string $host, string $dbName, string $userName, string $password)
    {
        $this->connection = new PDO("mysql:host=$host;dbname=$dbName;charset=utf8mb4", $userName, $password);
    }
    public function addUser(string $username, string $email, string $password)
    {
        $sql = "INSERT INTO utilisateur(nom,email,password) VALUES (:nom,:email,:password) ";
        $query = $this->connection->prepare($sql);
        $query->execute([
            "nom"=>$username,
            "email"=>$email,
            "password"=>$password,
        ]);
    }
}