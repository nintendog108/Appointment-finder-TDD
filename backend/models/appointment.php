<?php
class Appointment
{
  public $aId;
  public $title;
  public $desc;
  public $ort;
  public $ablaufdatum;

  function __construct($id, $title, $desc, $ort, $ablaufdatum)
  {
    $this->aId = $id;
    $this->title = $title;
    $this->desc = $desc;
    $this->ort = $ort;
    $this->ablaufdatum = $ablaufdatum;
  }
}
