<?php
class Database
{
    private PDO $connection;
    public function __construct(string $host, string $dbName, string $userName, string $password)
    {
        $this->connection = new PDO("mysql:host=$host;dbname=$dbName;charset=utf8mb4", $userName, $password);
    }
    // ==================================== ADD
    public function addUser(string $username, string $email, string $password)
    {
        $sql = "INSERT INTO utilisateur(nom_utilisateur,email,mot_de_passe) VALUES (:nom_utilisateur,:email,:mot_de_passe) ";
        $query = $this->connection->prepare($sql);
        $query->execute([
            "nom_utilisateur"=>$username,
            "email"=>$email,
            "mot_de_passe"=>$password,
        ]);
    }
    public function addProject(){
        return "";
    }
    public function addTag(){
        return "";
    }
    public function addIndividu(){
        return "";
    }
    public function addTache(){
        return "";
    }
    // ==================================== OBTENIR
    public function getInfo(){
        return "";
    }
    public function getTag(){
        return "";
    }
    public function getActivite(){
        return "";
    }
    public function getIndividu(){
        return "";
    }
    public function getCompetence(){
        return "";
    }
    // =================================== UPDATE
    public function updateProject(){
        return "";
    }
    public function updateIndividu(){
        return "";
    }
    public function updateTag(){
        return "";
    }
    public function updateCompetence(){
        return "";
    }
    public function updateTache(){
        return "";
    }
    // =================================== Delete
    public function deleteProject(){
        return "";
    }
    public function deleteTache(){
        return "";
    }
    public function deleteTag(){
        return "";
    }
    public function deleteCompetence(){
        return "";
    }
}