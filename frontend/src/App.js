import React, { useEffect, useState } from "react";
import Canvas from './Canvas';
import gfx from './gfx';

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

    gfx.clear();
    

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
