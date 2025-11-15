import React, { useEffect, useState } from "react";
import Canvas from './Canvas';
import gfx from './gfx';


let mouse = { "x": 0, "y": 0 };
let zoom = 1;
let zoomExp = 0;

let dragging = false;

window.addEventListener("wheel", (event) => { 
  let delta = event.deltaY * 0.01;
  zoomExp += delta; // scrolling up increases zoom
  zoom = Math.pow(2, zoomExp);
})

window.addEventListener("mousedown", () => dragging = true);
window.addEventListener("mouseup", () => dragging = false);

window.addEventListener("mousemove", (e) => {
    if (dragging) {
        mouse.x   += e.movementX * 0.005;
        mouse.y -= e.movementY * 0.005;


        // clamp pitch so it never flips
        mouse.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, mouse.y));
    }
});

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("/api/message")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => {
        console.error("Fetch error:", err);
        setMessage("Failed to load message 😢");
      });
  }, []);

  const draw = (frameCount) => {

    gfx.setMousePos(mouse);
    gfx.setZoom(zoom);

    gfx.bindFramebuffer(gfx.getIslandsFramebuffer().framebuffer);
    gfx.clear([0.4,0.6,1.0,1.0], gfx.getMapScale().x*2000,gfx.getMapScale().y*2000);
    
    gfx.resetMatrix();
    gfx.scale(gfx.getMapScale().x, -gfx.getMapScale().y);
    gfx.translate(gfx.canvas.width / 2, gfx.canvas.height / 2, 1);
    gfx.rotate(0, [0,0,0]);
    gfx.drawIslands();

    gfx.bindFramebuffer(null);
    gfx.clear([1.0,1.0,1.0,1.0], gfx.canvas.width, gfx.canvas.height);

    gfx.resetMatrix();
    gfx.translate(gfx.canvas.width / 2, gfx.canvas.height / 2, 0);
    gfx.rotate(0, [0,0,0]);
    gfx.scale(gfx.canvas.width, gfx.canvas.height);
    gfx.drawPlanet();
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas id="game" draw={draw} />
    </div>
  );
}

export default App;