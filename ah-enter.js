/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version 5.6.11 | 2025-10-28
  - Adds #prompt0 “Welcome”
  - Hard initial states (no flicker)
  - Prompts zoom-from-center, then invite click
  - Click: remove overlay → shader beams on → dissolve temple
           → Metatron scale 20→30vw → audio fade up
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💖 Awakening Heart : Oracle Opening initialized (v5.6.6)");

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

  // Prompts (ensure these IDs exist in Webflow)
  const prompts = [
    document.getElementById("prompt0"), // Welcome
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3"),
    document.getElementById("prompt4")  // “You may enter. Click when ready.”
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

  // Helper to turn on shader beams if your shader module exposes reveal()
  const revealShader = () => {
    if (window.AHShader?.reveal) {
      window.AHShader.reveal({ beams: true }); // hint for “whose light beams”
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
      // The invitation (#prompt4) is the on-screen cue that clicking anywhere continues
      // We do NOT auto-hide it; it disappears as part of the click sequence below
    }
  });

  // 1) Title fade & glow (no zoom)
  tl.to(title, { autoAlpha: 1, duration: 1.2 })
    .to(title, { color: "hsl(268, 30%, 85%)", duration: 0.8 }, "<")
    .to(title, { color: "hsl(268, 50%, 60%)", duration: 1.0 });

  // 2) Prompt carousel — zoom-from-center for each, then fade away
  prompts.forEach((p, idx) => {
    if (!p) return;
    const isInvite = (p.id === "prompt4"); // “You may enter. Click when ready.”
    // Each prompt appears from center, then fades. The invite remains visible.
    tl.fromTo(p,
      { autoAlpha: 0, scale: 0.9, y: 8 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.9, ease: "sine.out" }
    );
    if (!isInvite) {
      tl.to(p, { autoAlpha: 0, duration: 0.6, ease: "sine.in" }, "+=1.0");
    } else {
      // leave the invite up and allow click-anywhere
      tl.add(() => {
        // make sure nothing else is clickable except the page itself
        gsap.set(document.documentElement, { cursor: "pointer" });
      }, "+=0.3");
    }
  });

  // ------- Click-anywhere to enter -------
  async function enterSequence() {
    if (sequenceStarted || !readyForClick) return;
    sequenceStarted = true;
    console.log("🚪 Oracle entered");

    // Hide invite prompt if it exists
    const invite = document.getElementById("prompt4");
    if (invite) gsap.to(invite, { autoAlpha: 0, duration: 0.3 });

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
