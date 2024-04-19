<?php
include ("db/dataHandler.php");

class SimpleLogic
{

    private $dh;

    function __construct()
    {
        $this->dh = new DataHandler();
    }

    function handleRequest($method, $param)
    {
        switch ($method) {

            case "queryAppointments":
                $res = $this->dh->queryAppointments();
                break;

            case "queryAppointmentById":
                $res = $this->dh->queryAppointmentById($param);
                break;

            case "queryTermineByAppointmentId":
                $res = $this->dh->queryTermineByAppointmentId($param);
                break;

            case "saveVoting":
                $res = $this->dh->saveVoting(json_decode($param)); //json decode macht aus einem json string ein php objekt um damit arbeiten zu können
                break;

            case "queryAllVotingsByAppointmentId":
                $res = $this->dh->queryAllVotingsByAppointmentID($param);
                break;

            case "queryCommentsByAppointment":
                $res = $this->dh->queryCommentsByAppointment($param);
                break;

            case "saveAppointment":
                $res = $this->dh->saveAppointment(json_decode($param));
                break;

            case "deleteAppointment":
                $res = $this->dh->deleteAppointment($param);
                break;

            case "saveTermine":
                $res = $this->dh->saveTermine(json_decode($param));
                break;

            default:
                $res = null;
                break;
        }
        return $res;
    }
}
