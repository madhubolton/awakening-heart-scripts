/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version: 10.2.1 | 2025-11-16
  
  FLOW

  1) Title + prompt carousel plays with overlay.
     - Goddess NOT visible yet.

  2) ENTRY CLICK (overlay / general enter)
     - Overlay fades, temple dissolves, Metatron scales up
     - Shader reveals
     - Audio starts
     - Goddess becomes visible in original glyph position
     - Facet animation starts and loops continuously
     - Metatron center becomes clickable (pulsing)

  3) CENTER CLICK (P_C)
     - Stop facet loop
     - Goddess drops + scales down and parks at bottom
     - Metatron shrinks and spins into the center, shader fades
     - Navigate to CMS scene

--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💖 Awakening Heart : Oracle Opening initialized (v10.2.1)");

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
  const icon = audioToggle?.querySelector("svg") || audioToggle?.querySelector(".icon-On");

  // Get oracle scene audio URL with fallback
  const oracleAudioUrl = bg?.getAttribute("data-scene-audio") || bg?.src;

  // Prompt elements (intro text)
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
      p.style.visibility = "hidden";
      p.style.opacity = "0";
    }
  });

  // ------- Flags -------
  let readyForClick      = false;   // ready for first "enter" click
  let sequenceStarted    = false;   // has enterSequence run
  let divinationStarted  = false;   // has center-click sequence started
  let facetLoopActive    = false;   // is facet loop currently running
  let facetLoopTl        = null;    // GSAP timeline for facets

  // ------- Initial states -------
  gsap.set([title], { autoAlpha: 0, clearProps: "transform" });
  gsap.set(prompts, { autoAlpha: 0, scale: 0, visibility: "hidden" });
  gsap.set(shaderW,   { autoAlpha: 0, pointerEvents: "none" });
  gsap.set(audioUI,   { autoAlpha: 0, pointerEvents: "none" });
  
  // Goddess is NOT visible until general enter click
  if (goddess) {
    gsap.set(goddess, {
      autoAlpha: 0,
      pointerEvents: "none",
      y: 0,
      scale: 1,
      transformOrigin: "50% 50%"
    });
  }

  gsap.set([overlay, temple], { autoAlpha: 1 });
  gsap.set(metatron,  { transformOrigin: "50% 50%", force3D: true });
  
  // Icon: dark/off state initially
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
    } else if (shaderW) {
      gsap.to(shaderW, { autoAlpha: 1, duration: 0.6, ease: "sine.inOut" });
    }
  };

  // ------- FACET LOOP HELPERS -------

  function startFacetLoop() {
    if (facetLoopActive) return;
    facetLoopActive = true;

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

    console.log("✨ Starting continuous facet loop");

    if (window.AHPatterns && typeof window.AHPatterns.sequential === "function") {
      // Ask AHPatterns to give us a looping sequence
      facetLoopTl = window.AHPatterns.sequential(facetIds, {
        fill: "#77ffcc",
        duration: 1.4,
        stagger: 0.10,
        repeat: -1,        // continuous
        yoyo: true,
        ease: "sine.inOut"
      });
    } else {
      console.warn("⚠️ AHPatterns not available - using fallback facet loop");
      const allFacets = document.querySelectorAll('[id^="F_"]');
      facetLoopTl = gsap.to(allFacets, {
        fill: "#77ffcc",
        duration: 1.4,
        stagger: 0.1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }

  function stopFacetLoop() {
    if (!facetLoopActive) return;
    facetLoopActive = false;

    console.log("🛑 Stopping facet loop");

    if (facetLoopTl && typeof facetLoopTl.kill === "function") {
      facetLoopTl.kill();
    }

    const allFacets = document.querySelectorAll('[id^="F_"]');
    gsap.killTweensOf(allFacets);

    facetLoopTl = null;
  }

  // ------- Opening timeline (title + prompts) -------
  const tl = gsap.timeline({
    defaults: { ease: "sine.inOut" },
    onStart: () => console.log("🎬 Oracle opening sequence started"),
    onComplete: () => {
      console.log("✨ Oracle intro complete – ready for entry click");
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

  // ------- ENTRY SEQUENCE (click-anywhere) -------
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

    // Scale Metatron up
    if (metatron) {
      clickTl.fromTo(
        metatron, 
        { scale: 1 }, 
        { scale: 1.25, duration: 1.2 }, 
        ">-0.7"
      );
    }

    // Reveal Goddess in original glyph position AFTER entry click
    if (goddess) {
      clickTl.set(
        goddess,
        {
          autoAlpha: 1,
          pointerEvents: "none", // not clickable yet
          y: 0,
          scale: 1,
          transformOrigin: "50% 50%"
        },
        ">-0.4" // slight overlap with Metatron zoom
      );
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

    // At the very end of entry:
    clickTl.add(() => {
      console.log("✅ Entry sequence complete - enabling Metatron center + starting facet loop");
      enableMetatronNavigation();
      startFacetLoop();
    }, ">");
  }

  // ------- DIVINATION SEQUENCE (center click) -------
  async function divinationSequence() {
    if (divinationStarted) return;
    divinationStarted = true;

    console.log("🎯 Metatron center clicked - Beginning divination sequence");

    const metatronCenter = document.getElementById("P_C");
    if (metatronCenter) {
      gsap.killTweensOf(metatronCenter); // Stop pulse
      gsap.set(metatronCenter, { pointerEvents: "none" });
    }

    // Stop facet loop
    stopFacetLoop();

    const divinationTl = gsap.timeline({ 
      defaults: { ease: "sine.inOut" },
      onComplete: () => {
        console.log("🌀 Divination sequence complete - Navigating to scene");
        // TODO: update URL as needed or make dynamic
        window.location.href = "https://awakening-heart.webflow.io/scenes/surrender-01";
      }
    });

    // 1) Fade out title
    if (title) {
      divinationTl.to(title, {
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.in",
        onStart: () => console.log("📝 Title dissolving")
      });
    }

    // 2) Goddess drops + scales down and parks at bottom (relative move)
    if (goddess) {
      divinationTl.to(
        goddess,
        {
          y: "+=20vh",      // drop down from current position
          scale: 0.3,       // shrink into dock size
          duration: 1.4,
          ease: "power2.inOut",
          onStart: () => console.log("🌙 Goddess dropping to dock"),
          onComplete: () => {
            console.log("✅ Goddess docked");
            gsap.set(goddess, { pointerEvents: "auto" }); // now usable as nav glyph
          }
        },
        "<" // overlap with title fade
      );
    }

    // 3) Metatron shrinks to center while shader fades
    if (metatron) {
      divinationTl.to(metatron, {
        scale: 0.01,
        rotation: "+=720",
        duration: 2.6,
        ease: "power2.in",
        transformOrigin: "50% 50%",
        force3D: true,
        onStart: () => {
          console.log("🌀 Metatron shrinking and spinning to center");
        },
        onUpdate: function() {
          const s = gsap.getProperty(metatron, "scale");
          if (shaderW && s <= 0.4 && gsap.getProperty(shaderW, "opacity") > 0) {
            console.log("💫 Triggering shader dissolve at Metatron scale:", s);
            gsap.to(shaderW, {
              autoAlpha: 0,
              duration: 1.4,
              ease: "power2.in",
              overwrite: true
            });
          }
        },
        onComplete: () => {
          console.log("✅ Metatron shrunk to center");
        }
      }, "-=0.4");
    }

    // 4) Fade out inner Metatron shapes a bit after shrink starts
    divinationTl.add(() => {
      const allShapes = document.querySelectorAll("#metatron polygon, #metatron polyline");
      gsap.to(allShapes, {
        opacity: 0,
        duration: 2.0,
        ease: "power2.in"
      });
    }, "-=2.0");

    // 5) Brief hold with goddess as the only visible anchor
    divinationTl.to({}, { 
      duration: 0.7,
      onStart: () => {
        console.log("🌙 Final state - Triple Goddess parked as navigation glyph");
      }
    });
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
    
    // CLICK triggers divination sequence
    metatronCenter.addEventListener("click", (e) => {
      e.stopPropagation();
      divinationSequence();
    });
    
    console.log("🎯 Metatron center now clickable - click to begin divination");
  }

  // ------- Click Handler for Entry (general enter) -------
  document.addEventListener("click", (e) => {
    if (!readyForClick) return;

    // Ignore clicks on UI elements
    if (audioUI && audioUI.contains(e.target)) return;
    if (goddess && goddess.contains(e.target)) return;

    enterSequence();
  });

  // ------- Audio Toggle Control (Persistent) -------
  audioToggle?.addEventListener("click", async (e) => {
    e.stopPropagation();
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
        } catch (err) {
          console.warn("Audio play failed:", err);
        }
      }
    }
  });

  // ------- Triple Goddess Navigation Toggle (post-dock) -------
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
    
    console.log("🔍 Navigation toggle (behavior to be implemented)");
  });
});
