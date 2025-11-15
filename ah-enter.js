/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version: 9.0.1 | 2025-11-15
  
  TRIGGER POINTS:
  1. Click to enter (after prompts) â†’ EXISTING entry behavior (unchanged)
     - Overlay fades, temple dissolves, Metatron scales up
     - Shader reveals, audio starts, goddess appears
     - Metatron center becomes clickable
  
  2. Click Metatron center (P_C) â†’ REFINED DIVINATION SEQUENCE
     - Release â†’ Isolation â†’ Solo â†’ Dissolution â†’ Void
     - Then navigates to CMS scene
  
  Updates from v9.0.0:
  - Corrected trigger point for refined sequence
  - Sequence now triggered by Metatron center click (not entry click)
  - Entry behavior restored to original (unchanged)
  
  Previous updates:
  - v9.0.0: Refined 5-step sequence choreography
  - v8.3.0: Metatron center clickable navigation
  - v8.2.0: Audio state persistence
  - Triple goddess integration
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("ðŸ’– Awakening Heart : Oracle Opening initialized (v9.0.1)");

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

  console.log("ðŸ§© Elements found:", { 
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
    promptsLen: prompts.length,
    patternsLibrary: !!window.AHPatterns
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
  gsap.set(goddess,   { autoAlpha: 0, pointerEvents: "none" });
  gsap.set([overlay, temple], { autoAlpha: 1 });
  gsap.set(metatron,  { transformOrigin: "50% 50%", force3D: true });
  
  // Set icon to dark/off state initially
  if (icon) gsap.set(icon, { opacity: 0.4 });
  
  if (bg) { 
    bg.pause(); 
    bg.volume = 0; 
    bg.muted = false;
    if (oracleAudioUrl && bg.src !== oracleAudioUrl) {
      console.log("ðŸ”„ Setting audio source:", oracleAudioUrl);
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
    onStart: () => console.log("ðŸŽ¬ Oracle opening sequence started"),
    onComplete: () => {
      console.log("âœ¨ Oracle intro complete â€“ ready for entry");
      readyForClick = true;
      gsap.set(document.documentElement, { cursor: "pointer" });
      if (overlay) gsap.set(overlay, { cursor: "pointer" });
    }
  });

  // 1) Title fade & glow (no zoom)
  tl.to(title, { autoAlpha: 1, duration: 1.0 })
    .to(title, { color: "hsl(268, 30%, 85%)", duration: 0.5 }, "<")
    .to(title, { color: "hsl(268, 50%, 60%)", duration: 0.75 });

  // 2) Prompt carousel â€“ "breathe" out from center and back in
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

  // ------- Click-anywhere to enter (EXISTING BEHAVIOR - UNCHANGED) -------
  async function enterSequence() {
    if (sequenceStarted || !readyForClick) return;
    sequenceStarted = true;
    console.log("ðŸšª Oracle entered");

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

    // Scale Metatron 20â†’30vw
    if (metatron) {
      clickTl.fromTo(metatron, { scale: 1 }, { scale: 1.25, duration: 1.2 }, ">-0.7");
    }

    // ðŸŽµ Audio fade up - Start oracle scene audio
    clickTl.add(async () => {
      if (!bg) {
        console.error("âŒ No audio element found");
        return;
      }
      
      const volumeLevel = window.AHAudioState?.VOLUME_LEVEL || 0.35;
      
      if (oracleAudioUrl && bg.src !== oracleAudioUrl) {
        console.log("ðŸ”„ Re-setting audio source:", oracleAudioUrl);
        bg.src = oracleAudioUrl;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log("ðŸŽµ Attempting to play audio");
      
      try {
        bg.currentTime = 0;
        bg.volume = 0;
        bg.muted = false;
        
        await bg.play();
        console.log("âœ… Audio play succeeded");
        
        gsap.to(bg, { volume: volumeLevel, duration: 1.0 });
        
        if (window.AHAudioState) {
          window.AHAudioState.setState(true, volumeLevel);
        }
        
        if (icon) gsap.to(icon, { opacity: 1, duration: 0.4 });
        
        console.log("ðŸŽµ Oracle audio started");
      } catch (e) {
        console.error("âŒ Audio play failed:", e.message);
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

    // ðŸŒ™ REVEAL TRIPLE GODDESS (Navigation Element)
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
          console.log("ðŸŒ™ Triple Goddess navigation revealed");
        }
      }, ">-0.3");
    }
    
    // ðŸŽ¯ ENABLE METATRON CENTER CLICK for refined divination sequence
    clickTl.add(() => {
      enableMetatronNavigation();
    }, ">");
  }

  // ------- REFINED DIVINATION SEQUENCE (triggered by Metatron center click) -------
  async function divinationSequence() {
    console.log("ðŸŽ¯ Metatron center clicked - Beginning refined divination sequence");
    
    // Disable further clicks during sequence
    const metatronCenter = document.getElementById("P_C");
    if (metatronCenter) {
      gsap.killTweensOf(metatronCenter); // Stop pulse
      gsap.set(metatronCenter, { pointerEvents: "none" });
    }

    // ------- THE REFINED SEQUENCE -------
    const divinationTl = gsap.timeline({ 
      defaults: { ease: "sine.inOut" },
      onComplete: () => {
        console.log("ðŸŒ€ Divination sequence complete - Navigating to scene");
        // Navigate to CMS scene
        window.location.href = "https://awakening-heart.webflow.io/scenes/surrender-01";
      }
    });

    // ============================================================
    // STEP 1: THE RELEASE (0.8-1s)
    // Goddess drops + micro-bounce, Metatron begins lazy spin/scale
    // ============================================================
    const releaseLabel = divinationTl.addLabel("release");
    
    if (goddess) {
      // Calculate landing position: just above bottom of screen
      const vh = window.innerHeight;
      const goddessLandingY = vh * 0.4; // Adjust based on your layout
      
      divinationTl.to(goddess, {
        y: goddessLandingY,
        scale: 0.7,
        duration: 0.9,
        ease: "power2.in", // Drop with weight
        transformOrigin: "50% 50%"
      }, releaseLabel);
      
      // Micro-bounce - very subtle, like silk settling
      divinationTl.to(goddess, {
        y: goddessLandingY - 4, // Tiny 4px bounce
        duration: 0.15,
        ease: "power1.out"
      }, releaseLabel + "+=0.9");
      
      divinationTl.to(goddess, {
        y: goddessLandingY,
        duration: 0.15,
        ease: "power1.in"
      }, releaseLabel + "+=1.05");
    }
    
    // Metatron begins lazy spin and scale toward 120%
    if (metatron) {
      divinationTl.to(metatron, {
        rotation: 360,
        scale: 1.2,
        duration: 1.0,
        ease: "power1.inOut",
        transformOrigin: "50% 50%"
      }, releaseLabel);
    }
    
    // Temple dissolves during release
    if (temple) {
      divinationTl.to(temple, { 
        autoAlpha: 0, 
        duration: 0.8 
      }, releaseLabel + "+=0.2");
    }

    // ============================================================
    // STEP 2: THE ISOLATION (0.5-0.7s)
    // Title and Goddess fade out, spin accelerates, stage clears
    // ============================================================
    const isolationLabel = divinationTl.addLabel("isolation", "release+=1.0");
    
    // Title fades out
    divinationTl.to(title, {
      autoAlpha: 0,
      duration: 0.6,
      ease: "power2.in"
    }, isolationLabel);
    
    // Goddess fades out (even though she's landed)
    if (goddess) {
      divinationTl.to(goddess, {
        autoAlpha: 0,
        duration: 0.6,
        ease: "power2.in"
      }, isolationLabel);
    }
    
    // Spin accelerates (continue rotation, slight speed increase)
    if (metatron) {
      divinationTl.to(metatron, {
        rotation: "+=180", // Additional rotation
        ease: "power2.in",
        duration: 0.6
      }, isolationLabel);
    }

    // ============================================================
    // STEP 3: THE SOLO PERFORMANCE (0.6-0.8s)
    // Metatron at 120%, spin STOPS, facets display - pure focus
    // ============================================================
    const soloLabel = divinationTl.addLabel("solo", "isolation+=0.6");
    
    // Ensure Metatron is exactly at 120% and rotation stops
    if (metatron) {
      divinationTl.to(metatron, {
        scale: 1.2,
        rotation: "+=0", // Stop rotation by setting to current
        duration: 0.2,
        ease: "power2.out"
      }, soloLabel);
    }
    
    // FACETS ANIMATE - The theatrical peak
    divinationTl.add(() => {
      console.log("âœ¨ Facets display beginning");
      
      // Use animation patterns library if available
      if (window.AHPatterns) {
        // Get facet IDs from your Metatron
        const facetIds = [
          "F_O_TRI1_T", "F_O_TRI2_T",
          "F_I_BG_TR", "F_I_OCT_TR", "F_I_TRI1_TR", "F_I_TRI2_TR",
          "F_I_OCT_R", "F_I_BG_R",
          "F_O_TRI1_BR", "F_O_TRI2_BR",
          "F_I_BG_BR", "F_I_OCT_BR",
          "F_I_TRI1_B", "F_I_TRI2_B",
          "F_I_OCT_BL", "F_I_BG_BL",
          "F_O_TRI1_BL", "F_O_TRI2_BL",
          "F_I_BG_L", "F_I_OCT_L",
          "F_I_TRI1_TL", "F_I_TRI2_TL",
          "F_I_OCT_TL", "F_I_BG_TL"
        ];
        
        // Play sequential pattern with custom colors
        window.AHPatterns.sequential(facetIds, {
          fill: "#77ffcc",
          duration: 0.6,
          stagger: 0.025, // Quick succession
          repeat: 0, // Just once for divination
          yoyo: false,
          ease: "power2.out"
        });
      }
    }, soloLabel + "+=0.2");
    
    // Hold at solo performance for theatrical moment
    divinationTl.to({}, { duration: 0.7 }, soloLabel);

    // ============================================================
    // STEP 4: THE DISSOLUTION (1.5-2s)
    // Metatron scales 120% â†’ 1%, gentle rotation resumes
    // ============================================================
    const dissolutionLabel = divinationTl.addLabel("dissolution", "solo+=0.8");
    
    if (metatron) {
      // Scale down to near-void
      divinationTl.to(metatron, {
        scale: 0.01, // 1% scale
        rotation: "+=90", // Gentle rotation resumes
        duration: 1.8,
        ease: "power2.in",
        transformOrigin: "50% 50%"
      }, dissolutionLabel);
    }
    
    // Fade out facets during dissolution
    divinationTl.add(() => {
      if (window.AHPatterns) {
        // Fade all facets back to original state
        const allShapes = document.querySelectorAll('#metatron polygon, #metatron polyline');
        gsap.to(allShapes, {
          opacity: 0,
          duration: 1.2,
          ease: "power2.in"
        });
      }
    }, dissolutionLabel + "+=0.3");

    // ============================================================
    // STEP 5: THE VOID (0.1-0.2s)
    // 1% - point of light, ready for scene swap
    // ============================================================
    const voidLabel = divinationTl.addLabel("void", "dissolution+=1.8");
    
    // Brief hold at void state
    divinationTl.to({}, { duration: 0.15 }, voidLabel);
    
    // Timeline onComplete will navigate to scene (defined above)
    console.log("ðŸŒ€ Void reached - preparing for scene transition");
  }

  // ------- Enable Metatron Center Navigation -------
  function enableMetatronNavigation() {
    const metatronCenter = document.getElementById("P_C");
    if (!metatronCenter) {
      console.warn("âš ï¸ Metatron center (P_C) not found");
      return;
    }
    
    // Make it clickable
    gsap.set(metatronCenter, {
      cursor: "pointer",
      pointerEvents: "auto",
      opacity: 0.8
    });
    
    // Gentle pulse to indicate interactivity
    gsap.to(metatronCenter, {
      opacity: 1,
      scale: 1.05,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      transformOrigin: "center center"
    });
    
    // Hover effect
    metatronCenter.addEventListener("mouseenter", () => {
      gsap.to(metatronCenter, {
        scale: 1.12,
        opacity: 1,
        duration: 0.3,
        overwrite: true
      });
    });
    
    metatronCenter.addEventListener("mouseleave", () => {
      gsap.to(metatronCenter, {
        scale: 1.05,
        opacity: 1,
        duration: 0.3,
        repeat: -1,
        yoyo: true
      });
    });
    
    // CLICK triggers refined divination sequence
    metatronCenter.addEventListener("click", (e) => {
      e.stopPropagation();
      divinationSequence(); // Trigger the refined 5-step sequence
    });
    
    console.log("ðŸŽ¯ Metatron center now clickable - click to begin divination");
  }

  // ------- Click Handler for Entry -------
  document.addEventListener("click", (e) => {
    if (!readyForClick) return;
    if (audioUI && audioUI.contains(e.target)) return;
    if (goddess && goddess.contains(e.target)) return;
    enterSequence();
  });

  // ------- Audio Toggle Control (Persistent) -------
  audioToggle?.addEventListener("click", async () => {
    if (!bg) return;
    
    if (window.AHAudioState) {
      await window.AHAudioState.toggle(bg, icon);
    } else {
      console.warn("âš ï¸ AHAudioState not found, using local toggle");
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
    e.stopPropagation();
    console.log("ðŸŒ™ Goddess navigation toggle clicked");
    
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
    
    console.log("ðŸ“ Navigation toggle (not yet implemented)");
  });
});
