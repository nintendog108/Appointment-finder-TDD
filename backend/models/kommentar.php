<?php
class Kommentar
{
  public $kId;
  public $aId;
  public $name;
  public $datum;
  public $kommentar;
  function __construct($kid, $aid, $name, $datum, $kommentar)
  {
    $this->kId = $kid;
    $this->aId = $aid;
    $this->name = $name;
    $this->datum = $datum;
    $this->kommentar = $kommentar;
  }
}
