/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version 8.0.0 | 2025-10-31
  - Updated for scene-specific audio files from Cloudflare
  - Integrated persistent audio state management (user preference persists)
  - Audio state saved to localStorage and applied to subsequent scenes
  - Each scene loads its own audio file
  - Fixed Metatron selector (using #metatron id)
  - Prompts "breathe" out from center (scale 0→1) and back in (scale 1→0)
  - Fixed initial flicker with immediate hide
  - Added more delay for prompts 1-3 for contemplation
  - Delayed temple dissolve by 0.5 sec
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💖 Awakening Heart : Oracle Opening initialized (v8.0.0)");

  // ------- Core DOM -------
  const overlay   = document.getElementById("oracleOverlay") || document.getElementById("overlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const shaderW   = document.querySelector(".shader-wrapper");
  const metatron  = document.getElementById("metatron");
  const bg        = document.getElementById("bgMusic");
  const audioUI   = document.querySelector(".audio-buttons");
  
  // Audio toggle button with icon
  const audioToggle = document.getElementById("audioToggle");
  const icon = audioToggle?.querySelector('svg') || audioToggle?.querySelector('.icon-On');

  // Get oracle scene audio URL
  const oracleAudioUrl = bg?.getAttribute('data-scene-audio') || bg?.src;

  // Prompts
  const prompts = [
    document.getElementById("prompt0"), // Welcome
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3"),
    document.getElementById("prompt4")  // "You may enter. Click when ready."
  ].filter(Boolean);

  console.log("🧩 Elements found:", { 
    overlay, temple, title, shaderW, metatron, bg, audioUI, audioToggle, icon,
    oracleAudioUrl, promptsLen: prompts.length 
  });

  // ------- IMMEDIATE HIDE to prevent flicker -------
  prompts.forEach(p => {
    if (p) {
      p.style.visibility = 'hidden';
      p.style.opacity = '0';
    }
  });

  // ------- Flags -------
  let readyForClick = false;
  let sequenceStarted = false;

  // ------- Initial states (no flicker, no early clicks) -------
  gsap.set([title], { autoAlpha: 0, clearProps: "transform" });
  gsap.set(prompts, { autoAlpha: 0, scale: 0, visibility: "hidden" });
  gsap.set(shaderW,   { autoAlpha: 0, pointerEvents: "none" });
  gsap.set(audioUI,   { autoAlpha: 0, pointerEvents: "none" });
  gsap.set([overlay, temple], { autoAlpha: 1 });
  gsap.set(metatron,  { transformOrigin: "50% 50%", force3D: true });
  
  // Set icon to dark/off state initially
  if (icon) gsap.set(icon, { opacity: 0.4 });
  
  if (bg) { 
    bg.pause(); 
    bg.volume = 0; 
    bg.muted = false;
    // Ensure oracle audio is loaded
    if (oracleAudioUrl && bg.src !== oracleAudioUrl) {
      bg.src = oracleAudioUrl;
    }
  }

  // Reset cursor to default initially
  gsap.set(document.documentElement, { cursor: "default" });

  // Helper to turn on shader beams
  const revealShader = () => {
    if (window.AHShader?.reveal) {
      window.AHShader.reveal({ beams: true });
    } else {
      gsap.to(shaderW, { autoAlpha: 1, duration: 0.6, ease: "sine.inOut" });
    }
  };

  // ------- Opening timeline -------
  const tl = gsap.timeline({
    defaults: { ease: "sine.inOut" },
    onStart: () => console.log("🎬 Oracle opening sequence started"),
    onComplete: () => {
      console.log("✨ Oracle intro complete – ready for entry");
      readyForClick = true;
      gsap.set(document.documentElement, { cursor: "pointer" });
      if (overlay) gsap.set(overlay, { cursor: "pointer" });
    }
  });

  // 1) Title fade & glow (no zoom)
  tl.to(title, { autoAlpha: 1, duration: 1.0 })
    .to(title, { color: "hsl(268, 30%, 85%)", duration: 0.5 }, "<")
    .to(title, { color: "hsl(268, 50%, 60%)", duration: 0.75 });

  // 2) Prompt carousel – "breathe" out from center and back in
  prompts.forEach((p, idx) => {
    if (!p) return;
    
    const isInvite = (p.id === "prompt4");
    const displayDuration = (idx >= 1 && idx <= 3) ? "+=2.0" : "+=1.0";
    
    // "Breathe out" - scale from 0 to 1
    tl.fromTo(p,
      { 
        autoAlpha: 0, 
        scale: 0,
        visibility: "hidden"
      },
      { 
        autoAlpha: 1, 
        scale: 1,
        visibility: "visible",
        duration: 1.2, 
        ease: "power2.out",
        immediateRender: true
      }
    );
    
    if (!isInvite) {
      // "Breathe back in" - scale back to 0
      tl.to(p, { 
        autoAlpha: 0, 
        scale: 0,
        duration: 0.8, 
        ease: "power2.in" 
      }, displayDuration);
    } else {
      // The invite stays visible at full size
      tl.set(p, { scale: 1 }, "+=0.3");
    }
  });

  // ------- Click-anywhere to enter -------
  async function enterSequence() {
    if (sequenceStarted || !readyForClick) return;
    sequenceStarted = true;
    console.log("🚪 Oracle entered");

    gsap.set(document.documentElement, { cursor: "default" });

    // Hide invite prompt
    const invite = prompts[prompts.length - 1];
    if (invite) gsap.to(invite, { autoAlpha: 0, scale: 0, duration: 0.3 });

    const clickTl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

    // Remove overlay
    if (overlay) clickTl.to(overlay, { autoAlpha: 0, duration: 0.5 });

    // Start shader beams
    clickTl.add(revealShader, ">");

    // Dissolve temple (with 0.5 sec delay)
    if (temple) clickTl.to(temple, { autoAlpha: 0, duration: 0.9 }, ">+0.5");

    // Scale Metatron 20→30vw
    if (metatron) {
      clickTl.fromTo(metatron, { scale: 1 }, { scale: 1.25, duration: 1.2 }, ">-0.7");
    }

    // Audio fade up during scale - start oracle scene audio
    clickTl.add(async () => {
      if (!bg) return;
      
      const volumeLevel = window.AHAudioState?.VOLUME_LEVEL || 0.35;
      
      try {
        // Start oracle scene audio from beginning
        bg.currentTime = 0;
        bg.volume = 0;
        await bg.play();
        gsap.to(bg, { volume: volumeLevel, duration: 1.0 });
        
        // Save state as playing - this preference will persist to other scenes
        if (window.AHAudioState) {
          window.AHAudioState.setState(true, volumeLevel);
        }
        
        if (icon) gsap.to(icon, { opacity: 1, duration: 0.4 });
        console.log("🎵 Oracle audio started (state saved for journey)");
      } catch (e) {
        console.warn("Audio play blocked:", e);
        if (window.AHAudioState) window.AHAudioState.setState(false);
      }
    }, "<");

    // Show audio UI
    clickTl.to(audioUI, { 
      autoAlpha: 1, 
      duration: 0.4, 
      onStart: () => {
        gsap.set(audioUI, { pointerEvents: "auto" });
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (!readyForClick) return;
    if (audioUI && audioUI.contains(e.target)) return;
    enterSequence();
  });

  // ------- Audio Toggle Control (Persistent) -------
  audioToggle?.addEventListener("click", async () => {
    if (!bg) return;
    
    // Use persistent state manager if available
    if (window.AHAudioState) {
      await window.AHAudioState.toggle(bg, icon);
    } else {
      // Fallback to local toggle (if state manager not loaded)
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
});
