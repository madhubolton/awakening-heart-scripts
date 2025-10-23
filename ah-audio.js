/*--------------------------------------------------------------
  Awakening Heart : Audio Control
  Handles ambient soundtrack unlock + mode buttons.
  Version: 1.0 | Date: 2025-10-21
--------------------------------------------------------------*/
document.addEventListener('DOMContentLoaded', () => {
  const btnSound  = document.getElementById('btnSound');
  const btnSilent = document.getElementById('btnSilent');
  const bg        = document.getElementById('bgMusic');

  const fadeIn = () => gsap.to(bg, { volume: 0.35, duration: 1.2 });

  btnSound?.addEventListener('click', async () => {
  try {
    // ensure we start clean
    bg.pause();
    bg.currentTime = 0;
    bg.muted = false;
    bg.volume = 0;

    await bg.play();                  // start playback once
    gsap.to(bg, { volume: 0.35, duration: 1.2 });  // fade in
    console.log('🎶 Audio started');

    window.AHReactive?.initAudioReactive(bg);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }

  window.AHOverlay?.hide();
  window.AHShader?.reveal();
});

  btnSilent?.addEventListener('click', () => {
    bg.pause();
    window.AHOverlay?.hide();
    window.AHShader?.reveal();
  });
});// JavaScript Document
