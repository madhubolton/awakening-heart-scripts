/*--------------------------------------------------------------
 🌺 Awakening Heart : Oracle Opening (ready-gated)
 v5.6.10 | Waits for geometry readiness before intro
--------------------------------------------------------------*/

(() => {
  if (window.__AH_ENTER_INIT__) return;
  window.__AH_ENTER_INIT__ = true;

  // --- Helper: Wait until all core modules are ready ---
  const waitForReady = async () => {
    let attempts = 0;
    while (attempts < 50) { // 5 seconds max
      if (window.AH_READY || (document.getElementById("metatron") && document.querySelector(".shader-wrapper"))) return;
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    console.warn("⚠️ AH_READY not detected after 5s – continuing anyway");
  };

  document.addEventListener("DOMContentLoaded", async () => {
    await waitForReady();

    console.log("%c🌸 Awakening Heart : Oracle Opening initialized (v5.6.10)", "color:#b48ef5;font-weight:bold;");

    const overlay  = document.getElementById("oracleOverlay");
    const temple   = document.getElementById("temple-container");
    const title    = document.getElementById("ah-title");
    const shaderW  = document.querySelector(".shader-wrapper");
    const metatron = document.getElementById("metatron");
    const audioUI  = document.querySelector(".audio-buttons");
    const bg       = document.getElementById("bgMusic");

    const prompts = [
      document.getElementById("prompt0"),
      document.getElementById("prompt1"),
      document.getElementById("prompt2"),
      document.getElementById("prompt3"),
      document.getElementById("prompt4")
    ].filter(Boolean);

    console.log("🧩 Elements:", { overlay, temple, title, shaderW, metatron, bg, prompts: prompts.length });

    gsap.set([title, ...prompts, shaderW, metatron], { autoAlpha: 0, visibility: "hidden" });
    if (audioUI) gsap.set(audioUI, { autoAlpha: 0, pointerEvents: "none" });
    if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onStart:  () => console.log("📜 Oracle opening sequence started"),
      onComplete: () => console.log("✨ Oracle intro complete – ready for entry")
    });

    // Title
    tl.set(title, { visibility: "visible" })
      .to(title, { autoAlpha: 1, duration: 1.2 })
      .to(title, { color: "hsl(268,60%,90%)", textShadow: "0 0 24px rgba(180,120,255,0.6)", duration: 1.0 })
      .to(title, { color: "hsl(268,45%,70%)", textShadow: "0 0 8px rgba(180,120,255,0.3)", duration: 0.8 })
      .addPause("+=0.5");

    // Prompts
    const centerOpts = { transformOrigin: "50% 50%" };
    prompts.forEach((p, i) => {
      const dwell = i === 0 ? 0 : 5;
      tl.fromTo(p,
        { ...centerOpts, scale: 0.86, autoAlpha: 0, visibility: "visible" },
        { scale: 1.0, autoAlpha: 1, duration: 1.2 }
      );
      if (i < prompts.length - 1) {
        tl.addPause(`+=${dwell}`);
        tl.to(p, { ...centerOpts, scale: 1.22, autoAlpha: 0, duration: 1.2 });
      }
    });

    // Final click
    const finalPrompt = prompts[prompts.length - 1];
    if (finalPrompt) {
      finalPrompt.style.cursor = "pointer";
      finalPrompt.addEventListener("click", () => {
        console.log("🌌 Enter clicked — revealing shader, dissolving temple…");
        const enterTl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

        enterTl.to(shaderW, { autoAlpha: 1, visibility: "visible", duration: 1.0 }, 0)
          .add(() => { window.AHShader?.reveal?.(); }, 0)
          .to(temple, { autoAlpha: 0, duration: 1.4 }, "-=0.4")
          .fromTo(metatron,
            { autoAlpha: 0, visibility: "visible", width: "20vw" },
            { autoAlpha: 1, width: "30vw", duration: 2.2, ease: "power2.out" },
            "-=0.6"
          )
          .add(() => {
            if (!bg) return;
            try {
              bg.currentTime = 0;
              bg.play().then(() => gsap.to(bg, { volume: 0.35, duration: 1.4 }))
                        .catch(e => console.warn("Audio blocked:", e));
            } catch (e) { console.warn("Audio error:", e); }
          }, "-=1.0");
      }, { once: true });
    }
  });
})();
