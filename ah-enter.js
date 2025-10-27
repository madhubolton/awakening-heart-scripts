/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening (v4.5)
  Ultra-aggressive fixes for CSS override issues
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💠 Oracle Opening init v4.5");

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

  // DEBUG: Verify we found the elements
  console.log("Found title?", !!title);
  console.log("Found enter button?", !!enterBtn);

  // --- ULTRA AGGRESSIVE CSS OVERRIDE ---
  // Create a style tag to override ANY CSS
  const styleOverride = document.createElement('style');
  styleOverride.textContent = `
    #temple-enter-button {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    #ah-title {
      transform: scale(1) !important;
      animation: none !important;
      transition: none !important;
    }
    .oracle-opening-active #temple-enter-button {
      display: block !important;
    }
  `;
  document.head.appendChild(styleOverride);

  // Add class to body for controlled reveal
  document.body.classList.add('oracle-opening-init');

  // --- Apply inline styles as backup ---
  if (enterBtn) {
    enterBtn.setAttribute('style', 
      'display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important;'
    );
  }

  if (title) {
    // Reset any transform and lock scale
    title.style.cssText += 
      'transform: scale(1) translateX(0) translateY(0) !important; animation: none !important; transition: none !important; opacity: 0 !important;';
  }

  // First-paint states for other elements
  prompts.forEach(p => { if (p) p.style.opacity = "0"; });
  if (shaderW)  shaderW.style.opacity = "0";
  if (audioUI)  { audioUI.style.opacity = "0"; audioUI.style.pointerEvents = "none"; }
  if (bg)       { bg.pause(); bg.volume = 0; bg.muted = false; }

  // GSAP settings - force overwrite existing tweens
  gsap.config({ force3D: false });
  
  if (title) {
    gsap.killTweensOf(title); // Kill any existing tweens
    gsap.set(title, { 
      clearProps: "all", // Clear any GSAP transforms first
      autoAlpha: 0,
      scale: 1,
      x: 0,
      y: 0,
      rotation: 0,
      transformOrigin: "50% 50%"
    });
  }

  prompts.forEach(p => p && gsap.set(p, { autoAlpha: 0, scale: 1 }));
  
  if (enterBtn) {
    gsap.killTweensOf(enterBtn);
    gsap.set(enterBtn, { 
      autoAlpha: 0,
      immediateRender: true
    });
  }

  if (shaderW)  gsap.set(shaderW, { autoAlpha: 0 });
  if (audioUI)  gsap.set(audioUI, { autoAlpha: 0 });

  let globalClicksEnabled = false;

  // ===== OPENING TIMELINE =====
  const tl = gsap.timeline({ 
    defaults: { ease: "sine.inOut" },
    onStart: () => console.log("Timeline started")
  });

  // 1) Stillness
  tl.to({}, { duration: 1.0 });

  // 2) Title: ONLY opacity, NO scale changes
  if (title) {
    // Remove the important opacity override for animation
    tl.add(() => {
      title.style.opacity = ""; // Remove inline opacity
    });
    
    tl.fromTo(title, 
      { 
        autoAlpha: 0,
        scale: 1  // Start at scale 1
      },
      { 
        autoAlpha: 1,
        scale: 1,  // End at scale 1 (no change!)
        duration: 1.0,
        ease: "power2.out",
        overwrite: "auto"
      }
    )
    .to(title, { 
      color: "hsl(268, 60%, 85%)", 
      textShadow: "0 0 20px rgba(180,150,255,0.8)",
      scale: 1,  // Maintain scale
      duration: 1.0,
      overwrite: "auto"
    })
    .to(title, { 
      color: "hsl(268, 50%, 60%)", 
      textShadow: "none",
      scale: 1,  // Still scale 1
      duration: 1.0,
      overwrite: "auto"
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

  // 4) Reveal Enter button ONLY after prompts
  if (enterBtn) {
    tl.add(() => {
      console.log("Revealing Enter button");
      // Remove the override styles
      enterBtn.removeAttribute('style');
      document.body.classList.add('oracle-opening-active');
      
      // Apply display block with GSAP
      gsap.set(enterBtn, {
        display: "block",
        opacity: 0,
        visibility: "visible",
        pointerEvents: "auto"
      });
    });
    
    tl.to(enterBtn, { 
      opacity: 1,
      duration: 1.0,
      ease: "power2.out",
      onComplete: () => {
        globalClicksEnabled = true;
        console.log("✨ Enter ready");
      }
    });
  }

  // Force timeline start after a brief delay to ensure DOM is ready
  setTimeout(() => {
    console.log("▶️ Starting opening timeline (delayed)");
    tl.play(0);
  }, 100);

  // ===== ENTER SEQUENCE =====
  async function activateEntry() {
    if (window.__AH_STARTED) return;
    window.__AH_STARTED = true;
    console.log("🚪 Oracle entered");

    const enterTL = gsap.timeline({ defaults: { ease: "sine.inOut" } });

    if (enterBtn) enterTL.set(enterBtn, { autoAlpha: 0, display: "none" });
    if (overlay) enterTL.to(overlay, { autoAlpha: 0, duration: 0.8 }, 0);
    if (temple)  enterTL.to(temple,  { autoAlpha: 0, duration: 1.0 }, 0.2);
    if (title) enterTL.to(title, { autoAlpha: 0, scale: 1, duration: 0.8 }, 0);
    if (metatron) enterTL.to(metatron, { scale: 0.3, duration: 2.0, ease: "power3.inOut" }, 0.1);
    if (shaderW) enterTL.to(shaderW, { autoAlpha: 1, duration: 1.5 }, "-=0.8");

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

    if (audioUI) enterTL.to(audioUI, { autoAlpha: 1, duration: 0.8, pointerEvents: "auto" }, "-=0.5");
  }

  // Event handlers
  enterBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    activateEntry();
  });

  document.addEventListener("click", (e) => {
    if (!globalClicksEnabled) return;
    if (audioUI?.contains(e.target)) return;
    if (enterBtn) gsap.to(enterBtn, { autoAlpha: 0, display: "none", duration: 0.2 });
    activateEntry();
  });

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
