<?php
class Voting
{
  public $vId;
  public $tId;
  public $name;

  function __construct($vid, $tid, $name)
  {
    $this->vId = $vid;
    $this->tId = $tid;
    $this->name = $name;
  }
}
