/*--------------------------------------------------------------
  Awakening Heart : Audio Control (Single Icon Enhanced)
  Version: 4.1 | Date: 2025-10-29
  Uses only iconOn with better visual states
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
  const fadeOut = () => gsap.to(bg, { volume: 0, duration: 0.8, ease: "sine.inOut", onComplete: () => bg.pause() });
  
  const waitForIcon = () => {
    const iconOn = document.getElementById('iconOn');
    if (iconOn) {
      console.log('✅ iconOn found, initializing single-icon mode');
      gsap.set(iconOn, { visibility: "visible", opacity: 1 });
      initAudioToggle(iconOn);
    } else {
      requestAnimationFrame(waitForIcon);
    }
  };
  
  const initAudioToggle = (icon) => {
    // Add a visual indicator wrapper if it doesn't exist
    const addSlashOverlay = () => {
      if (!icon.querySelector('.audio-slash')) {
        const slash = document.createElement('div');
        slash.className = 'audio-slash';
        slash.style.cssText = `
          position: absolute;
          width: 2px;
          height: 140%;
          background: currentColor;
          top: -20%;
          left: 50%;
          transform: translateX(-50%) rotate(-45deg);
          opacity: 0;
          pointer-events: none;
        `;
        icon.style.position = 'relative';
        icon.appendChild(slash);
        return slash;
      }
      return icon.querySelector('.audio-slash');
    };
    
    const slash = addSlashOverlay();
    
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
          // Show audio is ON by removing slash
          gsap.to(slash, { opacity: 0, duration: 0.3, ease: "sine.inOut" });
          gsap.to(icon, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 });
        } else {
          fadeOut();
          console.log('🔇 Audio paused');
          // Show audio is OFF by adding slash
          gsap.to(slash, { opacity: 1, duration: 0.3, ease: "sine.inOut" });
        }
        isPlaying = !isPlaying;
      } catch (e) {
        console.warn('Audio toggle error:', e);
      }
    });
    
    console.log('✅ Audio toggle ready with visual states!');
  };
  
  waitForIcon();
});
