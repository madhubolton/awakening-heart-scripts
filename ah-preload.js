/*--------------------------------------------------------------
  Awakening Heart : Preload + UI Setup
  Waits for temple-enter-button before animating.
  Version: 2.0 | Date: 2025-10-29
  Notes:
  - Updated for single toggle audio button (btnAudio)
  - Keeps shader + overlay fade sequencing
  - Exposes AHPreload.revealAudioButton() for use after entry
--------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  const shaderW  = document.querySelector('.shader-wrapper');
  const overlay  = document.getElementById('overlay') || document.getElementById('oracleOverlay');
  const audioBtn = document.getElementById('btnAudio');
  const bg       = document.getElementById('bgMusic');

  // --- initial visibility states ---
  if (shaderW)  shaderW.style.opacity = '0';
  if (audioBtn) gsap.set(audioBtn, { autoAlpha: 0, pointerEvents: 'none' });

  // --- preload complete simulation ---
  window.addEventListener('load', () => {

    // 🔸 wait until the enter button exists, then fade it in
    const waitForEnter = () => {
      const enter = document.getElementById('temple-enter-button');
      if (enter) {
        gsap.to(enter, { autoAlpha: 1, duration: 1.0, delay: 0.3, ease: "sine.inOut" });
      } else {
        requestAnimationFrame(waitForEnter);
      }
    };
    waitForEnter();

    // ensure background audio silent & paused
    if (bg) {
      bg.pause();
      bg.volume = 0;
    }

    // keep audio button hidden until entry animation complete
    if (audioBtn) {
      audioBtn.style.visibility = 'hidden';
      audioBtn.style.pointerEvents = 'none';
    }
  });

  // --- globally available helper ---
  window.AHPreload = {
    revealAudioButton: () => {
      if (audioBtn) {
        audioBtn.style.visibility = 'visible';
        audioBtn.style.pointerEvents = 'auto';
        gsap.to(audioBtn, { autoAlpha: 1, duration: 0.6, ease: "sine.inOut" });
      }
    }
  };
});
