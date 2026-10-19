<?php
class Info extends Request
{
    public function getInfo()
    {
        // =============== GIVE THE GLOBAL INFO OF AN USER
        return $this->db->getInfo();
    }
    public function getTag()
    {
        return $this->db->getTag();
    }
    public function getCompetence()
    {
        return $this->db->getCompetence();
    }
    public function getActivite()
    {
        return $this->db->getActivite();
    }
    public function getIndividu()
    {
        return $this->db->getIndividu();
    }
}