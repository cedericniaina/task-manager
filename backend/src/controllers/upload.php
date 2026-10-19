<?php
class Upload extends Request
{
    public function addUser()
    {
        return $this->db->addUser("name","email","password");
    }
    public function addProject()
    {
        return $this->db->addProject();
    }
    public function addTag()
    {
        return $this->db->addTag();
    }
    public function addIndividu()
    {
        return $this->db->addIndividu();
    }
    public function addTache()
    {
        return $this->db->addTache();
    }
}