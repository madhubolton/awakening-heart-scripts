/*--------------------------------------------------------------
  Awakening Heart : Enter (BASIC)
  - Fades in the Enter SVG from code
  - Allows "click anywhere" via a one-time global listener
  - Runs overlay → shader → temple → audio → show audio buttons
  Version: 1.5 | 2025-10-27
--------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  // Core refs (IDs match your current page)
  const overlay   = document.getElementById('overlay') || document.getElementById('oracleOverlay');
  const temple    = document.getElementById('temple-container');
  const shaderW   = document.querySelector('.shader-wrapper');
  const bg        = document.getElementById('bgMusic');

  // UI refs
  const enterBtn  = document.getElementById('temple-enter-button');
  const audioUI   = document.querySelector('.audio-buttons');
  const btnSound  = document.getElementById('btnSound');
  const btnMute   = document.getElementById('btnMute');

  // Safety log
  console.log('AH Enter basic init:', { overlay, temple, shaderW, bg, enterBtn, audioUI });

  // --- initial state (do NOT rely on Designer) ----------------
  if (enterBtn) {
    gsap.set(enterBtn, { autoAlpha: 0 });  // hidden until we fade it in
    enterBtn.style.cursor = 'pointer';
    enterBtn.style.zIndex = '9999';        // keep on top
    enterBtn.style.pointerEvents = 'auto';
  }
  if (audioUI) {
    audioUI.style.visibility = 'hidden';
    audioUI.style.pointerEvents = 'none';
    gsap.set(audioUI, { autoAlpha: 0 });
  }
  if (shaderW) {
    shaderW.style.opacity = '0';
    shaderW.style.visibility = 'hidden';
    shaderW.style.display = 'block';
    shaderW.style.pointerEvents = 'none';
  }
  if (bg) {
    bg.pause();
    bg.volume = 0;
    bg.muted = false;
  }

  // --- helpers -------------------------------------------------
  const fadeOverlayOut = () => !overlay ? Promise.resolve() :
    new Promise(res => gsap.to(overlay, {
      autoAlpha: 0, duration: 0.8, ease: 'sine.inOut',
      onComplete: () => { overlay.style.display = 'none'; res(); }
    }));

  const dissolveTemple = () => !temple ? Promise.resolve() :
    new Promise(res => gsap.to(temple, {
      autoAlpha: 0, duration: 1.0, ease: 'sine.inOut',
      onComplete: () => { temple.style.display = 'none'; res(); }
    }));

  const revealShader = () => {
    if (window.AHShader?.reveal) window.AHShader.reveal();
    else if (shaderW) gsap.to(shaderW, { autoAlpha: 1, duration: 1.0 });
  };

  const fadeInAudio = async (target = 0.35, dur = 1.2) => {
    if (!bg) return;
    try {
      await bg.play(); // after a real user click this will succeed
      gsap.to(bg, { volume: target, duration: dur, ease: 'sine.inOut' });
      if (window.AHReactive?.initAudioReactive) AHReactive.initAudioReactive(bg);
      console.log('🎶 audio started');
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  };

  const revealAudioButtons = () => {
    if (!audioUI) return;
    audioUI.style.visibility = 'visible';
    audioUI.style.pointerEvents = 'auto';
    gsap.to(audioUI, { autoAlpha: 1, duration: 0.6 });
  };

  // --- one unified entry action --------------------------------
  const activateEntry = async () => {
    if (!window.__AH_ENTERED) {
      window.__AH_ENTERED = true; // guard against double triggers
      document.removeEventListener('click', globalClickOnce, true);
      if (enterBtn) enterBtn.style.pointerEvents = 'none';

      await fadeOverlayOut();
      revealShader();
      await dissolveTemple();
      await fadeInAudio(0.35, 1.2);
      revealAudioButtons();
      console.log('🚪 Enter sequence complete');
    }
  };

  // --- fade in the button and arm "click anywhere" -------------
  let ready = false;
  window.addEventListener('load', () => {
    if (enterBtn) gsap.to(enterBtn, { autoAlpha: 1, duration: 0.9, delay: 0.2 });
    // arm global click only after the Enter is visible
    setTimeout(() => { ready = true; }, 400);
  });

  // one-time global click (anywhere)
  function globalClickOnce(e) {
    if (!ready) return; // ignore early clicks during load
    // ignore clicks on audio controls so they don't start the scene
    if (e.target && audioUI && audioUI.contains(e.target)) return;
    activateEntry();
  }
  document.addEventListener('click', globalClickOnce, true);

  // specific Enter button click
  enterBtn?.addEventListener('click', (e) => { e.stopPropagation(); activateEntry(); });

  // --- persistent audio toggles --------------------------------
  btnSound?.addEventListener('click', async () => {
    if (!bg) return;
    if (bg.paused) await fadeInAudio(0.35, 0.6);
    else gsap.to(bg, { volume: 0.35, duration: 0.3 });
  });
  btnMute?.addEventListener('click', () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
  });
});
