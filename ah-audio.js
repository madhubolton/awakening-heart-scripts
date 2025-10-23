/*--------------------------------------------------------------
  Awakening Heart : Audio Control
  Handles ambient soundtrack unlock + mode buttons.
  Version: 1.1 | Date: 2025-10-24
--------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  const btnSound  = document.getElementById('btnSound');
  const btnSilent = document.getElementById('btnSilent');
  const bg        = document.getElementById('bgMusic');

  const fadeIn = () => gsap.to(bg, { volume: 0.35, duration: 1.2 });

  // SOUND ON
  btnSound?.addEventListener('click', async () => {
    try {
      // ensure we start clean
      bg.pause();
      bg.currentTime = 0;
      bg.muted = false;
      bg.volume = 0;

      // play once (user gesture)
      await bg.play();
      fadeIn();
      console.log('🎶 Audio started');

      // wait for playback to be active before attaching analyser
      setTimeout(() => {
        try {
          if (bg.currentTime > 0 && !bg.paused) {
            window.AHReactive?.initAudioReactive(bg);
            console.log('🎧 Audio reactive engine connected');
          }
        } catch (err) {
          console.warn('Audio reactive init deferred:', err);
        }
      }, 1000);

      window.AHOverlay?.hide();
      window.AHShader?.reveal();
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  });

  // SOUND OFF
  btnSilent?.addEventListener('click', () => {
    try {
      bg.pause();
      window.AHOverlay?.hide();
      window.AHShader?.reveal();
      console.log('🔇 Audio stopped');
    } catch (e) {
      console.warn('Error stopping audio:', e);
    }
  });
});
