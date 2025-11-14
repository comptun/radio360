import React, { useRef, useEffect } from 'react'
import gfx from './gfx';

let started = false;

const Canvas = props => {
  
  const { draw, ...rest } = props;
  const canvasRef = useRef(null);
  
  useEffect(() => {

    const canvas = canvasRef.current;
    if (!started) {
      started = true;
      gfx.start(canvas);
    }

    let frameCount = 0;
    let animationFrameId;
    
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
  
  return <canvas ref={canvasRef} {...rest}/>;
}

export default Canvas