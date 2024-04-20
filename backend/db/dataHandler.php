<?php
include ("./models/appointment.php");
include ("./models/termin.php");
include ("./models/voting.php");
include ("./models/kommentar.php");
include ("./config/dbaccess.php");

class DataHandler
{
    public function saveTermine($termine)
    {
        $res = $this->saveAllTermine($termine);
        return $res;
    }

    public function deleteAppointment($id)
    {
        $res = $this->deleteAppointmentFromDB($id);
        return $res;
    }

    public function saveAppointment($param)
    {
        $res = $this->createAppointment($param->title, $param->desc, $param->ort, $param->ablaufdatum);
        return $res;
    }

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

    public function queryAllVotingsByAppointmentID($id)
    {
        $res = $this->getAllVotingsByAppointment($id);
        return $res;
    }

    /**
     * returns all Termine for a specific Appointment
     */
    public function queryTermineByAppointmentId($id)
    {
        $res = $this->getAllTermineByAppointmentId($id);
        return $res;
    }

    public function queryCommentsByAppointment($id)
    {
        $res = $this->getAllCommentsByAppointment($id);
        return $res;
    }
    public function saveVoting($param)
    {
        $this->saveAllVotings($param->name, $param->voting);

        if (strlen($param->comment) > 0) {
            $this->saveCommentToDB($param->aid, $param->name, $param->comment);
        }
        return $param;
    }

    // PRIVATE FUNCTIONS
    private static function deleteAppointmentFromDB($aid)
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database); //Verbindung zur Datenbank herstellen

        if ($db_obj->connect_error) { // fehlerbehandlung falls Verbindung fehlschlägt
            return;
        }

        $sql = "DELETE FROM `appointments` WHERE `AID` = ?";
        $stmt = $db_obj->prepare($sql);
        $stmt->bind_param("i", $aid); // bind_param bindet die Parameter an die SQL-Abfrage um SQL-Injections zu verhindern
        $stmt->execute(); // execute führt die SQL-Abfrage aus
        return $aid; // gibt die ID des gelöschten Appointments zurück
    }

    private static function createAppointment($title, $beschreibung, $ort, $ablaufdatum) // new appointment anlegen
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            return;
        }

        $sql = "INSERT INTO `appointments` (`Title`, `Beschreibung`, `Ort`, `Ablaufdatum`) VALUES (?, ?, ?, ?)";
        $stmt = $db_obj->prepare($sql); // prepare bereitet die SQL-Abfrage vor
        $stmt->bind_param("ssss", $title, $beschreibung, $ort, $ablaufdatum);
        $stmt->execute();
        // last inserted id
        $sql = 'SELECT LAST_INSERT_ID() id';
        $aid = $db_obj->query($sql)->fetch_array()["id"]; // fetch_array gibt ein Array zurück, das die Spalten der Abfrage enthält
        return $aid;
    }

    private static function saveCommentToDB($aid, $name, $comment)
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            return;
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
            return;
        }

        $sql = "INSERT INTO `voting` (`TID`, `Name`) VALUES (?, ?)";
        $stmt = $db_obj->prepare($sql);

        foreach ($votings as $tId) {
            $stmt->bind_param("is", $tId, $name);
            $stmt->execute();
        }
    }

    private static function saveAllTermine($termine)
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            return;
        }

        $sql = "INSERT INTO `termine` (`AID`, `Datum`, `UhrzeitVon`, `UhrzeitBis`) VALUES (?, ?, ?, ?)";
        $stmt = $db_obj->prepare($sql);

        foreach ($termine as $termin) {
            $stmt->bind_param("isss", $termin->aid, $termin->datum, $termin->uhrzeitVon, $termin->uhrzeitBis);
            $stmt->execute();
        }
        return $termine;
    }

    private static function getAllAppointments()
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            return;
        }

        $sql = "SELECT * FROM `appointments` ORDER BY `Ablaufdatum`";
        $result = $db_obj->query($sql);

        $appointmentArray = [];
        while ($line = $result->fetch_assoc()) {
            array_push($appointmentArray, new Appointment($line["AID"], $line["Title"], $line["Beschreibung"], $line["Ort"], $line["Ablaufdatum"])); //push fügt ein Element am Ende des Arrays hinzu
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

        $sql = "SELECT * FROM `termine` WHERE `AID` = ? ORDER BY `Datum`, `UhrzeitVon`, `UhrzeitBis`";
        $stmt = $db_obj->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result(); //get_result gibt das Ergebnis der SQL-Abfrage zurück

        $terminArray = [];
        while ($line = $result->fetch_assoc()) { //fetch_assoc gibt das Ergebnis der SQL-Abfrage als assoziatives Array zurück was in $line gespeichert wird um es dann in ein Termin-Objekt zu speichern
            array_push($terminArray, new Termin($line["TID"], $line["AID"], $line["Datum"], $line["UhrzeitVon"], $line["UhrzeitBis"]));
        }

        return count($terminArray) > 0 ? $terminArray : 1;
    }

    private static function getAllVotingsByAppointment($aid)
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            return;
        }

        $sql = "SELECT * FROM `termine` JOIN `voting` ON termine.TID = voting.TID WHERE `AID` = ? ORDER BY `VotingTime`, `Name`, `Datum`, `UhrzeitVon`, `UhrzeitBis`";

        $stmt = $db_obj->prepare($sql);
        $stmt->bind_param("i", $aid);
        $stmt->execute();
        $result = $stmt->get_result();

        $votingArray = [];
        while ($line = $result->fetch_assoc()) {
            array_push($votingArray, new Voting($line["VID"], $line["TID"], $line["Name"]));
        }

        return count($votingArray) > 0 ? $votingArray : 1;
    }

    private static function getAllCommentsByAppointment($aid)
    {
        global $db_host, $db_user, $db_password, $database;

        $db_obj = new mysqli($db_host, $db_user, $db_password, $database);

        if ($db_obj->connect_error) {
            return;
        }

        $sql = "SELECT * FROM `kommentare` WHERE `AID` = ? ORDER BY `Datum`";
        $stmt = $db_obj->prepare($sql);
        $stmt->bind_param("i", $aid);
        $stmt->execute();
        $result = $stmt->get_result();

        $commentArray = [];
        while ($line = $result->fetch_assoc()) {
            array_push($commentArray, new Kommentar($line["KID"], $line["AID"], $line["Name"], $line["Datum"], $line["Kommentar"]));
        }

        return count($commentArray) ? $commentArray : 1; // returnt das Kommentar-Array oder 1 falls kein Kommentar vorhanden ist
    }
}