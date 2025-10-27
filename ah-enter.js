/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence (Refined)
  Version 4.1 | 2025-10-27
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💠 Awakening Heart : Oracle Opening initialized");

  // ---- Element References ----
  const overlay   = document.getElementById("oracleOverlay") || document.getElementById("overlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const prompts   = [
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3")
  ];
  const metatron  = document.querySelector(".Metatron");
  const enterBtn  = document.getElementById("temple-enter-button");
  const shaderW   = document.querySelector(".shader-wrapper");
  const bg        = document.getElementById("bgMusic");
  const audioUI   = document.querySelector(".audio-buttons");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  console.log("🎬 Elements found:", { overlay, temple, title, prompts, metatron, enterBtn, shaderW, bg });

  // ---- Initial States ----
  gsap.set([title, ...prompts, enterBtn], { autoAlpha: 0 });
  if (shaderW) gsap.set(shaderW, { autoAlpha: 0 });
  if (audioUI) gsap.set(audioUI, { autoAlpha: 0, pointerEvents: "none" });
  if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

  // ==============================================================
  //  OPENING TIMELINE
  // ==============================================================

  const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

  // 1️⃣ Scene opens – stillness
  tl.to({}, { duration: 1.0 });

  // 2️⃣ Title "Awakening Heart" simple fade and glow
  tl.to(title, { autoAlpha: 1, duration: 1.0, ease: "power2.out" })
    .to(title, {
      color: "hsl(268, 60%, 85%)",
      textShadow: "0 0 20px rgba(180,150,255,0.8)",
      duration: 0.8,
      ease: "power2.out"
    })
    .to(title, {
      color: "hsl(268, 50%, 60%)",
      textShadow: "none",
      duration: 1.0,
      ease: "power2.inOut"
    })
    .to({}, { duration: 0.5 }); // brief pause before prompts

  // 3️⃣ Reflection Prompts (smooth crossfade transitions)
  const promptBeat = (el, index) => {
    if (!el) return;
    const overlap = 0.2; // overlap for smoother crossfade
    tl.to(el, { autoAlpha: 1, scale: 1, duration: 0.8, ease: "power2.out" })
      .to({}, { duration: 2.0 }) // visible time
      .to(el, { autoAlpha: 0, scale: 0.9, duration: 0.8, ease: "power2.in" }, `-=${overlap}`);
  };
  prompts.forEach(promptBeat);

  // 4️⃣ Enter button fade-in AFTER prompts
  tl.to(enterBtn, {
    autoAlpha: 1,
    duration: 1.0,
    ease: "sine.inOut",
    onStart: () => {
      enterBtn.style.cursor = "pointer";
      enterBtn.style.pointerEvents = "auto";
    },
    onComplete: () => {
      console.log("✨ Oracle opening complete — Enter ready");
    }
  });

  // ---- Run timeline after fonts/layout ready ----
  window.addEventListener("load", () => {
    console.log("▶️ Starting Oracle opening timeline");
    tl.play(0);
  });

  // ==============================================================
  //  ENTER SEQUENCE  –  triggered by click
  // ==============================================================

  async function activateEntry() {
    if (window.__AH_STARTED) return;
    window.__AH_STARTED = true;
    console.log("🚪 Oracle entered");

    const enterTL = gsap.timeline({ defaults: { ease: "sine.inOut" } });

    // hide enter immediately
    if (enterBtn) enterTL.set(enterBtn, { autoAlpha: 0, pointerEvents: "none" });

    // dissolve overlay + temple
    if (overlay) enterTL.to(overlay, { autoAlpha: 0, duration: 0.8 }, 0);
    if (temple)  enterTL.to(temple,  { autoAlpha: 0, duration: 1.0 }, 0.2);

    // fade title
    enterTL.to(title, { autoAlpha: 0, duration: 0.8 }, 0);

    // Metatron forward motion
    if (metatron) enterTL.to(metatron, { scale: 0.3, duration: 2.0, ease: "power3.inOut" }, 0.1);

    // reveal shader
    if (shaderW) enterTL.to(shaderW, { autoAlpha: 1, duration: 1.5 }, "-=0.8");

    // start background music
    enterTL.add(async () => {
      if (!bg) return;
      try {
        await bg.play();
        gsap.to(bg, { volume: 0.35, duration: 1.2 });
        console.log("🎶 Audio started");
      } catch (err) {
        console.warn("Audio play blocked:", err);
      }
    }, "-=1.0");

    // show audio controls
    if (audioUI) enterTL.to(audioUI, { autoAlpha: 1, duration: 0.8, pointerEvents: "auto" }, "-=0.5");
  }

  // ---- Click listeners ----
  enterBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    activateEntry();
  });
  document.addEventListener("click", (e) => {
    if (!window.__AH_STARTED && !audioUI?.contains(e.target)) activateEntry();
  });

  // ---- Audio controls ----
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
