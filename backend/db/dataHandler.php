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
            if ($val->aId == $id) {
                $result = $val;
            }
        }
        return $result;
    }

    /**
     * returns all Termine for a specific Appointment
     */
    public function queryTermineByAppointmentId($id)
    {
        $res = $this->getAllTermineByAppointmentId($id);
        return $res;
    }

   /* public function saveVoting($param)   
    {
        $this->saveAllVotings($param["name"], $param["voting"]);

        if ($param["comment"] . length > 0) {
            saveCommentToDB(...);
        }
        return true;
    } */
    
public function saveVoting($param)      //geändert
{
    $this->saveAllVotings($param["name"], $param["voting"]);

    if (strlen($param["comment"]) > 0) { // strlen() instead of .length for php thing
        $aid = $param["aid"];   //extracting the aid from the param array to use it
        $name = $param["name"];
        $comment = $param["comment"];
        $this->saveCommentToDB($aid, $name, $comment);
    }
    return true;
}



    // PRIVATE FUNCTIONS
    private static function saveCommentToDB($aid, $name, $comment)
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            echo "<div class='inputError'>Connection Error: " . $db_obj->connect_error . "</div>";
            exit();
        }

        $sql = "INSERT INTO `kommentare` (`AID`, `Name`, `Kommentar`) VALUES (?, ?, ?)";

        $stmt = $db_obj->prepare($sql);

        $stmt->bind_param("iss", $aid, $name, $comment);
        $stmt->execute();
    }

    private static function saveAllVotings($name, $votings)
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            echo "<div class='inputError'>Connection Error: " . $db_obj->connect_error . "</div>";
            exit();
        }

        $sql = "INSERT INTO `voting` (`TID`, `Name`) VALUES (?, ?)";

        $stmt = $db_obj->prepare($sql);

        foreach ($votings as $tId) {
            $stmt->bind_param("is", $tId, $name);
            $stmt->execute();
        }
    }

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
            array_push($appointmentArray, new Appointment($line["AID"], $line["Title"], $line["Beschreibung"], $line["Ort"], $line["Ablaufdatum"]));
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



    private static function getAllVotingsByAId($id)   // new
{
    global $db_host, $db_user, $db_password, $database;

    $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

    if ($db_obj->connect_error) {
        return;
    }

    $sql = "SELECT * FROM `votings` WHERE `AID` = ?";
    $stmt = $db_obj->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    $votingArray = [];
    while ($line = $result->fetch_assoc()) {
        array_push($votingArray, new Voting($line["VID"], $line["AID"], $line["Voting"], $line["Comment"]));
    }

    return $votingArray;
}
}