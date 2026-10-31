<?php
class Info extends Request
{
    public function getInfo()
    {
        // =============== GIVE THE GLOBAL INFO OF AN USER
        return $this->db->getInfo();
    }
    public function getActivite()
    {
        // =============== GET THE ALL ACTIVITE IN A PROJECT
        return $this->db->getActivite();
    }
    public function getTag()
    {

        header('Content-Type: application/json');
        $rs = $this->db->getTag();
        return json_encode($rs);
    }
    public function getCompetence()
    {
        header('Content-Type: application/json');
        $rs = $this->db->getCompetence();
        return json_encode($rs);
    }

    public function getIndividu()
    {
        header('Content-Type: application/json');
        $rs = $this->db->getIndividu();
        return json_encode($rs);
    }
}