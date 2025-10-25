/*--------------------------------------------------------------
  Awakening Heart : Enter Sequence
  Handles overlay removal, shader reveal, temple dissolve,
  background sound start, and audio button reveal.
  Version: 1.1 | Date: 2025-10-25
--------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  // Element references
  const overlay   = document.getElementById('overlay') || document.getElementById('oracleOverlay');
  const temple    = document.getElementById('temple-container');
  const enterBtn  = document.getElementById('temple-enter-button');
  const shaderW   = document.querySelector('.shader-wrapper');
  const bg        = document.getElementById('bgMusic');
  const btnSound  = document.getElementById('btnSound');
  const btnMute   = document.getElementById('btnMute');

  // --- helpers ---
  const fadeOverlayOut = () => {
    if (!overlay) return Promise.resolve();
    return new Promise(res => {
      gsap.to(overlay, {
        autoAlpha: 0, duration: 0.8, ease: "sine.inOut",
        onComplete: () => {
          overlay.style.display = 'none';
          res();
        }
      });
    });
  };

  const dissolveTemple = () => {
    if (!temple) return Promise.resolve();
    return new Promise(res => {
      gsap.to(temple, {
        autoAlpha: 0, duration: 1.0, ease: "sine.inOut",
        onComplete: () => {
          temple.style.display = 'none';
          res();
        }
      });
    });
  };

  const revealShader = () => {
    if (window.AHShader && typeof window.AHShader.reveal === 'function') {
      window.AHShader.reveal();
    } else if (shaderW) {
      gsap.to(shaderW, { autoAlpha: 1, duration: 1.0 });
    }
  };

  const fadeInAudio = async (targetVolume = 0.35, fade = 1.2) => {
    if (!bg) return;
    try {
      bg.muted = true;
      await bg.play();
      bg.pause();
      bg.currentTime = 0;
      bg.muted = false;
      bg.volume = 0;
      await bg.play();
      gsap.to(bg, { volume: targetVolume, duration: fade, ease: "sine.inOut" });
      // enable reactivity if available
      if (window.AHReactive && typeof AHReactive.initAudioReactive === 'function') {
        AHReactive.initAudioReactive(bg);
      }
    } catch (err) {
      console.warn('Audio start failed:', err);
    }
  };

  const revealAudioButtons = () => {
    if (window.AHPreload && typeof AHPreload.revealAudioButtons === 'function') {
      AHPreload.revealAudioButtons();
    }
  };

  // --- main enter click ---
  enterBtn?.addEventListener('click', async () => {
    enterBtn.style.pointerEvents = 'none';
    await fadeOverlayOut();
    revealShader();
    await dissolveTemple();
    await fadeInAudio(0.35, 1.2);
    revealAudioButtons();
  });

  // --- persistent audio controls ---
  btnSound?.addEventListener('click', async () => {
    if (!bg) return;
    if (bg.paused) {
      await fadeInAudio(0.35, 0.8);
    } else {
      gsap.to(bg, { volume: 0.35, duration: 0.4 });
    }
  });

  btnMute?.addEventListener('click', () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0.0, duration: 0.4, onComplete: () => bg.pause() });
  });

  // --- initialize shader wrapper state ---
  if (shaderW) {
    shaderW.style.opacity = '0';
    shaderW.style.visibility = 'hidden';
    shaderW.style.display = 'block';
    shaderW.style.pointerEvents = 'none';
  }
});
