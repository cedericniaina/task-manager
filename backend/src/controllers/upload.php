<?php
class Upload extends Request
{
    public function addTag()
    {
        $input = $this->input();
        $this->db->addTag($input["tag_name"]);
        return [
            "message" => "Adding tag success",
        ];
    }
    // public function addUser()
    // {
    //     return $this->db->addUser("name", "email", "password");
    // }
    public function addIndividu()
    {
        header('Content-Type: application/json');
        $input = $this->input();
        // $pdp = $input["individu_pdp"] && $this->getDefaultPdp();
        $this->db->addIndividu($input["individu_name"], $input["individu_pdp"]);
        return json_encode([
            "message" => "Adding Individu success",
        ]);
    }
    public function addProject()
    {
        return $this->db->addProject();
    }

    public function addTache()
    {
        return $this->db->addTache();
    }
    public function addActivite()
    {
        return $this->db->addActivite();
    }
    // ========================================== NOTE FINISHED
    public function addCompetence()
    {
        return $this->db->addCompetence();
    }
    public function addMaitrise()
    {
        return $this->db->addMaitrise();
    }
    public function addMembre()
    {
        return $this->db->addMembre();
    }
    public function addProjectTag()
    {
        return $this->db->addProjectTag();
    }
    public function addActiviteTag()
    {
        return $this->db->addActiviteTag();
    }
}