<?php
include ("./models/appointment.php");
include ("./config/dbaccess.php");

class DataHandler
{

    public function queryAppointments()
    {
        $res = $this->getDemoData();
        return $res;
    }

    /** 
     * returns a single Appointment with specific ID
     * **/
    public function queryAppointmentById($id)
    {
        // $result = "";
        // foreach ($this->queryAppointments() as $val) {
        //     if ($val[0]->pId == $id) {
        //         $result = $val;
        //     }
        // }
        // return $result;
    }

    public function queryTerminByAppointmentId($id)
    {

    }

    private static function getDemoData()
    {
        $demodata = [
            [new Appointment(1, "Treffen mit Freunden", "Cafe", "01012024")],
            [new Appointment(2, "Am Webprojekt arbeiten", "FHTW", "15032024")],
            [new Appointment(3, "Blabla", "Irgendwo", "16032024")]
        ];

        return $demodata;

    }

    private static function getAllAppointments()
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            echo "<div class='inputError'>Connection Error: " . $db_obj->connect_error . "</div>";
            exit();
        }

        $sql = "SELECT * FROM appointments";
        $result = $db_obj->query($sql);

        $appointmentArray = [];
        while ($line = $result->fetch_assoc()) {
            array_push($appointmentArray, new Appointment($line["AID"], $line["Title"], $line["Ort"]));
        }

        return $appointmentArray;
    }
}
