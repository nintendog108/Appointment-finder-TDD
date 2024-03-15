<?php
class Appointment
{
  public $pId;
  public $title;
  public $ort;

  function __construct($id, $title, $ort)
  {
    $this->pId = $id;
    $this->title = $title;
    $this->ort = $ort;
  }
}
