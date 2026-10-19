<?php
class Delete extends Request
{
    public function deleteProject()
    {
        return $this->db->deleteProject();
    }
    public function deleteTache()
    {
        return $this->db->deleteTache();
    }
    public function deleteTag()
    {
        return $this->db->deleteTag();
    }
    public function deleteCompetence()
    {
        return $this->db->deleteCompetence();
    }
}