<?php
class Update extends Request
{
    public function updateProject()
    {
        return $this->db->updateProject();
    }
    public function updateIndividu()
    {
        return $this->db->updateIndividu();
    }
    public function updateTag()
    {
        return $this->db->updateTag();
    }
    public function updateCompetence()
    {
        return $this->db->updateCompetence();
    }
    public function updateTache()
    {
        return $this->db->updateTache();
    }
}