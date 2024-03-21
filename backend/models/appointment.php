<?php
class Appointment
{
  public $aId;
  public $title;
  public $ort;

  function __construct($id, $title, $ort)
  {
    $this->aId = $id;
    $this->title = $title;
    $this->ort = $ort;
  }
}
