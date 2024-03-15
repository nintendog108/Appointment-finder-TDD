<?php
include ("./models/appointment.php");
include ("./models/termin.php");
include ("./config/dbaccess.php");

class DataHandler
{

    /**
     * returns all Appointments
     */
    public function queryAppointments()
    {
        $res = $this->getAllAppointments();
        return $res;
    }

    /** 
     * returns a single Appointment with specific ID
     * **/
    public function queryAppointmentById($id)
    {
        $result = "";
        foreach ($this->queryAppointments() as $val) {
            if ($val->pId == $id) {
                $result = $val;
            }
        }
        return $result;
    }

    public function queryTermineByAppointmentId($id)
    {
        $res = $this->getAllTermineByAppointmentId($id);
        return $res;
    }


    // PRIVATE FUNCTIONS
    private static function getAllAppointments()
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            return;
        }

        $sql = "SELECT * FROM `appointments`";
        $result = $db_obj->query($sql);

        $appointmentArray = [];
        while ($line = $result->fetch_assoc()) {
            array_push($appointmentArray, new Appointment($line["AID"], $line["Title"], $line["Ort"]));
        }

        return $appointmentArray;
    }

    private static function getAllTermineByAppointmentId($id)
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            return;
        }

        $sql = "SELECT * FROM `termine` WHERE `AID` = ?";
        $stmt = $db_obj->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        $appointmentArray = [];
        while ($line = $result->fetch_assoc()) {
            array_push($appointmentArray, new Termin($line["TID"], $line["AID"], $line["Datum"], $line["UhrzeitVon"], $line["UhrzeitBis"]));
        }

        return $appointmentArray;
    }
}
