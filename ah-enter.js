/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version 5.7.2 | 2025-10-28
  - Fixed Metatron selector (using #metatron id)
  - Prompts "breathe" out from center (scale 0→1) and back in (scale 1→0)
  - Fixed initial flicker with immediate hide
  - Added more delay for prompts 1-3 for contemplation
  - Delayed temple dissolve by 0.5 sec
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💖 Awakening Heart : Oracle Opening initialized (v5.7.2)");

  // ------- Core DOM -------
  const overlay   = document.getElementById("oracleOverlay") || document.getElementById("overlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const shaderW   = document.querySelector(".shader-wrapper");
  const metatron  = document.getElementById("metatron");  // FIXED: Using id selector
  const bg        = document.getElementById("bgMusic");
  const audioUI   = document.querySelector(".audio-buttons");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  // Prompts
  const prompts = [
    document.getElementById("prompt0"), // Welcome
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3"),
    document.getElementById("prompt4")  // "You may enter. Click when ready."
  ].filter(Boolean);

  console.log("🧩 Elements found:", { overlay, temple, title, shaderW, metatron, bg, audioUI, promptsLen: prompts.length });

  // ------- IMMEDIATE HIDE to prevent flicker -------
  // Do this before GSAP initializes
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
  gsap.set(prompts, { autoAlpha: 0, scale: 0, visibility: "hidden" }); // Ensure prompts start hidden and scaled to 0
  gsap.set(shaderW,   { autoAlpha: 0, pointerEvents: "none" });
  gsap.set(audioUI,   { autoAlpha: 0, pointerEvents: "none" });
  gsap.set([overlay, temple], { autoAlpha: 1 }); // visible at start
  gsap.set(metatron,  { transformOrigin: "50% 50%", force3D: true });
  if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

  // Reset cursor to default initially
  gsap.set(document.documentElement, { cursor: "default" });

  // Helper to turn on shader beams if your shader module exposes reveal()
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
      console.log("✨ Oracle intro complete — ready for entry");
      readyForClick = true;
      // Change cursor to pointer when ready for click
      gsap.set(document.documentElement, { cursor: "pointer" });
      if (overlay) gsap.set(overlay, { cursor: "pointer" });
    }
  });

  // 1) Title fade & glow (no zoom)
  tl.to(title, { autoAlpha: 1, duration: 1.0 })
    .to(title, { color: "hsl(268, 30%, 85%)", duration: 0.5 }, "<")
    .to(title, { color: "hsl(268, 50%, 60%)", duration: 0.75 });

  // 2) Prompt carousel — "breathe" out from center and back in
  prompts.forEach((p, idx) => {
    if (!p) return;
    
    const isInvite = (p.id === "prompt4");
    
    // Determine display duration based on prompt index
    // Prompts 1, 2, 3 (indices 1, 2, 3) get more time
    const displayDuration = (idx >= 1 && idx <= 3) ? "+=2.0" : "+=1.0";
    
    // "Breathe out" - scale from 0 (center point) to 1 (full size)
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
        immediateRender: true  // Force immediate application of 'from' values
      }
    );
    
    if (!isInvite) {
      // "Breathe back in" - scale back to 0 while fading
      // Use longer delay for prompts 1-3
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

    // Reset cursor
    gsap.set(document.documentElement, { cursor: "default" });

    // Hide invite prompt
    const invite = prompts[prompts.length - 1];
    if (invite) gsap.to(invite, { autoAlpha: 0, scale: 0, duration: 0.3 });

    // Remove overlay → start shader beams → dissolve temple → scale Metatron 20→30vw → sound up
    const clickTl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

    // Remove overlay
    if (overlay) clickTl.to(overlay, { autoAlpha: 0, duration: 0.5 });

    // Start shader beams
    clickTl.add(revealShader, ">");

    // Dissolve temple (added 0.5 sec delay)
    if (temple) clickTl.to(temple, { autoAlpha: 0, duration: 0.9 }, ">+0.5");

    // Scale Metatron 20→30vw (adjusted timing to account for temple delay)
    if (metatron) {
      clickTl.fromTo(metatron, { scale: 1 }, { scale: 1.5, duration: 1.2 }, ">-0.7");
    }

    // Audio fade up during scale
    clickTl.add(async () => {
      if (!bg) return;
      try {
        await bg.play();
        gsap.to(bg, { volume: 0.35, duration: 1.0 });
        console.log("🎵 Audio started");
      } catch (e) {
        console.warn("Audio play blocked:", e);
      }
    }, "<");

    // Show sound UI
    clickTl.to(audioUI, { autoAlpha: 1, duration: 0.4, onStart: () => {
      gsap.set(audioUI, { pointerEvents: "auto" });
    }});
  }

  document.addEventListener("click", (e) => {
    // Ignore clicks on audio UI; otherwise continue
    if (!readyForClick) return;
    if (audioUI && audioUI.contains(e.target)) return;
    enterSequence();
  });

  // ------- Sound controls -------
  btnSound?.addEventListener("click", async () => {
    if (!bg) return;
    if (bg.paused) await bg.play();
    gsap.to(bg, { volume: 0.35, duration: 0.3 });
  });

  btnMute?.addEventListener("click", () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
  });
});
