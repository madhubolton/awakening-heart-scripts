/*--------------------------------------------------------------
  Awakening Heart : Audio Control (Toggle Version)
  Version: 3.0 | Date: 2025-10-29
  Handles ambient soundtrack unlock + mute toggle.
  Notes:
  - Replaces btnSound / btnSilent with single btnAudio
  - Fades audio smoothly in/out using GSAP
  - Swaps SVG icons (iconOn / iconOff) for visual feedback
  - Requires <audio id="bgMusic"> element in Webflow embed
--------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  const btnAudio = document.getElementById('btnAudio');
  const iconOn   = document.getElementById('iconOn');
  const iconOff  = document.getElementById('iconOff');
  const bg       = document.getElementById('bgMusic');

  if (!bg || !btnAudio) {
    console.warn('🎧 Missing audio elements (btnAudio or bgMusic).');
    return;
  }

  let isPlaying = false;

  const fadeIn  = () => gsap.to(bg, { volume: 0.35, duration: 1.2, ease: 'sine.inOut' });
  const fadeOut = () => gsap.to(bg, { volume: 0, duration: 0.8,  ease: 'sine.inOut', onComplete: () => bg.pause() });

  btnAudio.addEventListener('click', async () => {
    try {
      if (!isPlaying) {
        // prepare + unlock audio context
        bg.pause();
        bg.currentTime = 0;
        bg.muted = false;
        bg.volume = 0;

        // required for browser gesture unlock
        await bg.play();
        fadeIn();
        console.log('🎶 Audio started');

        // optional interface hooks
        window.AHOverlay?.hide?.();
        window.AHShader?.reveal?.();
      } else {
        fadeOut();
        console.log('🔇 Audio paused');
      }

      // toggle playback state + icons
      isPlaying = !isPlaying;
      iconOn.style.display  = isPlaying ? 'none'  : 'block';
      iconOff.style.display = isPlaying ? 'block' : 'none';
    } catch (e) {
      console.warn('Audio toggle error:', e);
    }
  });
});
