/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Single-file unified version
  Purpose : One-time opening for the Oracle experience.
  Version 4.0 | 2025-10-27
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
  //  OPENING TIMELINE  –  plays automatically once per session
  // ==============================================================

  const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

  // 1️⃣ Scene opens – stillness
  tl.to({}, { duration: 1.0 });

  // 2️⃣ Title "Awakening Heart" burn-in
  tl.to(title, { autoAlpha: 1, duration: 0.2 })
    .to(title, {
      scale: 1.3,
      color: "hsl(268, 60%, 90%)",
      textShadow: "0 0 24px rgba(180,150,255,0.85)",
      duration: 0.3,
      ease: "power2.out"
    })
    .to(title, {
      scale: 1,
      color: "hsl(268, 50%, 60%)",
      textShadow: "none",
      duration: 0.4,
      ease: "power2.inOut"
    })
    .to({}, { duration: 0.5 }); // quiet pause

  // 3️⃣ Reflection Prompts (one by one)
  const promptBeat = (el) => {
    if (!el) return;
    tl.to(el, { autoAlpha: 1, duration: 0.01, onStart: () => gsap.set(el, { scale: 0.5 }) })
      .to(el, { scale: 1, duration: 0.8, ease: "power2.out" })
      .to({}, { duration: 2.0 }) // visible
      .to(el, { scale: 0.3, autoAlpha: 0, duration: 0.8, ease: "power2.in" })
      .to({}, { duration: 0.2 }); // small gap
  };
  prompts.forEach(promptBeat);

  // 4️⃣ Enter button appears
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

  // ---- Run timeline after fonts and layout ready ----
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

    if (enterBtn) enterBtn.style.pointerEvents = "none";

    const enterTL = gsap.timeline({ defaults: { ease: "sine.inOut" } });

    // dissolve overlay + temple
    if (overlay) enterTL.to(overlay, { autoAlpha: 0, duration: 0.8 }, 0);
    if (temple)  enterTL.to(temple,  { autoAlpha: 0, duration: 1.0 }, 0.2);

    // fade title + enter
    enterTL.to(title, { autoAlpha: 0, duration: 0.8 }, 0);
    enterTL.to(enterBtn, { autoAlpha: 0, duration: 0.6 }, 0.1);

    // subtle Metatron forward motion
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
