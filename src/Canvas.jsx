import React, { useRef, useEffect } from 'react'
import gfx from './gfx';

let started = false;

// Canvas element for rendering graphics onto
const Canvas = props => {
  
  const { draw, ...rest } = props;
  const canvasRef = useRef(null);
  
  // Runs every frame and draws the canvas
  useEffect(() => {

    const canvas = canvasRef.current;

    // Initialises the WebGL graphics api if it hasn't been already, now that the canvas is loaded
    if (!started) {
      started = true;
      gfx.start(canvas);
    }

    let frameCount = 0;
    let animationFrameId;
    
    // Draw loop
    const render = () => {
      frameCount++;
      draw(frameCount);
      animationFrameId = window.requestAnimationFrame(render);
    }
    render();
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    }
  }, [draw]);
  
  // Returns the canvas element
  return <canvas ref={canvasRef} {...rest}/>;
}

export default Canvas