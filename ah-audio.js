/*--------------------------------------------------------------
  Awakening Heart : Audio Control (Cross-fade Version)
  Version: 3.4 | Date: 2025-10-29
  FIXED: Better embed detection with extended timeout
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
  
  // 🔸 Enhanced: Wait longer for Webflow embeds with timeout
  let attempts = 0;
  const maxAttempts = 100; // Try for ~5 seconds
  
  const waitForIcons = () => {
    const iconOn  = document.getElementById('iconOn');
    const iconOff = document.getElementById('iconOff');
    
    attempts++;
    
    if (iconOn && iconOff) {
      console.log(`✅ Both icons found after ${attempts} attempts`);
      // Ensure they're both visible to GSAP
      gsap.set([iconOn, iconOff], { visibility: "visible", opacity: 1 });
      gsap.set(iconOff, { autoAlpha: 0 }); // start hidden
      initAudioToggle(iconOn, iconOff);
    } else if (attempts < maxAttempts) {
      // Log what we're still waiting for
      if (!iconOn) console.log(`⏳ Waiting for iconOn... (attempt ${attempts})`);
      if (!iconOff) console.log(`⏳ Waiting for iconOff... (attempt ${attempts})`);
      setTimeout(waitForIcons, 50); // Check every 50ms
    } else {
      console.error('❌ Timeout: Could not find both icons after 5 seconds');
      console.log('iconOn:', iconOn);
      console.log('iconOff:', iconOff);
      // Fallback: work with whatever we have
      if (iconOn) {
        console.log('📌 Falling back to single-icon mode');
        initSingleIconToggle(iconOn);
      }
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
        } else {
          fadeOut();
          console.log('🔇 Audio paused');
        }
        isPlaying = !isPlaying;
        
        // Cross-fade icons
        gsap.to(iconOn,  { autoAlpha: isPlaying ? 0 : 1, duration: 0.4, ease: "sine.inOut" });
        gsap.to(iconOff, { autoAlpha: isPlaying ? 1 : 0, duration: 0.4, ease: "sine.inOut" });
      } catch (e) {
        console.warn('Audio toggle error:', e);
      }
    });
    console.log('✅ Audio toggle initialized with both icons');
  };
  
  // Fallback for single icon
  const initSingleIconToggle = (icon) => {
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
          gsap.to(icon, { rotation: 180, duration: 0.4 });
        } else {
          fadeOut();
          console.log('🔇 Audio paused');
          gsap.to(icon, { rotation: 0, duration: 0.4 });
        }
        isPlaying = !isPlaying;
      } catch (e) {
        console.warn('Audio toggle error:', e);
      }
    });
    console.log('✅ Audio toggle initialized (single icon fallback)');
  };
  
  waitForIcons();
});
