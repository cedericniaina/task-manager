<?php
class Database
{
    private PDO $connection;
    private string $useId;
    public function __construct(string $host, string $dbName, string $userName, string $password)
    {
        $this->connection = new PDO("mysql:host=$host;dbname=$dbName;charset=utf8mb4", $userName, $password);
    }
    // ==================================== USER ID
    public function setUserId(int $userId): void
    {
        $this->useId = $userId;
    }
    public function getUserId(): string
    {
        return $this->useId;
    }
    // ==================================== CHECK CONNECTION
    public function checkUser(string $email, string $password)
    {
        $sql = "SELECT mot_de_passe ,id_utilisateur userId FROM utilisateur WHERE email=:email";
        $query = $this->connection->prepare($sql);
        $query->execute([
            "email" => (string) $email,
        ]);
        $content = $query->fetch(PDO::FETCH_ASSOC);
        if ($content["mot_de_passe"] == $password) {
            return ["message" => "You are connected", "connection" => TRUE, "data" => ["userId" => $content["userId"]]];
        } else {
            return ["message" => "NOTHING THERE", "connection" => FALSE];
        }
    }

    // ==================================== ADD
    public function addUser(string $username, string $email, string $password)
    {
        $sql = "INSERT INTO utilisateur(nom_utilisateur,email,mot_de_passe) VALUES (:nom_utilisateur,:email,:mot_de_passe) ";
        $query = $this->connection->prepare($sql);
        $query->execute([
            "nom_utilisateur" => $username,
            "email" => $email,
            "mot_de_passe" => $password,
        ]);
    }

    public function addTag(string $tag_name)
    {
        $sql = "INSERT INTO tag(nom_tag) VALUE (:tag_name)";
        $query = $this->connection->prepare($sql);
        $query->execute([
            "tag_name" => $tag_name,
        ]);
    }
    public function addIndividu(string $individu_name, $individu_pdp)
    {
        $sql = "INSERT INTO individu(nom_individu,pdp_individu_url) VALUE (:individu_name,:individu_profile_image)";
        $query = $this->connection->prepare($sql);
        $query->execute([
            "individu_name" => $individu_name,
            "individu_profile_image" => $individu_pdp,
        ]);
    }
    public function addTache()
    {
        return "";
    }
    public function addActivite()
    {
        return "";
    }
    public function addMaitrise()
    {
        return "";
    }
    public function addProject()
    {
        return "";
    }
    public function addCompetence()
    {
        return "";
    }
    public function addMembre()
    {
        return "";
    }
    public function addProjectTag()
    {
        return "";
    }
    public function addActiviteTag()
    {
        return "";
    }

    // ==================================== OBTENIR
    public function getTag()
    {
        $sql = "SELECT id_tag AS tag_id,nom_tag AS tag_name from tag";
        $query = $this->connection->prepare($sql);
        $query->execute();
        $rs = $query->fetchAll(PDO::FETCH_ASSOC);
        return ["message" => "Tag list", "data" => $rs];
    }
    public function getIndividu()
    {
        $sql = "SELECT person_id AS id_individu,nom_individu AS person_name from individu";
        $query = $this->connection->prepare($sql);
        $query->execute();
        $rs = $query->fetchAll(PDO::FETCH_ASSOC);
        return ["message" => "Individu list", "data" => $rs];
        return "";
    }
    public function getCompetence()
    {
        $sql = "SELECT id_competenece AS competence_id,nom_competence AS competence_name from competence";
        $query = $this->connection->prepare($sql);
        $query->execute();
        $rs = $query->fetchAll(PDO::FETCH_ASSOC);
        return ["message" => "Competence list", "data" => $rs];
    }
    public function getInfo()
    {
        return "";
    }
    public function getActivite()
    {
        return "";
    }


    // =================================== UPDATE
    public function updateProject()
    {
        return "";
    }
    public function updateIndividu()
    {
        return "";
    }
    public function updateTag()
    {
        return "";
    }
    public function updateCompetence()
    {
        return "";
    }
    public function updateTache()
    {
        return "";
    }
    // =================================== Delete
    public function deleteProject()
    {
        return "";
    }
    public function deleteTache()
    {
        return "";
    }
    public function deleteTag()
    {
        return "";
    }
    public function deleteCompetence()
    {
        return "";
    }
}