<?php
class Termin
{
  public $tId;
  public $aId;
  public $datum;
  public $uhrzeitVon;
  public $uhrzeitBis;

  function __construct($id, $aid, $datum, $uhrzeitVon, $uhrzeitBis)
  {
    $this->tId = $id;
    $this->aId = $aid;
    $this->datum = $datum;
    $this->uhrzeitVon = $uhrzeitVon;
    $this->uhrzeitBis = $uhrzeitBis;
  }
}
