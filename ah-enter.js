/*--------------------------------------------------------------
  Awakening Heart : Oracle Entry Sequence (v5.2)
  --------------------------------------------------------------
  STRUCTURE:
  - #oracleOverlay        → Temple silhouette / overlay
  - #temple-container     → 3D temple base
  - #ah-title             → "Awakening Heart" title
  - #prompt1, #prompt2, #prompt3 → reflection prompts
  - #temple-enter-wrapper → Enter button wrapper DIV (not SVG)
  - .shader-wrapper       → Hidden shader background
  - #bgMusic              → Ambient background sound
  - .audio-buttons        → Sound control buttons
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("🪶 Awakening Heart : Oracle Opening initialized");

  // --- Element references ---
  const overlay   = document.getElementById("oracleOverlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const prompts   = [
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3")
  ];
  const enterBtn  = document.getElementById("temple-enter-wrapper");
  const shaderW   = document.querySelector(".shader-wrapper");
  const bg        = document.getElementById("bgMusic");
  const audioUI   = document.querySelector(".audio-buttons");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  console.log("✨ Elements found:", { overlay, temple, title, prompts, enterBtn });

  // --- Safety reset to avoid flicker ---
  gsap.set([title, ...prompts, shaderW, audioUI, enterBtn], {
    autoAlpha: 0,
    pointerEvents: "none"
  });
  if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

  // --- GSAP timeline for Oracle opening ---
  const tl = gsap.timeline({
    defaults: { ease: "sine.inOut" },
    onComplete: () => {
      console.log("✨ Oracle opening complete — Enter ready");
      gsap.to(enterBtn, { autoAlpha: 1, duration: 1, pointerEvents: "auto" });
      document.body.style.cursor = "pointer";
    }
  });

  tl.addLabel("start")
    // Title fade-in (no zoom)
    .to(title, { autoAlpha: 1, color: "#9666cc", duration: 1.2 }, "start+=0.5")
    // Title glow and fade to final color
    .to(title, { color: "#8359b2", duration: 1.5, ease: "sine.inOut" }, ">")
    .addLabel("prompts")
    // Prompts sequence
    .fromTo(prompts[0], { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8 }, "prompts+=0.2")
    .to(prompts[0], { autoAlpha: 0, scale: 0.8, duration: 0.6 }, "+=2.0")
    .fromTo(prompts[1], { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8 }, ">")
    .to(prompts[1], { autoAlpha: 0, scale: 0.8, duration: 0.6 }, "+=2.0")
    .fromTo(prompts[2], { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8 }, ">")
    .to(prompts[2], { autoAlpha: 0, scale: 0.8, duration: 0.6 }, "+=2.0")
    .addLabel("endPrompts");

  // --- Entry activation ---
  async function activateEntry() {
    if (window.__AH_STARTED) return;
    window.__AH_STARTED = true;
    console.log("🚪 Oracle entered");

    gsap.to(enterBtn, { autoAlpha: 0, duration: 0.6, pointerEvents: "none" });
    document.body.style.cursor = "default";

    if (overlay) await gsap.to(overlay, { autoAlpha: 0, duration: 1.2 });
    if (temple)  await gsap.to(temple, { autoAlpha: 0, duration: 1.2 });

    if (shaderW) gsap.to(shaderW, { autoAlpha: 1, duration: 1.5 });
    if (window.AHShader?.reveal) window.AHShader.reveal();

    // Audio start
    if (bg) {
      try {
        await bg.play();
        gsap.to(bg, { volume: 0.35, duration: 1.2 });
        console.log("🎶 Audio started");
      } catch (e) {
        console.warn("Audio play blocked:", e);
      }
    }

    // Reveal audio UI
    if (audioUI) gsap.to(audioUI, { autoAlpha: 1, duration: 0.8, pointerEvents: "auto" });
  }

  // --- Interaction handlers ---
  enterBtn?.addEventListener("click", (e) => { e.stopPropagation(); activateEntry(); });
  document.addEventListener("click", (e) => {
    if (!window.__AH_STARTED && !audioUI?.contains(e.target)) activateEntry();
  });

  // Sound controls
  btnSound?.addEventListener("click", async () => {
    if (bg?.paused) await bg.play();
    gsap.to(bg, { volume: 0.35, duration: 0.3 });
  });
  btnMute?.addEventListener("click", () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
  });
});
