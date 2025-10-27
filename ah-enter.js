/*--------------------------------------------------------------
  Awakening Heart : Oracle Entry Sequence (v5.6)
  --------------------------------------------------------------
  - Fix: prompt4 hidden on load
  - Fix: title no longer inherits prompt zoom animation
  - Keeps zoom-from-center emergence for prompts 1–3
  - Adds graceful invitation for prompt4
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("🪶 Awakening Heart : Oracle Opening initialized (v5.6)");

  // --- Core Elements ---
  const overlay   = document.getElementById("oracleOverlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const prompts   = [
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3"),
    document.getElementById("prompt4")
  ];
  const shaderW   = document.querySelector(".shader-wrapper");
  const bg        = document.getElementById("bgMusic");
  const audioUI   = document.querySelector(".audio-buttons");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  console.log("✨ Elements found:", { overlay, temple, title, prompts, shaderW, bg });

  // --- Reset all elements ---
  // Title has its own static transform origin and no scale
  gsap.set(title, {
    autoAlpha: 0,
    transformOrigin: "50% 50%",
    scale: 1,
    pointerEvents: "none"
  });

  // Prompts start centered and hidden
  gsap.set(prompts, {
    autoAlpha: 0,
    scale: 0.8,
    transformOrigin: "50% 50%",
    pointerEvents: "none"
  });

  gsap.set([shaderW, audioUI], { autoAlpha: 0, pointerEvents: "none" });
  if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

  // --- Timeline ---
  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onStart: () => console.log("🎞️ Oracle opening sequence started"),
    onComplete: () => console.log("✨ Oracle intro complete — ready for entry")
  });

  tl.addLabel("start")

    // Title fade-in only (no scale)
    .to(title, { autoAlpha: 1, color: "#9666cc", duration: 1.2 }, "start+=0.5")
    .to(title, { color: "#8359b2", duration: 1.5 }, ">")

    .addLabel("prompts")

    // Prompt 1
    .fromTo(prompts[0],
      { scale: 0.8, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.0, ease: "power2.out" },
      "prompts+=0.4"
    )
    .to(prompts[0], { autoAlpha: 0, scale: 0.9, duration: 0.6 }, "+=2.0")

    // Prompt 2
    .fromTo(prompts[1],
      { scale: 0.8, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.0, ease: "power2.out" },
      ">"
    )
    .to(prompts[1], { autoAlpha: 0, scale: 0.9, duration: 0.6 }, "+=2.0")

    // Prompt 3
    .fromTo(prompts[2],
      { scale: 0.8, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.0, ease: "power2.out" },
      ">"
    )
    .to(prompts[2], { autoAlpha: 0, scale: 0.9, duration: 0.6 }, "+=2.0")

    // Prompt 4 (invitation, fades in gently – no scale animation)
    .to(prompts[3], {
      autoAlpha: 1,
      duration: 1.2,
      ease: "sine.inOut",
      pointerEvents: "auto",
      onStart: () => {
        document.body.style.cursor = "pointer";
        console.log("🕊️ Invitation prompt visible — awaiting click");
      }
    }, "+=1.0");

  // --- Entry sequence ---
  async function activateEntry() {
    if (window.__AH_STARTED) return;
    window.__AH_STARTED = true;
    console.log("🚪 Oracle entered");

    document.body.style.cursor = "default";
    gsap.to(prompts[3], { autoAlpha: 0, duration: 0.8 });

    if (overlay) await gsap.to(overlay, { autoAlpha: 0, duration: 1.2 });
    if (temple)  await gsap.to(temple, { autoAlpha: 0, duration: 1.2 });

    if (shaderW) gsap.to(shaderW, { autoAlpha: 1, duration: 1.5 });
    if (window.AHShader?.reveal) window.AHShader.reveal();

    if (bg) {
      try {
        await bg.play();
        gsap.to(bg, { volume: 0.35, duration: 1.2 });
        console.log("🎶 Audio started");
      } catch (e) {
        console.warn("Audio play blocked:", e);
      }
    }

    if (audioUI) gsap.to(audioUI, { autoAlpha: 1, duration: 0.8, pointerEvents: "auto" });
  }

  // --- Click anywhere to enter ---
  document.addEventListener("click", (e) => {
    if (!window.__AH_STARTED && !audioUI?.contains(e.target)) activateEntry();
  });

  // --- Sound controls ---
  btnSound?.addEventListener("click", async () => {
    if (bg?.paused) await bg.play();
    gsap.to(bg, { volume: 0.35, duration: 0.3 });
  });
  btnMute?.addEventListener("click", () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
  });
});
