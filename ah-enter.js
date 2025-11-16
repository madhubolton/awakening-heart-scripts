/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version: 9.3.0 | 2025-11-15
  
  CRITICAL UPDATE: MAGICIAN'S FLOURISH
  The Metatron MUST hold at peak scale during facet animation.
  This is the theatrical peak - the oracle speaking through geometry.
  
  TRIGGER POINTS:
  1. Click to enter (after prompts) → Entry behavior (unchanged)
  
  2. Click Metatron center (P_C) → DIVINATION SEQUENCE
     Step 1: Goddess descends (1.7s)
     Step 2: Metatron grows to 4.0x (2.5s)
     Step 3: Lock at peak with gsap.set() (instant)
     Step 4: PAUSE 1 - 1 second stillness
     Step 5: FACETS + PAUSE 2 - 10 SECONDS AT PEAK ← THE FLOURISH
             - Metatron locked at 4.0x scale
             - Facets animate
             - Extended contemplation
             - Scale verified every 2 seconds
     Step 6: Dissolution (2.5s)
     Step 7: Void (0.5s)
     Total: ~18 seconds
  
  Updates from v9.2.1:
  - Using gsap.set() to LOCK scale at peak (not .to())
  - Extended pause to 10 seconds (was 5s)
  - Scale verification throughout pause
  - Force re-lock if scale drifts
  - Explicit timeline structure to prevent rushing
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💖 Awakening Heart : Oracle Opening initialized (v9.3.0)");

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

  // ------- REFINED DIVINATION SEQUENCE (triggered by Metatron center click) -------
  async function divinationSequence() {
    console.log("🎯 Metatron center clicked - Beginning refined divination sequence");
    
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

    // ------- THE REFINED SEQUENCE (REVISED) -------
    const divinationTl = gsap.timeline({ 
      defaults: { ease: "sine.inOut" },
      onComplete: () => {
        console.log("🌀 Divination sequence complete - Navigating to scene");
        // Navigate to CMS scene
        window.location.href = "https://awakening-heart.webflow.io/scenes/surrender-01";
      }
    });

    // ============================================================
    // STEP 1: GODDESS DESCENDS (1.2s)
    // Goddess scales down and moves to bottom
    // ============================================================
    const goddessLabel = divinationTl.addLabel("goddessDescend");
    
    if (goddess) {
      // Goddess scales down and moves down the screen
      // Calculate a controlled downward movement
      const vh = window.innerHeight;
      const goddessDropDistance = vh * 0.15; // Move down 15% of viewport height
      
      divinationTl.to(goddess, {
        y: `+=${goddessDropDistance}`, // Move down from current position
        scale: 0.7,
        duration: 1.2,
        ease: "power2.inOut",
        transformOrigin: "50% 50%"
      }, goddessLabel);
      
      // Micro-bounce - very subtle settle (scale compression)
      divinationTl.to(goddess, {
        scale: 0.68, // Tiny compression
        duration: 0.2,
        ease: "power1.out"
      }, goddessLabel + "+=1.2");
      
      divinationTl.to(goddess, {
        scale: 0.7, // Back to target
        duration: 0.2,
        ease: "power1.in"
      }, goddessLabel + "+=1.4");
    }
    
    // Small pause after goddess lands
    divinationTl.to({}, { duration: 0.3 });

    // ============================================================
    // STEP 2: METATRON GROWS & ROTATES (2.5s)
    // Lazy rotation begins, grows to dramatic size
    // Title and Goddess dissolve WHILE this happens
    // ============================================================
    const growLabel = divinationTl.addLabel("metatronGrow");
    
    if (metatron) {
      console.log("🎯 Starting Metatron grow");
      console.log("   Current scale:", gsap.getProperty(metatron, "scale"));
      console.log("   Current rotation:", gsap.getProperty(metatron, "rotation"));
      
      // Use fromTo for explicit control - specify starting state
      divinationTl.fromTo(metatron, 
        {
          // Starting state (should be from entry)
          rotation: 0,
          scale: 1.25
        },
        {
          // End state
          rotation: 360,
          scale: 4.0,  // Very dramatic for testing
          duration: 2.5,
          ease: "power1.inOut",
          transformOrigin: "50% 50%",
          force3D: true,
          onStart: () => {
            console.log("🌀 Metatron grow animation STARTED");
          },
          onUpdate: function() {
            if (this.progress() === 0 || this.progress() === 0.5 || this.progress() === 1) {
              console.log(`📊 Progress: ${Math.round(this.progress() * 100)}% - Scale: ${gsap.getProperty(metatron, "scale").toFixed(2)}`);
            }
          },
          onComplete: () => {
            console.log("✅ Metatron grow COMPLETE");
            console.log("   Final scale:", gsap.getProperty(metatron, "scale"));
          }
        }, 
        growLabel
      );
    } else {
      console.error("❌ Metatron element not found!");
    }
    
    // Title dissolves DURING the grow (starts 0.5s into the grow)
    if (title) {
      divinationTl.to(title, {
        autoAlpha: 0,
        duration: 1.0,
        ease: "power2.in"
      }, growLabel + "+=0.5");
    }
    
    // Goddess dissolves DURING the grow (starts 0.5s into the grow)
    if (goddess) {
      divinationTl.to(goddess, {
        autoAlpha: 0,
        duration: 1.0,
        ease: "power2.in"
      }, growLabel + "+=0.5");
    }

    // ============================================================
    // STEP 3: ROTATION STOPS (0.3s)
    // Metatron reaches peak size, rotation stops
    // ============================================================
    const stopLabel = divinationTl.addLabel("rotationStop", "metatronGrow+=2.5");
    
    if (metatron) {
      console.log("🛑 Stopping rotation at peak scale");
      
      // Lock in final dramatic scale (match Step 2's target: 4.0)
      // Use set() to FORCE the value and prevent any interference
      divinationTl.set(metatron, {
        scale: 4.0,
        rotation: 360,
        transformOrigin: "50% 50%",
        force3D: true
      }, stopLabel);
      
      divinationTl.add(() => {
        console.log("⏸️ LOCKED - Scale:", gsap.getProperty(metatron, "scale"));
        console.log("⏸️ LOCKED - Rotation:", gsap.getProperty(metatron, "rotation"));
      }, stopLabel);
    }
    
    // ============================================================
    // CRITICAL PAUSE - METATRON STAYS AT PEAK
    // Use addPause for GUARANTEED hold
    // ============================================================
    divinationTl.addLabel("beforePause");
    
    // First pause: 1 second of stillness
    divinationTl.to({}, { 
      duration: 1.0,
      onStart: () => console.log("⏳ PAUSE 1: 1 second stillness - Metatron at peak"),
      onComplete: () => console.log("⏳ PAUSE 1: Complete")
    });
    
    // Verify scale is still locked
    divinationTl.add(() => {
      console.log("🔒 After pause 1 - Scale check:", gsap.getProperty(metatron, "scale"));
      // Force it again just to be sure
      if (metatron) {
        gsap.set(metatron, { scale: 4.0, force3D: true });
      }
    });

    // ============================================================
    // STEP 4: FACET ANIMATION - METATRON STAYS LOCKED AT PEAK
    // This is the magician's flourish - must have full presence
    // ============================================================
    const facetsLabel = divinationTl.addLabel("facetsDisplay");
    
    // Lock Metatron position AGAIN before facets
    if (metatron) {
      divinationTl.set(metatron, {
        scale: 4.0,
        rotation: 360,
        transformOrigin: "50% 50%",
        force3D: true
      }, facetsLabel);
    }
    
    // FACETS ANIMATE
    divinationTl.add(() => {
      console.log("✨ FACETS: Beginning display");
      console.log("✨ FACETS: Metatron scale:", gsap.getProperty(metatron, "scale"));
      
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
        
        // Slower, more contemplative pattern
        window.AHPatterns.sequential(facetIds, {
          fill: "#77ffcc",
          duration: 1.2,
          stagger: 0.08,
          repeat: 0,
          yoyo: false,
          ease: "sine.inOut"
        });
      }
    }, facetsLabel);
    
    // EXTENDED HOLD - The magician's flourish
    // Metatron stays at 4.0 scale for FULL 10 seconds
    divinationTl.to({}, { 
      duration: 10.0,
      onStart: () => {
        console.log("⏳ PAUSE 2: MAGICIAN'S FLOURISH - 10 seconds at peak");
        console.log("⏳ PAUSE 2: Metatron locked at scale:", gsap.getProperty(metatron, "scale"));
      },
      onUpdate: function() {
        // Every 2 seconds, verify scale is still locked
        const progress = this.progress();
        if (progress === 0.2 || progress === 0.4 || progress === 0.6 || progress === 0.8) {
          console.log(`⏳ PAUSE 2: ${Math.round(progress * 100)}% - Scale check:`, gsap.getProperty(metatron, "scale"));
          // Force lock if it drifted
          if (metatron) gsap.set(metatron, { scale: 4.0, force3D: true });
        }
      },
      onComplete: () => {
        console.log("⏳ PAUSE 2: Complete - Full flourish displayed");
        console.log("⏳ PAUSE 2: Final scale check:", gsap.getProperty(metatron, "scale"));
      }
    }, facetsLabel);
    
    // Final verification before dissolution
    divinationTl.add(() => {
      console.log("🔒 PRE-DISSOLUTION: Scale check:", gsap.getProperty(metatron, "scale"));
      if (metatron) {
        const currentScale = gsap.getProperty(metatron, "scale");
        if (currentScale !== 4.0) {
          console.warn("⚠️ Scale drifted to:", currentScale, "- Re-locking to 4.0");
          gsap.set(metatron, { scale: 4.0, force3D: true });
        }
      }
    });

    // ============================================================
    // STEP 5: DISSOLUTION (2.5s)
    // Metatron rotates again and shrinks to center
    // Shader dissolves EARLY (before Metatron reaches 20%)
    // ============================================================
    const dissolveLabel = divinationTl.addLabel("dissolution");
    
    // Shader dissolves early in the sequence
    if (shaderW) {
      divinationTl.to(shaderW, {
        autoAlpha: 0,
        duration: 1.5,
        ease: "power2.in"
      }, dissolveLabel);
    }
    
    if (metatron) {
      console.log("🌊 Starting dissolution from scale:", gsap.getProperty(metatron, "scale"));
      
      // Rotate and shrink to void (from 4.0 to 0.01)
      divinationTl.to(metatron, {
        scale: 0.01,
        rotation: "+=180", // Gentle rotation (360° → 540°)
        duration: 2.5,
        ease: "power2.in",
        transformOrigin: "50% 50%",
        onComplete: () => {
          console.log("🌀 Dissolution complete - at void scale:", gsap.getProperty(metatron, "scale"));
        }
      }, dissolveLabel);
    }
    
    // Fade out facets during dissolution
    divinationTl.add(() => {
      const allShapes = document.querySelectorAll('#metatron polygon, #metatron polyline');
      gsap.to(allShapes, {
        opacity: 0,
        duration: 1.8,
        ease: "power2.in"
      });
    }, dissolveLabel + "+=0.5");

    // ============================================================
    // STEP 6: THE VOID (0.5s)
    // Brief hold at void before navigation
    // ============================================================
    const voidLabel = divinationTl.addLabel("void");
    
    divinationTl.to({}, { duration: 0.5 }, voidLabel);
    
    console.log("🌀 Entering void - preparing for scene transition");
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
    
    // CLICK triggers refined divination sequence
    metatronCenter.addEventListener("click", (e) => {
      e.stopPropagation();
      divinationSequence(); // Trigger the refined 5-step sequence
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
    
    console.log("📍 Navigation toggle (not yet implemented)");
  });
});
