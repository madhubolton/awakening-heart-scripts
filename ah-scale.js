/*--------------------------------------------------------------
  Awakening Heart : Scene Scaler
  Maintains a 16:9 frame ratio and centers the scene in viewport.
  Version: 1.0 | Date: 2025-10-21
--------------------------------------------------------------*/
function scaleScene() {
  const aspect = 16 / 9;
  const frame = document.querySelector('.Aspect-Frame');
  if (!frame) return;

  const ww = window.innerWidth;
  const wh = window.innerHeight;
  const windowRatio = ww / wh;

  if (windowRatio > aspect) {
    frame.style.width  = `${wh * aspect}px`;
    frame.style.height = `${wh}px`;
  } else {
    frame.style.width  = `${ww}px`;
    frame.style.height = `${ww / aspect}px`;
  }
  frame.style.top = '50%';
  frame.style.left = '50%';
  frame.style.transform = 'translate(-50%, -50%)';
}
window.addEventListener('resize', scaleScene);
window.addEventListener('load',  scaleScene);// JavaScript Document