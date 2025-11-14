/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version 8.3.0 | 2025-11-14
  
  Updates from v8.2.0:
  - Metatron center (P_C) becomes clickable after opening sequence
  - Click P_C to navigate to CMS scene (test: surrender-01)
  - Hover effects on center portal
  - Pulse animation before navigation
  
  Previous updates:
  - Enhanced audio debugging and error handling
  - Explicit unmute and source verification
  - Triple goddess integration and animation (visual only)
  - Improved console logging for diagnostics
  - Consistent Metatron targeting (#metatron)
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💖 Awakening Heart : Oracle Opening initialized (v8.3.0)");

  // ------- Core DOM -------
  const overlay   = document.getElementById("oracleOverlay") || document.getElementById("overlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const shaderW   = document.querySelector(".shader-wrapper");
  const metatron  = document.getElementById("metatron");
  const bg        = document.getElementById("bgMusic");
  const audioUI   = document.querySelector(".audio-buttons");
  const goddess   = document.getElementById("triple-goddess-wrapper");
  
  // Audio toggle button with icon
  const audioToggle = document.getElementById("audioToggle");
  const icon = audioToggle?.querySelector('svg') || audioToggle?.querySelector('.icon-On');

  // Get oracle scene audio URL with fallback
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
    overlay: !!overlay,
    temple: !!temple,
    title: !!title,
    shaderW: !!shaderW,
    metatron: !!metatron,
    bg: !!bg,
    audioUI: !!audioUI,
    audioToggle: !!audioToggle,
    icon: !!icon,
    goddess: !!goddess,
    promptsLen: prompts.length 
  });

  // 🔍 AUDIO DIAGNOSTIC INFO
  if (bg) {
    console.log("🔍 Audio Debug:", {
      element: "✅ Found",
      src: bg.src,
      dataSceneAudio: bg.getAttribute('data-scene-audio'),
      oracleAudioUrl,
      readyState: bg.readyState,
      paused: bg.paused,
      muted: bg.muted,
      audioStateAvailable: !!window.AHAudioState
    });
  } else {
    console.error("❌ No audio element (#bgMusic) found!");
  }

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
  gsap.set(goddess,   { autoAlpha: 0, pointerEvents: "none" });
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
      console.log("🔄 Setting audio source:", oracleAudioUrl);
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

    // 🎵 ENHANCED AUDIO FADE UP - Start oracle scene audio
    clickTl.add(async () => {
      if (!bg) {
        console.error("❌ No audio element found");
        return;
      }
      
      const volumeLevel = window.AHAudioState?.VOLUME_LEVEL || 0.35;
      
      // Ensure audio has correct source
      if (oracleAudioUrl && bg.src !== oracleAudioUrl) {
        console.log("🔄 Re-setting audio source:", oracleAudioUrl);
        bg.src = oracleAudioUrl;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log("🎵 Attempting to play audio:", {
        src: bg.src,
        readyState: bg.readyState,
        paused: bg.paused,
        muted: bg.muted
      });
      
      try {
        // Reset playback position and prepare audio
        bg.currentTime = 0;
        bg.volume = 0;
        bg.muted = false; // Explicitly unmute
        
        // Attempt playback
        await bg.play();
        console.log("✅ Audio play succeeded");
        
        // Fade up volume
        gsap.to(bg, { volume: volumeLevel, duration: 1.0 });
        
        // Save state as playing - this preference will persist to other scenes
        if (window.AHAudioState) {
          window.AHAudioState.setState(true, volumeLevel);
        }
        
        // Visual feedback on icon
        if (icon) gsap.to(icon, { opacity: 1, duration: 0.4 });
        
        console.log("🎵 Oracle audio started (state saved for journey)");
      } catch (e) {
        console.error("❌ Audio play failed:", {
          error: e.message,
          name: e.name,
          readyState: bg.readyState,
          networkState: bg.networkState
        });
        
        // Update state to reflect failure
        if (window.AHAudioState) window.AHAudioState.setState(false);
        if (icon) gsap.set(icon, { opacity: 0.4 });
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

    // 🌙 REVEAL TRIPLE GODDESS (Navigation Element)
    if (goddess) {
      clickTl.to(goddess, {
        autoAlpha: 1,
        duration: 0.8,
        ease: "sine.inOut",
        onStart: () => {
          goddess.classList.add("active");
        },
        onComplete: () => {
          gsap.set(goddess, { pointerEvents: "auto" });
          console.log("🌙 Triple Goddess navigation revealed");
        }
      }, ">-0.3"); // Slight overlap with audio UI
    }
    
    // 🎯 ENABLE METATRON CENTER CLICK (Navigate to CMS Scene)
    clickTl.add(() => {
      const metatronCenter = document.getElementById("P_C");
      if (metatronCenter) {
        // Make it clickable
        gsap.set(metatronCenter, {
          cursor: "pointer",
          pointerEvents: "auto"
        });
        
        // Add hover effect
        metatronCenter.addEventListener("mouseenter", () => {
          gsap.to(metatronCenter, {
            scale: 1.08,
            opacity: 1,
            duration: 0.3,
            transformOrigin: "center center"
          });
        });
        
        metatronCenter.addEventListener("mouseleave", () => {
          gsap.to(metatronCenter, {
            scale: 1,
            opacity: 0.8,
            duration: 0.3
          });
        });
        
        // Navigate to test scene on click
        metatronCenter.addEventListener("click", (e) => {
          e.stopPropagation();
          console.log("🎯 Metatron center clicked - navigating to scene...");
          
          // Visual feedback before navigation
          gsap.to(metatronCenter, {
            scale: 1.15,
            opacity: 1,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
              // Navigate to CMS scene
              window.location.href = "https://awakening-heart.webflow.io/scenes/surrender-01";
            }
          });
        });
        
        console.log("🎯 Metatron center now clickable - click to enter scene");
      } else {
        console.warn("⚠️ Metatron center (P_C) not found");
      }
    }, ">"); // After goddess reveal
  }

  document.addEventListener("click", (e) => {
    if (!readyForClick) return;
    if (audioUI && audioUI.contains(e.target)) return;
    if (goddess && goddess.contains(e.target)) return; // Don't trigger on goddess click
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
      console.warn("⚠️ AHAudioState not found, using local toggle");
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

  // ------- Triple Goddess Navigation Toggle -------
  goddess?.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent triggering entry sequence
    console.log("🌙 Goddess navigation toggle clicked");
    
    // Visual feedback - pulse the full moon
    const fullCircle = document.querySelector("#triple-goddess #full-circle");
    if (fullCircle) {
      gsap.to(fullCircle, {
        scale: 1.15,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        transformOrigin: "50% 50%",
        ease: "power2.inOut"
      });
    }
    
    // TODO: Toggle navigation overlay
    // Future implementation will show/hide realm navigation
    console.log("📍 Navigation toggle (not yet implemented)");
  });

  // ------- Optional: Subtle Goddess Animation Loop -------
  // Uncomment to add gentle breathing animation to goddess symbol
  /*
  if (goddess) {
    gsap.to("#triple-goddess .moon", {
      opacity: 0.7,
      duration: 2.5,
      stagger: 0.3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }
  */
});
