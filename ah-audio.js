/*--------------------------------------------------------------
  Awakening Heart : Audio Control
  Handles ambient soundtrack unlock and mute functions.
  Version: 2.0 | Date: 2025-10-24
  Notes:
  - Simplified for stable playback (no audio-reactive logic)
  - Requires <audio id="bgMusic"> element in Webflow embed
  - Works reliably with user gesture (Sound On button)
--------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  const btnSound  = document.getElementById('btnSound');
  const btnSilent = document.getElementById('btnSilent');
  const bg        = document.getElementById('bgMusic');

  if (!bg) {
    console.warn('🎧 No element with id="bgMusic" found.');
    return;
  }

  const fadeIn = () => gsap.to(bg, { volume: 0.35, duration: 1.2 });
  const fadeOut = () => gsap.to(bg, { volume: 0, duration: 0.8 });

  // SOUND ON
  btnSound?.addEventListener('click', async () => {
    try {
      // reset and prepare
      bg.pause();
      bg.currentTime = 0;
      bg.muted = false;
      bg.volume = 0;

      // start playback once (must be user initiated)
      await bg.play();
      fadeIn();
      console.log('🎶 Audio started');

      // optional interface calls
      window.AHOverlay?.hide();
      window.AHShader?.reveal();
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  });

  // SOUND OFF
  btnSilent?.addEventListener('click', () => {
    try {
      fadeOut();
      setTimeout(() => bg.pause(), 800);
      console.log('🔇 Audio paused');
    } catch (e) {
      console.warn('Error stopping audio:', e);
    }
  });
});
