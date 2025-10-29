/*--------------------------------------------------------------
  Awakening Heart : Audio Control (Cross-fade Version)
  Version: 3.2 | Date: 2025-10-29
  Notes:
  - Works with Webflow Embed delays
  - Uses GSAP fade between icons
  - Requires:
      #btnAudio  → wrapper div
      #iconOn    → "sound on" embed
      #iconOff   → "sound off" embed
      #bgMusic   → <audio> element
--------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  const btnAudio = document.getElementById('btnAudio');
  const bg       = document.getElementById('bgMusic');

  if (!btnAudio || !bg) {
    console.warn('🎧 Missing #btnAudio or #bgMusic');
    return;
  }

  let isPlaying = false;

  const fadeIn  = () => gsap.to(bg, { volume: 0.35, duration: 1.2, ease: "sine.inOut" });
  const fadeOut = () => gsap.to(bg, { volume: 0, duration: 0.8,  ease: "sine.inOut", onComplete: () => bg.pause() });

  // 🔸 Wait until Webflow embeds are ready
  const waitForIcons = () => {
    const iconOn  = document.getElementById('iconOn');
    const iconOff = document.getElementById('iconOff');

    if (iconOn && iconOff) {
      // Ensure they’re both visible to GSAP
      gsap.set([iconOn, iconOff], { visibility: "visible", opacity: 1 });
      gsap.set(iconOff, { autoAlpha: 0 }); // start hidden
      initAudioToggle(iconOn, iconOff);
    } else {
      requestAnimationFrame(waitForIcons);
    }
  };

  const initAudioToggle = (iconOn, iconOff) => {
    btnAudio.addEventListener('click', async () => {
      try {
        if (!isPlaying) {
          bg.pause();
          bg.currentTime = 0;
          bg.muted = false;
          bg.volume = 0;
          await bg.play();
          fadeIn();
          console.log('🎶 Audio started');

          // optional system hooks
          window.AHOverlay?.hide?.();
          window.AHShader?.reveal?.();
        } else {
          fadeOut();
          console.log('🔇 Audio paused');
        }

        isPlaying = !isPlaying;

        // cross-fade icons
        gsap.to(iconOn,  { autoAlpha: isPlaying ? 0 : 1, duration: 0.4, ease: "sine.inOut" });
        gsap.to(iconOff, { autoAlpha: isPlaying ? 1 : 0, duration: 0.4, ease: "sine.inOut" });
      } catch (e) {
        console.warn('Audio toggle error:', e);
      }
    });
  };

  waitForIcons();
});
