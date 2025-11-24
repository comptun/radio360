import React, { useEffect, useState } from "react";
import Canvas from './Canvas';
import Register from './Register'
import Login from './Login'
import Player from './Player'
import Topbar from './Topbar'
import User from './User'
import gfx from './gfx';
import station from './data/stations.json'

let mouse = { "x": 0, "y": 0 };
let mousePos = { "x": 0, "y": 0 };
let zoom = 1;
let zoomExp = 0;
let playingSound = new Audio();

let dragging = false;
let init = false;

function InitCanvasEvents(canvas) {
  canvas.addEventListener("wheel", (event) => { 
    let delta = event.deltaY * 0.01;
    zoomExp += delta; // scrolling up increases zoom
    zoom = Math.pow(2, zoomExp);
  })

  canvas.addEventListener("mousedown", () => dragging = true);
  canvas.addEventListener("mouseup", () => dragging = false);

  canvas.addEventListener("click", (event) => {
    let data = gfx.clickScreen(mousePos);

    if (data != null) {
      playingSound.src = data["stream"];
      playingSound.load();
      playingSound.play();
      console.log("playing");

      document.getElementById("station-name").innerHTML = data["name"];
      document.getElementById("station-location").innerHTML = data["location"];
      document.getElementById("station-stream").innerHTML = data["stream"];
    }
  });

  canvas.addEventListener("mousemove", (e) => {
      mousePos = {"x":e.clientX, "y":e.clientY};
      if (dragging) {
          mouse.x   += e.movementX * 0.005 * zoom;
          mouse.y -= e.movementY * 0.005 * zoom;


          // clamp pitch so it never flips
          mouse.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, mouse.y));
      }
  });
}

window.addEventListener("resize", function(event) {
  gfx.recalculateCanvasSize();
})

function InitStations() {
  let index = 0;
  for (let countryId = 0; countryId < station.length; countryId++) {
    for (let stationId = 0; stationId < station[countryId]["stations"].length; stationId++) {

      let data = station[countryId]["stations"][stationId];

      gfx.addStationPoint(data["lon"], data["lat"], data);
      index += 1;
    }
  }
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {

    async function loadUser() {
      const u = await User.GetUser();   // if it returns a Promise
      setUser(u);
      console.log(u);
    }
    loadUser();

    InitCanvasEvents(gfx.canvas);
    InitStations();
    gfx.createStations();
    console.log("App initialised")
  }, []);

  const draw = (frameCount) => {

    gfx.setMouseDelta(mouse);
    gfx.setMousePos(mousePos);
    gfx.setZoom(zoom);

    gfx.bindFramebuffer(null);

    gfx.clear([0.0,0.0,0.0,1.0], gfx.canvas.width,gfx.canvas.height);

    gfx.resetMatrix();
    gfx.scale(gfx.canvas.height * 1.0 / zoom, gfx.canvas.height * 1.0 / zoom);
    gfx.translate(gfx.canvas.width / 2, gfx.canvas.height / 2, 5);
    
    gfx.drawPlanet();
    
    gfx.resetMatrix();
    gfx.scale(-gfx.canvas.height * 0.478 * 1.0 / zoom, gfx.canvas.height * 0.478 * 1.0 / zoom);
    gfx.translate(gfx.canvas.width / 2, gfx.canvas.height / 2, 5);
    gfx.rotate(mouse.y, [1,0,0]);
    gfx.rotate(mouse.x, [0,1,0]);
    
    gfx.drawIslands();

    gfx.resetMatrix();
    gfx.scale(-gfx.canvas.height * 0.478 * 1.0 / zoom, gfx.canvas.height * 0.478 * 1.0 / zoom);
    gfx.translate(gfx.canvas.width / 2, gfx.canvas.height / 2, 5.1);
    gfx.rotate(mouse.y, [1,0,0]);
    gfx.rotate(mouse.x, [0,1,0]);
    
    gfx.drawIslandsOutline();

    gfx.resetMatrix();
    gfx.scale(-gfx.canvas.height * 0.48 * 1.0 / zoom, gfx.canvas.height * 0.48 * 1.0 / zoom);
    gfx.translate(gfx.canvas.width / 2, gfx.canvas.height / 2, 10);
    gfx.rotate(mouse.y, [1,0,0]);
    gfx.rotate(mouse.x, [0,1,0]);
    //gfx.rotate(90.0, [1,0,0]);
    gfx.drawStations();

  }

  function handleLogin(userObj) {
    setUser(userObj);
  }

  function handleLogout() {
    setUser(null);
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Player></Player>
      <Topbar user={user} onLogin={handleLogin} onLogout={handleLogout}></Topbar>
      <Canvas id="game" draw={draw} />
    </div>
  );
}

export default App;