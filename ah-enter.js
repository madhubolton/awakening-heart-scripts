/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version: 10.0.0 | 2025-11-16
  
  SIMPLIFIED DIVINATION SEQUENCE
  
  TRIGGER POINTS:
  1. Click to enter (after prompts) → Entry behavior (unchanged)
     - Overlay fades, temple dissolves, Metatron scales up
     - Shader reveals, audio starts, goddess appears
     - Metatron center becomes clickable
  
  2. Click Metatron center (P_C) → SIMPLIFIED DIVINATION SEQUENCE
     Step 1: Goddess docks at bottom (1.2s)
             - Shrinks to 0.3 scale and moves to bottom
             - Remains visible throughout transition
     Step 2: Facet animation plays (5s)
             - Sequential pattern for contemplation
     Step 3: Title dissolves (1s)
             - Fades out during facets
     Step 4: Metatron shrinks to center (3s)
             - Rotates and shrinks to near-zero
             - Shader dissolves when Metatron ~30%
     
     Final state: Only Triple Goddess visible at bottom
     Total: ~10.7 seconds
  
  Updates from v9.2.0:
  - Simplified from 6 steps to 4 steps
  - Goddess remains visible (docks at bottom)
  - Removed growth phase for Metatron
  - More straightforward sequencing
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💖 Awakening Heart : Oracle Opening initialized (v10.0.0)");

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

  // ------- Click-anywhere to enter (EXISTING BEHAVIOR - UNCHANGED) -------
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

    // 🎵 Audio fade up - Start oracle scene audio
    clickTl.add(async () => {
      if (!bg) {
        console.error("❌ No audio element found");
        return;
      }
      
      const volumeLevel = window.AHAudioState?.VOLUME_LEVEL || 0.35;
      
      if (oracleAudioUrl && bg.src !== oracleAudioUrl) {
        console.log("🔄 Re-setting audio source:", oracleAudioUrl);
        bg.src = oracleAudioUrl;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log("🎵 Attempting to play audio");
      
      try {
        bg.currentTime = 0;
        bg.volume = 0;
        bg.muted = false;
        
        await bg.play();
        console.log("✅ Audio play succeeded");
        
        gsap.to(bg, { volume: volumeLevel, duration: 1.0 });
        
        if (window.AHAudioState) {
          window.AHAudioState.setState(true, volumeLevel);
        }
        
        if (icon) gsap.to(icon, { opacity: 1, duration: 0.4 });
        
        console.log("🎵 Oracle audio started");
      } catch (e) {
        console.error("❌ Audio play failed:", e.message);
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
      }, ">-0.3");
    }
    
    // 🎯 ENABLE METATRON CENTER CLICK for refined divination sequence
    clickTl.add(() => {
      enableMetatronNavigation();
    }, ">");
  }

  // ------- SIMPLIFIED DIVINATION SEQUENCE (triggered by Metatron center click) -------
  async function divinationSequence() {
    console.log("🎯 Metatron center clicked - Beginning simplified divination sequence");
    
    // Disable further clicks during sequence
    const metatronCenter = document.getElementById("P_C");
    if (metatronCenter) {
      gsap.killTweensOf(metatronCenter); // Stop pulse
      gsap.set(metatronCenter, { pointerEvents: "none" });
    }
    
    // CRITICAL: Stop any existing animations on Metatron
    if (metatron) {
      console.log("🛑 Killing existing Metatron animations");
      gsap.killTweensOf(metatron);
      gsap.killTweensOf("#metatron");
      gsap.killTweensOf("#metatron *"); // Kill child animations too
      
      // Stop metatron animation engine if running
      if (window.metatron && window.metatron.stopAll) {
        window.metatron.stopAll();
        console.log("🛑 Stopped metatron engine animations");
      }
    }

    // ------- THE SIMPLIFIED SEQUENCE -------
    const divinationTl = gsap.timeline({ 
      defaults: { ease: "sine.inOut" },
      onComplete: () => {
        console.log("🌀 Divination sequence complete - Navigating to scene");
        // Navigate to CMS scene
        window.location.href = "https://awakening-heart.webflow.io/scenes/surrender-01";
      }
    });

    // ============================================================
    // STEP 1: GODDESS DOCKS AT BOTTOM (1.2s)
    // Goddess shrinks and moves to dock at bottom of screen
    // She remains visible throughout for continuity
    // ============================================================
    const goddessLabel = divinationTl.addLabel("goddessDock");
    
    if (goddess) {
      // Calculate docking position at bottom of viewport
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      
      // Move goddess to bottom - about 5% from bottom edge
      // Use absolute positioning for precise docking
      const dockY = vh * 0.45; // Move down 45% of viewport height
      const dockScale = 0.3; // Small but visible size
      
      divinationTl.to(goddess, {
        y: dockY, // Absolute position from current
        scale: dockScale,
        duration: 1.2,
        ease: "power2.inOut",
        transformOrigin: "50% 50%",
        onStart: () => {
          console.log("🌙 Goddess docking at bottom");
        },
        onComplete: () => {
          console.log("✅ Goddess docked - remains visible");
          // Ensure goddess stays visible (don't dissolve)
          gsap.set(goddess, { autoAlpha: 1 });
        }
      }, goddessLabel);
    }
    
    // Small pause after goddess docks
    divinationTl.to({}, { duration: 0.5 });

    // ============================================================
    // STEP 2: FACET ANIMATION SEQUENCE (5s)
    // Play the facet animation for contemplation
    // ============================================================
    const facetsLabel = divinationTl.addLabel("facets");
    
    // Start facets animation
    divinationTl.add(() => {
      console.log("✨ Starting facet animation sequence");
      
      if (window.AHPatterns) {
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
        
        // Contemplative sequential pattern
        window.AHPatterns.sequential(facetIds, {
          fill: "#77ffcc",
          duration: 1.5,
          stagger: 0.12, // Slower, more deliberate
          repeat: 0,
          yoyo: false,
          ease: "power2.inOut"
        });
      } else {
        console.warn("⚠️ AHPatterns not available - using fallback");
        // Fallback: Simple fade of all facets
        const allFacets = document.querySelectorAll('[id^="F_"]');
        gsap.to(allFacets, {
          fill: "#77ffcc",
          duration: 2,
          stagger: 0.1,
          ease: "power2.inOut"
        });
      }
    }, facetsLabel);
    
    // Hold for full facet sequence (5 seconds total)
    divinationTl.to({}, { 
      duration: 5.0,
      onStart: () => console.log("⏳ Watching facet animation (5s)"),
      onComplete: () => console.log("✅ Facet sequence complete")
    }, facetsLabel);

    // ============================================================
    // STEP 3: TITLE DISSOLVES (1s)
    // Title fades out during/after facets
    // ============================================================
    const titleLabel = divinationTl.addLabel("titleDissolve", "facets+=3.5");
    
    if (title) {
      divinationTl.to(title, {
        autoAlpha: 0,
        duration: 1.0,
        ease: "power2.in",
        onStart: () => console.log("📝 Title dissolving"),
        onComplete: () => console.log("✅ Title dissolved")
      }, titleLabel);
    }

    // ============================================================
    // STEP 4: METATRON SHRINKS TO CENTER (3s)
    // Metatron rotates and shrinks to center
    // Shader dissolves when Metatron reaches ~30% scale
    // ============================================================
    const shrinkLabel = divinationTl.addLabel("metatronShrink", "facets+=5");
    
    if (metatron) {
      console.log("🌀 Starting Metatron shrink and rotation");
      console.log("   Current scale:", gsap.getProperty(metatron, "scale"));
      
      // Get current state (should be 1.25 from entry)
      const currentScale = gsap.getProperty(metatron, "scale") || 1.25;
      
      // Rotate and shrink to near-zero
      divinationTl.to(metatron, {
        scale: 0.01, // Shrink to almost nothing
        rotation: "+=720", // Two full rotations for drama
        duration: 3.0,
        ease: "power2.in",
        transformOrigin: "50% 50%",
        force3D: true,
        onStart: () => {
          console.log("🌀 Metatron shrinking from scale:", currentScale);
        },
        onUpdate: function() {
          const currentScale = gsap.getProperty(metatron, "scale");
          
          // When Metatron reaches 30% of starting scale, dissolve shader
          if (currentScale <= (1.25 * 0.3) && shaderW && gsap.getProperty(shaderW, "opacity") > 0) {
            console.log("💫 Triggering shader dissolve at scale:", currentScale);
            gsap.to(shaderW, {
              autoAlpha: 0,
              duration: 1.5,
              ease: "power2.in",
              overwrite: true
            });
          }
        },
        onComplete: () => {
          console.log("✅ Metatron shrunk to center");
          console.log("   Final scale:", gsap.getProperty(metatron, "scale"));
        }
      }, shrinkLabel);
    }
    
    // Fade out facet colors during shrink
    divinationTl.add(() => {
      const allShapes = document.querySelectorAll('#metatron polygon, #metatron polyline');
      gsap.to(allShapes, {
        opacity: 0,
        duration: 2.0,
        ease: "power2.in"
      });
    }, shrinkLabel + "+=0.5");

    // ============================================================
    // FINAL STATE: Only Triple Goddess visible
    // Brief hold before navigation
    // ============================================================
    divinationTl.to({}, { 
      duration: 0.5,
      onStart: () => {
        console.log("🌙 Final state - Only Triple Goddess visible");
        console.log("   Goddess scale:", goddess ? gsap.getProperty(goddess, "scale") : "N/A");
        console.log("   Metatron scale:", metatron ? gsap.getProperty(metatron, "scale") : "N/A");
      }
    });
    
    console.log("🎬 Divination sequence started - Total duration: ~10.7s");
  }

  // ------- Enable Metatron Center Navigation -------
  function enableMetatronNavigation() {
    const metatronCenter = document.getElementById("P_C");
    if (!metatronCenter) {
      console.warn("⚠️ Metatron center (P_C) not found");
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
    
    // CLICK triggers simplified divination sequence
    metatronCenter.addEventListener("click", (e) => {
      e.stopPropagation();
      divinationSequence(); // Trigger the simplified 4-step sequence
    });
    
    console.log("🎯 Metatron center now clickable - click to begin divination");
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
    e.stopPropagation();
    console.log("🌙 Goddess navigation toggle clicked");
    
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
    
    console.log("🔍 Navigation toggle (not yet implemented)");
  });
});
