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

// Canvas events are initialised after canvas element has loaded
function InitCanvasEvents(canvas) {
  // Zooming in/out of globe
  canvas.addEventListener("wheel", (event) => { 
    let delta = event.deltaY * 0.01;
    zoomExp += delta;
    zoom = Math.pow(2, zoomExp);
  })

  // Canvas is being dragged or not
  canvas.addEventListener("mousedown", () => dragging = true);
  canvas.addEventListener("mouseup", () => dragging = false);

  // Radio station has been clicked on or not
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

  // Mouse position is updated on mouse move, and delta is added to seperate mouse pos
  // variable that tracks how much the camera has rotated the globe by
  canvas.addEventListener("mousemove", (e) => {
      mousePos = {"x":e.clientX, "y":e.clientY};
      if (dragging) {
        // Sensitivity of globe movement is proportional to the current zoom level
        mouse.x   += e.movementX * 0.005 * zoom;
        mouse.y -= e.movementY * 0.005 * zoom;


        // Clamp the pitch rotation
        mouse.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, mouse.y));
      }
  });
}

// Canvas resizes to new size of window
window.addEventListener("resize", function(event) {
  gfx.recalculateCanvasSize();
})

// Main app component for react web app
function App() {
  // Stores the state of the user whether logged in or out
  const [user, setUser] = useState(null);

  // Runs once on the first render once the app component is mounted
  useEffect(() => {

    // Load and set user data if logged in
    async function loadUser() {
      const u = await User.GetUser();
      if (u != null) {
        setUser(u.data);
      }
    }
    loadUser();

    // Initialise canvas events now that the canvas is loaded
    InitCanvasEvents(gfx.canvas);
    // Initialise radio station points with longitude and latitude on globe
    InitStations();
    // Create geometry mesh needed to draw all radio station points with one draw call by rendering it as GL_POINTS
    gfx.createStations();

    console.log("App initialised")
  }, []);

  // Main draw function for the canvas, called every frame
  const draw = (frameCount) => {

    // Set mouse delta, pos and zoom to be passed to shaders
    gfx.setMouseDelta(mouse);
    gfx.setMousePos(mousePos);
    gfx.setZoom(zoom);

    // Bind default framebuffer to render directly to the canvas
    gfx.bindFramebuffer(null);

    // Clear with black colour, and set viewport dimensions
    gfx.clear([0.0,0.0,0.0,1.0], gfx.canvas.width,gfx.canvas.height);

    // Reset mvp matrix and draw planet with shader
    gfx.resetMatrix();
    gfx.scale(gfx.canvas.height * 1.0 / zoom, gfx.canvas.height * 1.0 / zoom);
    gfx.translate(gfx.canvas.width / 2, gfx.canvas.height / 2, 5);
    
    gfx.drawPlanet();
    
    // Reset mvp matrix and draw islands
    gfx.resetMatrix();
    gfx.scale(-gfx.canvas.height * 0.478 * 1.0 / zoom, gfx.canvas.height * 0.478 * 1.0 / zoom);
    gfx.translate(gfx.canvas.width / 2, gfx.canvas.height / 2, 5);
    gfx.rotate(mouse.y, [1,0,0]);
    gfx.rotate(mouse.x, [0,1,0]);
    
    gfx.drawIslands();

    // Do the same thing, this time with the outline
    gfx.resetMatrix();
    gfx.scale(-gfx.canvas.height * 0.478 * 1.0 / zoom, gfx.canvas.height * 0.478 * 1.0 / zoom);
    gfx.translate(gfx.canvas.width / 2, gfx.canvas.height / 2, 5.1);
    gfx.rotate(mouse.y, [1,0,0]);
    gfx.rotate(mouse.x, [0,1,0]);
    
    gfx.drawIslandsOutline();

    // Same thing but with the radio station points
    gfx.resetMatrix();
    gfx.scale(-gfx.canvas.height * 0.48 * 1.0 / zoom, gfx.canvas.height * 0.48 * 1.0 / zoom);
    gfx.translate(gfx.canvas.width / 2, gfx.canvas.height / 2, 10);
    gfx.rotate(mouse.y, [1,0,0]);
    gfx.rotate(mouse.x, [0,1,0]);

    gfx.drawStations();

  }

  // Initialises radio station data with longitude, latitude, station name, country, city, and radio stream link
  function InitStations() {
    let index = 0;
    // Go through all countries and draw their stations
    for (let countryId = 0; countryId < station.length; countryId++) {
      for (let stationId = 0; stationId < station[countryId]["stations"].length; stationId++) {

        let data = station[countryId]["stations"][stationId];

        gfx.addStationPoint(data["lon"], data["lat"], data);
        index += 1;
      }
    }
  }

  // Handles login/logout
  function handleLogin(userObj) {
    setUser(userObj);
  }

  function handleLogout() {
    setUser(null);
    User.Logout();
  }

  // Renders elements into main root element
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Player></Player>
      <Topbar user={user} onLogin={handleLogin} onLogout={handleLogout}></Topbar>
      <Canvas id="game" draw={draw} />
    </div>
  );
}

export default App;