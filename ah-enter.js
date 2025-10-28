/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version 5.7.0 | 2025-10-28
  - Adds #prompt5 (additional prompt)
  - Prompts "breathe" out from center (scale 0→1) and back in (scale 1→0)
  - Cursor changes to pointer when click-anywhere is active
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💖 Awakening Heart : Oracle Opening initialized (v5.7.0)");

  // ------- Core DOM -------
  const overlay   = document.getElementById("oracleOverlay") || document.getElementById("overlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const shaderW   = document.querySelector(".shader-wrapper");
  const metatron  = document.querySelector(".Metatron");
  const bg        = document.getElementById("bgMusic");
  const audioUI   = document.querySelector(".audio-buttons");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  // Prompts (added prompt5)
  const prompts = [
    document.getElementById("prompt0"), // Welcome
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3"),
    document.getElementById("prompt4"), // "You may enter. Click when ready."
    document.getElementById("prompt5")  // New additional prompt (set as invite if this is your final one)
  ].filter(Boolean); // drop any nulls without breaking order

  console.log("🧩 Elements found:", { overlay, temple, title, shaderW, metatron, bg, audioUI, promptsLen: prompts.length });

  // ------- Flags -------
  let readyForClick = false;
  let sequenceStarted = false;

  // ------- Initial states (no flicker, no early clicks) -------
  gsap.set([title, ...prompts], { autoAlpha: 0, clearProps: "transform" });
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
      window.AHShader.reveal({ beams: true }); // hint for "whose light beams"
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
      // Add visual hint on the overlay/document
      if (overlay) gsap.set(overlay, { cursor: "pointer" });
    }
  });

  // 1) Title fade & glow (no zoom)
  tl.to(title, { autoAlpha: 1, duration: 1.2 })
    .to(title, { color: "hsl(268, 30%, 85%)", duration: 0.8 }, "<")
    .to(title, { color: "hsl(268, 50%, 60%)", duration: 1.0 });

  // 2) Prompt carousel — "breathe" out from center and back in
  prompts.forEach((p, idx) => {
    if (!p) return;
    
    // Determine if this is the final invite prompt (now could be prompt5 instead of prompt4)
    const isInvite = (idx === prompts.length - 1) || (p.id === "prompt4" && !document.getElementById("prompt5"));
    
    // "Breathe out" - scale from 0 (center point) to 1 (full size)
    tl.fromTo(p,
      { 
        autoAlpha: 0, 
        scale: 0,      // Start from center point (as if emerging from Metatron)
        y: 0 
      },
      { 
        autoAlpha: 1, 
        scale: 1,      // Expand to full size
        y: 0, 
        duration: 1.2, 
        ease: "power2.out" 
      }
    );
    
    if (!isInvite) {
      // "Breathe back in" - scale back to 0 while fading
      tl.to(p, { 
        autoAlpha: 0, 
        scale: 0,      // Contract back to center
        duration: 0.8, 
        ease: "power2.in" 
      }, "+=1.0");
    } else {
      // The invite stays visible at full size
      // Just ensure it remains at scale 1
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

    // Hide invite prompt (could be prompt4 or prompt5 now)
    const invite = prompts[prompts.length - 1];
    if (invite) gsap.to(invite, { autoAlpha: 0, scale: 0, duration: 0.3 });

    // Remove overlay → start shader beams → dissolve temple → scale Metatron 20→30vw → sound up
    const clickTl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

    // Remove overlay
    if (overlay) clickTl.to(overlay, { autoAlpha: 0, duration: 0.5 });

    // Start shader beams
    clickTl.add(revealShader, ">");

    // Dissolve temple
    if (temple) clickTl.to(temple, { autoAlpha: 0, duration: 0.9 }, ">-0.1");

    // Scale Metatron 20→30vw
    if (metatron) {
      // If you control Metatron by vw via CSS, apply a transform scale as a visual match.
      // Compute scale ratio ~ 30/20 = 1.5
      clickTl.fromTo(metatron, { scale: 1 }, { scale: 1.5, duration: 1.2 }, ">-0.2");
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
