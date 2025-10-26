/*--------------------------------------------------------------
  Awakening Heart : Cinematic Opening Sequence
  Version 2.1 | 2025-10-27
  Corrected selectors for #prompt1–3 and .Metatron
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("🎞 ah-enter.js version 2.1 loaded");

  const overlay   = document.getElementById("oracleOverlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const metatron  = document.querySelector(".Metatron");
  const shaderW   = document.querySelector(".shader-wrapper");
  const bg        = document.getElementById("bgMusic");
  const enterBtn  = document.getElementById("temple-enter-button");
  const audioUI   = document.querySelector(".audio-buttons");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  // prompt elements use IDs, not classes
  const prompts = [
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3")
  ];

  console.log("🎬 Elements found:", { overlay, temple, title, prompts, metatron });

  // ✅ Diagnostic: check for any missing elements
  setTimeout(() => {
    const missing = [];
    if (!document.getElementById("ah-title")) missing.push("#ah-title");
    if (!document.querySelector(".Metatron")) missing.push(".Metatron");
    if (!document.getElementById("prompt1")) missing.push("#prompt1");
    if (!document.getElementById("prompt2")) missing.push("#prompt2");
    if (!document.getElementById("prompt3")) missing.push("#prompt3");

    if (missing.length) {
      console.warn("⚠️ Missing elements:", missing.join(", "));
    } else {
      console.log("✅ All key elements found, running timeline...");
    }
  }, 500);

  // (rest of your animation code below)
});

  // Initial state
  gsap.set([title, prompts, enterBtn], { autoAlpha: 0 });
  if (shaderW) gsap.set(shaderW, { autoAlpha: 0 });
  if (audioUI) gsap.set(audioUI, { autoAlpha: 0, pointerEvents: "none" });
  if (bg) { bg.pause(); bg.volume = 0; }

  // Master timeline
  const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

  // Scene hold
  tl.to({}, { duration: 1 });

  // Title flash-burn
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
    .to({}, { duration: 0.5 });

  // Prompts 1-3
  prompts.forEach((p, i) => {
    if (!p) return;
    tl.to(p, { autoAlpha: 1, scale: 0.5, duration: 0.01 })
      .to(p, { scale: 1, duration: 0.8, ease: "power2.out" })
      .to({}, { duration: 2 })
      .to(p, { scale: 0.3, autoAlpha: 0, duration: 0.8, ease: "power2.in" });
  });

  // Enter button appears
  tl.to(enterBtn, {
    autoAlpha: 1,
    duration: 1,
    ease: "sine.inOut",
    onStart: () => {
      enterBtn.style.cursor = "pointer";
      enterBtn.style.pointerEvents = "auto";
    }
  });

  // On-click: enter sequence
  async function activateEntry() {
    if (window.__AH_STARTED) return;
    window.__AH_STARTED = true;
    console.log("🚪 Enter clicked");

    if (enterBtn) enterBtn.style.pointerEvents = "none";

    const enterTL = gsap.timeline({ defaults: { ease: "sine.inOut" } });

    enterTL.to(metatron, { scale: 0.3, duration: 2, ease: "power3.inOut" }, 0);
    enterTL.to(title, { autoAlpha: 0, duration: 0.8 }, 0);
    enterTL.to(enterBtn, { autoAlpha: 0, duration: 0.6 }, 0.2);
    enterTL.to(temple, { autoAlpha: 0, duration: 1.2 }, 0.3);
    enterTL.to(shaderW, { autoAlpha: 1, duration: 1.5 }, "-=0.8");

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

    enterTL.to(audioUI, { autoAlpha: 1, duration: 0.8, pointerEvents: "auto" }, "-=0.5");
  }

  enterBtn?.addEventListener("click", activateEntry);

  btnSound?.addEventListener("click", async () => {
    if (!bg) return;
    if (bg.paused) await bg.play();
    gsap.to(bg, { volume: 0.35, duration: 0.3 });
  });
  btnMute?.addEventListener("click", () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
  });

  window.addEventListener("load", () => {
    console.log("🎬 Starting cinematic timeline");
    tl.play(0);
  });
});
