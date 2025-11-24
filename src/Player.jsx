import React, { useEffect, useState } from "react";

function Player() {

  function handleClick(e) {

  }

  return (<div class="sidebar">
  <div class="sidebar-container">
    <div id="station-name" className="station-info">Example station</div>
    <div id="station-location" className="station-info">London, United Kingdom</div>
    <div id="station-stream" className="station-info">https://example.com</div>
  </div>

  <div class="sidebar-container">
    <button name="Play" className="player-button std-button" type="button" onClick={handleClick}>Play</button>
    <button name="Stop" className="player-button std-button" type="button" onClick={handleClick}>Stop</button>
    <button name="Random" className="player-button std-button" type="button" onClick={handleClick}>Random</button>
  </div>
  </div>
  );
}

export default Player;