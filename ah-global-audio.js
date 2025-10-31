/*--------------------------------------------------------------
  Awakening Heart : Global Audio Control (Scene-Specific)
  Version: 2.0 | Date: 2025-10-31
  
  Loads scene-specific audio file and applies user's play/pause preference.
  Each scene has different audio from Cloudflare.
  
  Required Elements:
  - <audio id="bgMusic"> with data-scene-audio attribute OR src
  - Audio toggle button with ID "audioToggle"
  - Icon (svg or .icon-On) inside audioToggle
  
  Usage in HTML:
  <audio id="bgMusic" data-scene-audio="https://your-cloudflare-url/scene2-audio.mp3" loop preload="auto">
    <source src="https://your-cloudflare-url/scene2-audio.mp3" type="audio/mpeg">
  </audio>
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🎵 Global Audio Control initialized (v2.0 - Scene Specific)");

  // ------- Core DOM -------
  const bg = document.getElementById("bgMusic");
  const audioToggle = document.getElementById("audioToggle");
  const icon = audioToggle?.querySelector('svg') || audioToggle?.querySelector('.icon-On');
  const audioUI = document.querySelector(".audio-buttons");

  if (!bg) {
    console.warn("⚠️ No audio element found (id='bgMusic')");
    return;
  }

  if (!audioToggle) {
    console.warn("⚠️ No audio toggle found (id='audioToggle')");
    return;
  }

  // Get scene-specific audio URL (from data attribute or src)
  const sceneAudioUrl = bg.getAttribute('data-scene-audio') || bg.src;
  console.log("🎼 Scene audio URL:", sceneAudioUrl);

  console.log("🧩 Elements found:", { bg, audioToggle, icon, audioUI, sceneAudioUrl });

  // ------- Initial setup -------
  gsap.set(audioUI || audioToggle, { autoAlpha: 0, pointerEvents: "none" });
  if (icon) gsap.set(icon, { opacity: 0.4 });

  // ------- Restore audio state and load scene audio -------
  const initAudio = async () => {
    if (!window.AHAudioState) {
      console.warn("⚠️ AHAudioState not loaded, audio will not persist");
      // Show UI anyway so user can control audio
      gsap.to(audioUI || audioToggle, { 
        autoAlpha: 1, 
        duration: 0.6,
        delay: 0.3,
        onStart: () => {
          gsap.set(audioUI || audioToggle, { pointerEvents: "auto" });
        }
      });
      return;
    }

    // Initialize with stored state and scene-specific audio
    const wasPlaying = await window.AHAudioState.initAudio(bg, icon, sceneAudioUrl);
    
    // Show audio UI
    gsap.to(audioUI || audioToggle, { 
      autoAlpha: 1, 
      duration: 0.6,
      delay: 0.3,
      onStart: () => {
        gsap.set(audioUI || audioToggle, { pointerEvents: "auto" });
      }
    });

    if (wasPlaying) {
      console.log("▶️ Scene audio playing (user preference: ON)");
    } else {
      console.log("⏸️ Scene audio paused (user preference: OFF)");
    }
  };

  // Small delay to ensure page is ready and audio can load
  setTimeout(initAudio, 100);

  // ------- Audio Toggle Control -------
  audioToggle.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!bg) return;
    
    // Use persistent state manager if available
    if (window.AHAudioState) {
      await window.AHAudioState.toggle(bg, icon);
    } else {
      // Fallback to local toggle
      console.warn("AHAudioState not found, using local toggle");
      const isPlaying = !bg.paused;
      
      if (isPlaying) {
        gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
        if (icon) gsap.to(icon, { opacity: 0.4, duration: 0.3 });
      } else {
        try {
          if (bg.paused) await bg.play();
          gsap.to(bg, { volume: 0.35, duration: 0.3 });
          if (icon) gsap.to(icon, { opacity: 1, duration: 0.3 });
        } catch (e) {
          console.warn("Audio play failed:", e);
        }
      }
    }
  });

  // ------- Optional: Fade out audio on page unload (smooth transition) -------
  window.addEventListener("beforeunload", () => {
    if (bg && !bg.paused) {
      // Quick fade out before navigation
      gsap.to(bg, { volume: 0, duration: 0.2 });
    }
    
    // Save final state
    if (window.AHAudioState) {
      const isPlaying = !bg.paused;
      window.AHAudioState.setState(isPlaying, bg.volume || 0.35);
    }
  });
});
