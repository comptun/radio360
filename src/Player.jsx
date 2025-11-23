import React, { useEffect, useState } from "react";

function Player() {

    return <div id="player">
      <div id="station-name" className="station-info">Example station</div>
      <div id="station-location" className="station-info">London, United Kingdom</div>
      <div id="station-stream" className="station-info">https://example.com</div>
    </div>;
}

export default Player;