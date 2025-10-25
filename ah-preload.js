/*--------------------------------------------------------------
  Awakening Heart : Preload + UI Setup
  Updated for new audio-buttons + temple-enter-button
  Version: 1.1 | Date: 2025-10-25
--------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {

  // --- preload all core visual/audio assets here if desired ---
  const shaderW = document.querySelector('.shader-wrapper');
  const overlay = document.getElementById('overlay') || document.getElementById('oracleOverlay');
  const enter   = document.getElementById('temple-enter-button');
  const audioBtns = document.querySelector('.audio-buttons');
  const btnSound = document.getElementById('btnSound');
  const btnMute  = document.getElementById('btnMute');
  const bg       = document.getElementById('bgMusic');

  // --- initial visibility states ---
  if (shaderW) shaderW.style.opacity = '0';
  if (audioBtns) audioBtns.style.opacity = '0';
  if (enter) enter.style.opacity = '0';

  // --- simple preload complete simulation ---
  window.addEventListener('load', () => {
    // fade in enter button only after load
    if (enter) {
      gsap.to(enter, { autoAlpha: 1, duration: 1.0, delay: 0.3, ease: "sine.inOut" });
    }

    // keep audio buttons hidden until after entry
    if (audioBtns) {
      audioBtns.style.visibility = 'hidden';
      audioBtns.style.pointerEvents = 'none';
    }

    // optional: ensure bg audio element is silent & paused
    if (bg) {
      bg.pause();
      bg.volume = 0;
    }
  });

  // --- optional exposure for other modules ---
  window.AHPreload = {
    revealAudioButtons: () => {
      if (audioBtns) {
        audioBtns.style.visibility = 'visible';
        audioBtns.style.pointerEvents = 'auto';
        gsap.to(audioBtns, { autoAlpha: 1, duration: 0.6, ease: "sine.inOut" });
      }
    }
  };
});
