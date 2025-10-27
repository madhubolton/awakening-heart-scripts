/*--------------------------------------------------------------
 🌺 Awakening Heart : Oracle Opening (stable)
 v5.6.9 | fixes flicker, single-init, prompt timing, shader-before-temple,
 Metatron width 20→30vw on entry + audio fade
--------------------------------------------------------------*/

(() => {
  if (window.__AH_ENTER_INIT__) return;           // hard guard against double-load
  window.__AH_ENTER_INIT__ = true;

  document.addEventListener("DOMContentLoaded", () => {
    console.log("%c🌸 Awakening Heart : Oracle Opening initialized (v5.6.9)",
      "color:#b48ef5;font-weight:bold;");

    // ------- grab elements -------
    const overlay  = document.getElementById("oracleOverlay");
    const temple   = document.getElementById("temple-container");
    const title    = document.getElementById("ah-title");
    const shaderW  = document.querySelector(".shader-wrapper");
    const metatron = document.getElementById("metatron");  // <div id="metatron" class="Metatron">
    const audioUI  = document.querySelector(".audio-buttons");
    const bg       = document.getElementById("bgMusic");

    const prompts = [
      document.getElementById("prompt0"),  // Welcome
      document.getElementById("prompt1"),
      document.getElementById("prompt2"),
      document.getElementById("prompt3"),
      document.getElementById("prompt4")   // You may enter — click to continue
    ].filter(Boolean);

    // quick sanity log
    console.log("🧩 Elements:", { overlay, temple, title, shaderW, metatron, bg, prompts: prompts.length });

    // ------- start state / flicker kill -------
    gsap.set([title, ...prompts, shaderW, metatron], { autoAlpha: 0, visibility: "hidden" });
    if (audioUI) gsap.set(audioUI, { autoAlpha: 0, pointerEvents: "none" });
    if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

    // ------- timeline -------
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onStart:  () => console.log("📜 Oracle opening sequence started"),
      onComplete: () => console.log("✨ Oracle intro complete – ready for entry")
    });

    // 1) Title fade & gentle glow (no zoom)
    tl.set(title, { visibility: "visible" })
      .to(title, { autoAlpha: 1, duration: 1.2, ease: "sine.out" })
      .to(title, {
        color: "hsl(268,60%,90%)",
        textShadow: "0 0 24px rgba(180,120,255,0.6)",
        duration: 1.0
      })
      .to(title, {
        color: "hsl(268,45%,70%)",
        textShadow: "0 0 8px rgba(180,120,255,0.3)",
        duration: 0.8
      })
      .addPause("+=0.5");

    // helper for centered zoom feel
    const centerOpts = { transformOrigin: "50% 50%" };

    // 2) Prompts — crossfade zooms; 0 has no dwell, 1–3 dwell 5s; 4 stays
    prompts.forEach((p, i) => {
      const dwell = i === 0 ? 0 : 5;
      tl.fromTo(p,
        { ...centerOpts, scale: 0.86, autoAlpha: 0, visibility: "visible" },
        { scale: 1.0, autoAlpha: 1, duration: 1.2, ease: "power2.out" }
      );
      if (i < prompts.length - 1) {
        tl.addPause(`+=${dwell}`);
        tl.to(p, { ...centerOpts, scale: 1.22, autoAlpha: 0, duration: 1.2, ease: "power2.in" });
      }
    });

    // 3) Final prompt click → shader first, then dissolve temple, scale Metatron, start audio
    const finalPrompt = prompts[prompts.length - 1];
    if (finalPrompt) {
      finalPrompt.style.cursor = "pointer";
      finalPrompt.addEventListener("click", () => {
        console.log("🌌 Enter clicked — revealing shader, dissolving temple…");

        const enterTl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

        // reveal shader slightly before temple dissolve
        enterTl.to(shaderW, { autoAlpha: 1, visibility: "visible", duration: 1.0 }, 0)
          .add(() => { window.AHShader?.reveal?.(); }, 0)    // call if available; safe no-op otherwise
          .to(temple,  { autoAlpha: 0, duration: 1.4 }, "-=0.4")

          // Metatron appears and enlarges by width (20vw → 30vw), stays crisp
          .fromTo(metatron,
            { autoAlpha: 0, visibility: "visible", width: "20vw" },
            { autoAlpha: 1, width: "30vw", duration: 2.2, ease: "power2.out" },
            "-=0.6"
          )

          // audio fade in
          .add(() => {
            if (!bg) return;
            try {
              bg.currentTime = 0;
              bg.play().then(() => gsap.to(bg, { volume: 0.35, duration: 1.4 }))
                        .catch(e => console.warn("Audio blocked:", e));
            } catch (e) { console.warn("Audio error:", e); }
          }, "-=1.0")

          // optional: bring up audio controls if you want
          .to(audioUI || {}, { autoAlpha: 1, pointerEvents: "auto", duration: 0.6 }, "-=0.6");
      }, { once: true });
    }
  });
})();
