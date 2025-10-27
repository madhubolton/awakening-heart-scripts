/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening (v4.4)
  Fixes:
  - Force Enter button fully hidden at start
  - Explicitly prevent title scaling
  - Kill any CSS animations that might interfere
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💠 Oracle Opening init v4.4");

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

  // --- KILL ALL CSS ANIMATIONS/TRANSITIONS ---
  // This prevents CSS from fighting with GSAP
  if (enterBtn) {
    enterBtn.style.transition = "none !important";
    enterBtn.style.animation = "none !important";
  }
  if (title) {
    title.style.transition = "none !important";
    title.style.animation = "none !important";
    title.style.transform = "none !important"; // Kill any CSS transforms
  }

  // --- FORCE ENTER BUTTON FULLY HIDDEN ---
  if (enterBtn) { 
    enterBtn.style.opacity = "0";
    enterBtn.style.pointerEvents = "none";
    enterBtn.style.visibility = "hidden";
    enterBtn.style.display = "none"; // ADD THIS - most aggressive hiding
  }

  // --- First-paint states ---
  if (title)    title.style.opacity = "0";
  prompts.forEach(p => { if (p) p.style.opacity = "0"; });
  if (shaderW)  shaderW.style.opacity = "0";
  if (audioUI)  { audioUI.style.opacity = "0"; audioUI.style.pointerEvents = "none"; }
  if (bg)       { bg.pause(); bg.volume = 0; bg.muted = false; }

  // --- GSAP baselines with explicit scale lock ---
  if (title) {
    gsap.set(title, { 
      autoAlpha: 0, 
      scale: 1,
      transformOrigin: "center center",
      force3D: false  // Prevent 3D transform layers
    });
  }
  prompts.forEach(p => p && gsap.set(p, { autoAlpha: 0, scale: 1 }));
  if (enterBtn) gsap.set(enterBtn, { 
    autoAlpha: 0,
    display: "none"  // Keep it display:none initially
  });
  if (shaderW)  gsap.set(shaderW, { autoAlpha: 0 });
  if (audioUI)  gsap.set(audioUI, { autoAlpha: 0 });

  let globalClicksEnabled = false;

  // ===== OPENING TIMELINE =====
  const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

  // 1) Stillness
  tl.to({}, { duration: 1.0 });

  // 2) Title: fade ONLY (explicitly no scale)
  if (title) {
    tl.to(title, { 
      autoAlpha: 1, 
      scale: 1,  // Explicitly maintain scale: 1
      duration: 1.0, 
      ease: "power2.out" 
    })
    .to(title, { 
      color: "hsl(268, 60%, 85%)", 
      textShadow: "0 0 20px rgba(180,150,255,0.8)", 
      scale: 1,  // Keep enforcing scale: 1
      duration: 1.0 
    })
    .to(title, { 
      color: "hsl(268, 50%, 60%)", 
      textShadow: "none",
      scale: 1,  // Still scale: 1
      duration: 1.0 
    })
    .to({}, { duration: 0.5 });
  }

  // 3) Prompts
  const showPrompt = (el) => {
    if (!el) return;
    tl.to(el, { autoAlpha: 1, duration: 0.6, ease: "power2.out" })
      .to({},  { duration: 2.0 })
      .to(el,  { autoAlpha: 0, duration: 0.6, ease: "power2.in" }, "-=0.2");
  };
  prompts.forEach(showPrompt);

  // 4) Reveal Enter ONLY after prompts complete
  if (enterBtn) {
    tl.add(() => {
      // First restore display
      enterBtn.style.display = "block";
      gsap.set(enterBtn, { display: "block" });
      
      // Then restore interaction properties
      enterBtn.style.visibility = "visible";
      enterBtn.style.cursor = "pointer";
      enterBtn.style.pointerEvents = "auto";
    });
    tl.to(enterBtn, { 
      autoAlpha: 1, 
      duration: 1.0, 
      onComplete: () => {
        globalClicksEnabled = true;
        console.log("✨ Enter ready");
      }
    });
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

    // Hide Enter immediately
    if (enterBtn) enterTL.set(enterBtn, { 
      autoAlpha: 0, 
      pointerEvents: "none", 
      visibility: "hidden",
      display: "none"
    });

    // Dissolve overlay & temple
    if (overlay) enterTL.to(overlay, { autoAlpha: 0, duration: 0.8 }, 0);
    if (temple)  enterTL.to(temple,  { autoAlpha: 0, duration: 1.0 }, 0.2);

    // Fade title (maintain scale)
    if (title) enterTL.to(title, { autoAlpha: 0, scale: 1, duration: 0.8 }, 0);

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

  // Global click
  document.addEventListener("click", (e) => {
    if (!globalClicksEnabled) return;
    if (audioUI?.contains(e.target)) return;
    if (enterBtn) gsap.to(enterBtn, { 
      autoAlpha: 0, 
      display: "none",
      duration: 0.2
    });
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
