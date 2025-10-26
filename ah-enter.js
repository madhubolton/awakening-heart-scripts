/*--------------------------------------------------------------
  Awakening Heart : Cinematic Opening Sequence
  Version 2.0 | 2025-10-27
  Structure: scene intro → title burn → 3 prompts → enter activation
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  const overlay   = document.getElementById("overlay") || document.getElementById("oracleOverlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const metatron  = document.querySelector(".metatron");
  const shaderW   = document.querySelector(".shader-wrapper");
  const bg        = document.getElementById("bgMusic");
  const enterBtn  = document.getElementById("temple-enter-button");
  const audioUI   = document.querySelector(".audio-buttons");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");
  const prompts   = [
    document.querySelector(".prompt1"),
    document.querySelector(".prompt2"),
    document.querySelector(".prompt3"),
  ];

  console.log("🎥 Cinematic sequence init", {overlay, temple, title, prompts, metatron});

  // Initial state -------------------------------------------------
  gsap.set([title, prompts, enterBtn], { autoAlpha: 0 });
  if (shaderW) gsap.set(shaderW, { autoAlpha: 0 });
  if (audioUI) gsap.set(audioUI, { autoAlpha: 0, pointerEvents: "none" });
  if (bg) { bg.pause(); bg.volume = 0; }

  // Master timeline -----------------------------------------------
  const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

  // 1. Scene opens
  tl.to({}, { duration: 1 }); // pause 1s for stillness

  // 2. Title flash-burn
  tl.to(title, { autoAlpha: 1, duration: 0.2 })
    .to(title, {
      scale: 1.3,
      color: "hsl(268, 25%, 100%)",
      textShadow: "0 0 20px rgba(180,150,255,0.8)",
      duration: 0.3,
      ease: "power2.out"
    })
    .to(title, {
      scale: 1,
      color: "hsl(268, 50%, 60%)",
      textShadow: "none",
      duration: 0.3,
      ease: "power2.inOut"
    })
    .to({}, { duration: 0.5 }); // pause 0.5s

  // 3–5. Prompts
  prompts.forEach((p, i) => {
    if (!p) return;
    tl.to(p, {
      autoAlpha: 1,
      scale: 0.5,
      duration: 0.01,
      onStart: () => gsap.set(p, { scale: 0.5 })
    })
      .to(p, {
        scale: 1,
        duration: 0.8,
        ease: "power2.out"
      })
      .to({}, { duration: 2 }) // pause visible
      .to(p, {
        scale: 0.3,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.in"
      });
  });

  // 6. Enter button appears
  tl.to(enterBtn, {
    autoAlpha: 1,
    duration: 1,
    ease: "sine.inOut",
    onStart: () => {
      enterBtn.style.cursor = "pointer";
      enterBtn.style.pointerEvents = "auto";
    }
  });

  // ---------------------------------------------------------------
  // Click interaction (enter sequence)
  async function activateEntry() {
    if (window.__AH_STARTED) return;
    window.__AH_STARTED = true;
    console.log("🚪 Enter clicked");

    if (enterBtn) enterBtn.style.pointerEvents = "none";

    // Make cinematic forward motion
    const enterTL = gsap.timeline({ defaults: { ease: "sine.inOut" } });

    // Move into temple
    enterTL.to(metatron, { scale: 0.3, duration: 2, ease: "power3.inOut" }, 0);
    enterTL.to(title, { autoAlpha: 0, duration: 0.8 }, 0);
    enterTL.to(enterBtn, { autoAlpha: 0, duration: 0.6 }, 0.2);
    enterTL.to(temple, { autoAlpha: 0, duration: 1.2 }, 0.3);

    // Reveal shader
    enterTL.to(shaderW, { autoAlpha: 1, duration: 1.5 }, "-=0.8");

    // Start background sound
    enterTL.add(async () => {
      if (bg) {
        try {
          await bg.play();
          gsap.to(bg, { volume: 0.35, duration: 1.2 });
          console.log("🎶 Audio started");
        } catch (err) {
          console.warn("Audio play blocked:", err);
        }
      }
    }, "-=1.2");

    // Fade in sound controls
    enterTL.to(audioUI, { autoAlpha: 1, duration: 0.8, pointerEvents: "auto" }, "-=0.5");
  }

  enterBtn?.addEventListener("click", activateEntry);

  // Sound controls
  btnSound?.addEventListener("click", async () => {
    if (!bg) return;
    if (bg.paused) await bg.play();
    gsap.to(bg, { volume: 0.35, duration: 0.3 });
  });
  btnMute?.addEventListener("click", () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
  });

  // Start the timeline after full load
  window.addEventListener("load", () => {
    console.log("🎬 Starting cinematic timeline");
    tl.play(0);
  });
});
