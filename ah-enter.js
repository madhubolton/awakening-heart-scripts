/*--------------------------------------------------------------
  Awakening Heart : Enter Sequence
  Adds pointer cursor + full-screen click area activation.
  Version: 1.3 | Date: 2025-10-27
--------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  const overlay   = document.getElementById('overlay') || document.getElementById('oracleOverlay');
  const temple    = document.getElementById('temple-container');
  const enterBtn  = document.getElementById('temple-enter-button');
  const shaderW   = document.querySelector('.shader-wrapper');
  const bg        = document.getElementById('bgMusic');
  const btnSound  = document.getElementById('btnSound');
  const btnMute   = document.getElementById('btnMute');
  const clickArea = document.getElementById('enter-click-area');

  // --- helpers -------------------------------------------------
  const fadeOverlayOut = () => !overlay ? Promise.resolve() :
    new Promise(res => {
      gsap.to(overlay, {
        autoAlpha: 0, duration: 0.8, ease: "sine.inOut",
        onComplete: () => { overlay.style.display = 'none'; res(); }
      });
    });

  const dissolveTemple = () => !temple ? Promise.resolve() :
    new Promise(res => {
      gsap.to(temple, {
        autoAlpha: 0, duration: 1.0, ease: "sine.inOut",
        onComplete: () => { temple.style.display = 'none'; res(); }
      });
    });

  const revealShader = () => {
    if (window.AHShader?.reveal) window.AHShader.reveal();
    else if (shaderW) gsap.to(shaderW, { autoAlpha: 1, duration: 1.0 });
  };

  const fadeInAudio = async (targetVolume = 0.35, fade = 1.2) => {
    if (!bg) return;
    try {
      bg.muted = false;
      bg.volume = 0;
      await bg.play();
      gsap.to(bg, { volume: targetVolume, duration: fade, ease: "sine.inOut" });
      if (window.AHReactive?.initAudioReactive)
        AHReactive.initAudioReactive(bg);
      console.log("🎶 Audio started successfully");
    } catch (err) {
      console.warn("Audio play blocked or failed:", err);
    }
  };

  const revealAudioButtons = () =>
    window.AHPreload?.revealAudioButtons?.();

  // --- entry activation ----------------------------------------
  const activateEntry = async () => {
    if (enterBtn) enterBtn.style.pointerEvents = 'none';
    if (clickArea) gsap.to(clickArea, { autoAlpha: 0, duration: 0.3, onComplete: () => clickArea.style.display = 'none' });
    await fadeOverlayOut();
    revealShader();
    await dissolveTemple();
    await fadeInAudio(0.35, 1.2);
    revealAudioButtons();
  };

  // --- event listeners -----------------------------------------
  enterBtn?.addEventListener('click', activateEntry);
  clickArea?.addEventListener('click', activateEntry);

  // --- persistent audio controls -------------------------------
  btnSound?.addEventListener('click', async () => {
    if (!bg) return;
    if (bg.paused) await fadeInAudio(0.35, 0.8);
    else gsap.to(bg, { volume: 0.35, duration: 0.4 });
  });

  btnMute?.addEventListener('click', () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0.0, duration: 0.4, onComplete: () => bg.pause() });
  });

  // --- initialization tweaks -----------------------------------
  if (shaderW) {
    shaderW.style.opacity = '0';
    shaderW.style.visibility = 'hidden';
    shaderW.style.display = 'block';
    shaderW.style.pointerEvents = 'none';
  }

  // ensure pointer cursor + fade-in for click layer
  if (enterBtn) enterBtn.style.cursor = 'pointer';
  if (clickArea) {
    clickArea.style.cursor = 'pointer';
    clickArea.style.display = 'block';
    gsap.set(clickArea, { autoAlpha: 0 });
    gsap.to(clickArea, { autoAlpha: 1, duration: 1.0, delay: 0.3 });
  }
});
