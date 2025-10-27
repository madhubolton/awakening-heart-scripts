/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening (v4.3)
  Guarantees:
  - Enter hidden & disabled until prompts complete
  - Title fade/glow only (no scale)
  - Global click enabled only after Enter reveal
  - No first-paint flicker
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💠 Oracle Opening init v4.3");

  // Elements
  const overlay   = document.getElementById("oracleOverlay") || document.getElementById("overlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const prompts   = [ "prompt1", "prompt2", "prompt3" ].map(id => document.getElementById(id));
  const metatron  = document.querySelector(".Metatron");
  const enterBtn  = document.getElementById("temple-enter-button");
  const shaderW   = document.querySelector(".shader-wrapper");
  const bg        = document.getElementById("bgMusic");
  const audioUI   = document.querySelector(".audio-buttons");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  // --- Safety: kill any CSS transitions that could fight our states ---
  if (enterBtn) enterBtn.style.transition = "none";

  // --- First-paint states: avoid ANY flash ---
  if (title)    title.style.opacity = "0";
  prompts.forEach(p => { if (p) p.style.opacity = "0"; });
  if (enterBtn) { enterBtn.style.opacity = "0"; enterBtn.style.pointerEvents = "none"; enterBtn.style.visibility = "hidden"; }
  if (shaderW)  shaderW.style.opacity = "0";
  if (audioUI)  { audioUI.style.opacity = "0"; audioUI.style.pointerEvents = "none"; }
  if (bg)       { bg.pause(); bg.volume = 0; bg.muted = false; }

  // Also pin GSAP baselines (no scale surprises)
  if (title)   gsap.set(title,   { autoAlpha: 0, scale: 1 });
  prompts.forEach(p => p && gsap.set(p, { autoAlpha: 0, scale: 1 }));
  if (enterBtn) gsap.set(enterBtn,{ autoAlpha: 0 });
  if (shaderW)  gsap.set(shaderW, { autoAlpha: 0 });
  if (audioUI)  gsap.set(audioUI, { autoAlpha: 0 });

  let globalClicksEnabled = false;

  // ===== OPENING TIMELINE =====
  const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

  // 1) Stillness
  tl.to({}, { duration: 1.0 });

  // 2) Title: fade in -> glow -> settle  (NO SCALE)
  if (title) {
    tl.to(title, { autoAlpha: 1, duration: 1.0, ease: "power2.out" })
      .to(title, { color: "hsl(268, 60%, 85%)", textShadow: "0 0 20px rgba(180,150,255,0.8)", duration: 1.0 })
      .to(title, { color: "hsl(268, 50%, 60%)", textShadow: "none", duration: 1.0 })
      .to({}, { duration: 0.5 });
  }

  // 3) Prompts (centered stack assumed). Slight crossfade overlap.
  const showPrompt = (el) => {
    if (!el) return;
    tl.to(el, { autoAlpha: 1, duration: 0.6, ease: "power2.out" })
      .to({},  { duration: 2.0 })
      .to(el,  { autoAlpha: 0, duration: 0.6, ease: "power2.in" }, "-=0.2");
  };
  prompts.forEach(showPrompt);

  // 4) Reveal Enter ONLY after prompts, then enable global click
  if (enterBtn) {
    tl.add(() => {
      // make sure pointer/visibility are restored just-in-time
      enterBtn.style.visibility = "visible";
      enterBtn.style.cursor = "pointer";
      enterBtn.style.pointerEvents = "auto";
    });
    tl.to(enterBtn, { autoAlpha: 1, duration: 1.0, onComplete: () => {
      globalClicksEnabled = true;
      console.log("✨ Enter ready");
    }});
  }

  // Start after layout/fonts
  window.addEventListener("load", () => {
    console.log("▶️ Starting opening timeline");
    tl.play(0);
  });

  // ===== ENTER SEQUENCE =====
  async function activateEntry() {
    if (window.__AH_STARTED) return;
    window.__AH_STARTED = true;
    console.log("🚪 Oracle entered");

    const enterTL = gsap.timeline({ defaults: { ease: "sine.inOut" } });

    // Hide Enter immediately on any entry path
    if (enterBtn) enterTL.set(enterBtn, { autoAlpha: 0, pointerEvents: "none", visibility: "hidden" });

    // Dissolve overlay & temple
    if (overlay) enterTL.to(overlay, { autoAlpha: 0, duration: 0.8 }, 0);
    if (temple)  enterTL.to(temple,  { autoAlpha: 0, duration: 1.0 }, 0.2);

    // Fade title
    if (title) enterTL.to(title, { autoAlpha: 0, duration: 0.8 }, 0);

    // Subtle Metatron zoom-in
    if (metatron) enterTL.to(metatron, { scale: 0.3, duration: 2.0, ease: "power3.inOut" }, 0.1);

    // Reveal shader
    if (shaderW) enterTL.to(shaderW, { autoAlpha: 1, duration: 1.5 }, "-=0.8");

    // Start background audio
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

    // Show audio controls
    if (audioUI) enterTL.to(audioUI, { autoAlpha: 1, duration: 0.8, pointerEvents: "auto" }, "-=0.5");
  }

  // Button click
  enterBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    activateEntry();
  });

  // Global click: ONLY after Enter is revealed
  document.addEventListener("click", (e) => {
    if (!globalClicksEnabled) return;
    if (audioUI?.contains(e.target)) return; // ignore sound buttons
    // Hide Enter if it happens to be visible
    if (enterBtn) gsap.to(enterBtn, { autoAlpha: 0, duration: 0.2, onComplete: () => {
      enterBtn.style.pointerEvents = "none";
      enterBtn.style.visibility = "hidden";
    }});
    activateEntry();
  });

  // Audio controls
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
