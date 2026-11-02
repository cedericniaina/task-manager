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
    public function addTache()
    {
        header('Content-Type: application/json');
        $input = $this->input();
        $this->db->addTache($input['activity_id'], $input['individu_id'], $input['tache_status']);
        return json_encode([
            "message" => "Adding tache success",
        ]);
    }
    public function addActivite()
    {
        header('Content-Type: application/json');
        $input = $this->input();
        $this->db->addActivite($input['project_id'], $input['activity_name'], $input['activity_importance']);
        return json_encode([
            "message" => "Adding activite success",
        ]);
    }
    public function addProject()
    {
        return $this->db->addProject();
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