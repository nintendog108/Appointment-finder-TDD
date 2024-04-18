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
                $res = $this->dh->saveVoting(json_decode($param));
                break;

            case "queryAllVotingsByAppointmentId":
                $res = $this->dh->queryAllVotingsByAppointmentID($param);
                break;

            case "queryCommentsByAppointment":
                $res = $this->dh->queryCommentsByAppointment($param);
                break;

            default:
                $res = null;
                break;
        }
        return $res;
    }
}
