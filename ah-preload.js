/*--------------------------------------------------------------
  Awakening Heart : Preload + UI Setup
  Waits for temple-enter-button before animating.
  Version: 2.0 | Date: 2025-10-31
  - Updated for new audio toggle icon system
--------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {

  const shaderW   = document.querySelector('.shader-wrapper');
  const overlay   = document.getElementById('overlay') || document.getElementById('oracleOverlay');
  const audioBtns = document.querySelector('.audio-buttons');
  const bg        = document.getElementById('bgMusic');

  // --- initial visibility states ---
  if (shaderW) shaderW.style.opacity = '0';
  if (audioBtns) audioBtns.style.opacity = '0';

  // --- preload complete simulation ---
  window.addEventListener('load', () => {

    // 📸 wait until the enter button actually exists
    const waitForEnter = () => {
      const enter = document.getElementById('temple-enter-button');
      if (enter) {
        gsap.to(enter, { autoAlpha: 1, duration: 1.0, delay: 0.3, ease: "sine.inOut" });
      } else {
        requestAnimationFrame(waitForEnter);
      }
    };
    waitForEnter();

    // hide audio buttons until after entry
    if (audioBtns) {
      audioBtns.style.visibility = 'hidden';
      audioBtns.style.pointerEvents = 'none';
    }

    // ensure background audio silent & paused
    if (bg) {
      bg.pause();
      bg.volume = 0;
    }
  });

  // --- helper exposed globally ---
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
